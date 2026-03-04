import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID || ''
const GOVBR_CLIENT_SECRET = process.env.GOVBR_CLIENT_SECRET || ''
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''

// Staging for dev, production for prod
const isProduction = process.env.GOVBR_ENV === 'production'
const GOVBR_TOKEN_URL = isProduction
  ? 'https://sso.acesso.gov.br/token'
  : 'https://sso.staging.acesso.gov.br/token'
const GOVBR_USERINFO_URL = isProduction
  ? 'https://sso.acesso.gov.br/userinfo'
  : 'https://sso.staging.acesso.gov.br/userinfo'

/**
 * Decode JWT payload without verifying signature.
 * For id_token claims extraction — signature should be verified
 * against Gov.br JWK in production for full security.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')
  const payload = parts[1]
  // Base64url decode
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = Buffer.from(padded, 'base64').toString('utf-8')
  return JSON.parse(json)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code || !GOVBR_CLIENT_ID || !GOVBR_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=govbr_unavailable', request.url))
  }

  // Validate state (CSRF protection)
  const cookieStore = await cookies()
  const savedState = cookieStore.get('govbr_state')?.value
  const codeVerifier = cookieStore.get('govbr_code_verifier')?.value
  const savedNonce = cookieStore.get('govbr_nonce')?.value

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }

  // Clean up PKCE cookies
  cookieStore.delete('govbr_state')
  cookieStore.delete('govbr_code_verifier')
  cookieStore.delete('govbr_nonce')

  try {
    // 1. Exchange code for tokens (access_token + id_token)
    const basicAuth = Buffer.from(`${GOVBR_CLIENT_ID}:${GOVBR_CLIENT_SECRET}`).toString('base64')

    const tokenRes = await fetch(GOVBR_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: GOVBR_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      console.error('Gov.br token error:', tokenRes.status, await tokenRes.text())
      return NextResponse.redirect(new URL('/login?error=govbr_token_failed', request.url))
    }

    const tokenData = await tokenRes.json()
    const { access_token, id_token } = tokenData

    // 2. Extract user data from id_token (preferred) or fallback to userinfo
    let cpf = ''
    let email = ''
    let nome = ''
    let telefone: string | null = null

    if (id_token) {
      try {
        const claims = decodeJwtPayload(id_token)

        // Validate id_token claims per OpenID Connect spec
        if (claims.aud !== GOVBR_CLIENT_ID) {
          console.error('Gov.br id_token: aud mismatch', claims.aud)
          return NextResponse.redirect(new URL('/login?error=govbr_token_failed', request.url))
        }

        if (savedNonce && claims.nonce !== savedNonce) {
          console.error('Gov.br id_token: nonce mismatch')
          return NextResponse.redirect(new URL('/login?error=govbr_token_failed', request.url))
        }

        const exp = claims.exp as number
        if (exp && Date.now() / 1000 > exp) {
          console.error('Gov.br id_token: expired')
          // id_token expires in 60s per Gov.br spec — fallback to userinfo
        } else {
          cpf = ((claims.sub as string) || '').replace(/\D/g, '')
          email = (claims.email as string) || ''
          nome = (claims.name as string) || (claims.social_name as string) || ''
          telefone = (claims.phone_number as string) || null
        }
      } catch (e) {
        console.error('Gov.br id_token decode error:', e)
      }
    }

    // Fallback: fetch from userinfo endpoint if id_token didn't provide data
    if (!cpf && access_token) {
      const userRes = await fetch(GOVBR_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      if (!userRes.ok) {
        return NextResponse.redirect(new URL('/login?error=govbr_userinfo_failed', request.url))
      }

      const govUser = await userRes.json()
      cpf = (govUser.sub || '').replace(/\D/g, '')
      email = govUser.email || ''
      nome = govUser.name || govUser.social_name || ''
      telefone = govUser.phone_number || null
    }

    if (!cpf) {
      return NextResponse.redirect(new URL('/login?error=govbr_no_cpf', request.url))
    }

    // Use CPF-based email fallback if Gov.br didn't provide one
    if (!email) {
      email = `${cpf}@govbr.local`
    }

    const supabase = createServiceClient()

    // 3. Search for existing profile by CPF
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf_cnpj', cpf)
      .single()

    let userEmail: string

    if (existingProfile) {
      // User already exists — get their auth email for magic link
      const { data: authUser } = await supabase.auth.admin.getUserById(existingProfile.id)
      userEmail = authUser?.user?.email || email
    } else {
      // 4. Create new auth user + profile (global proponente)
      const tempPassword = crypto.randomUUID()
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome,
          cpf_cnpj: cpf,
          telefone,
          role: 'proponente',
          tenant_id: null,
          govbr: true,
        },
      })

      if (signUpError || !newUser.user) {
        console.error('Gov.br signup error:', signUpError)
        return NextResponse.redirect(new URL('/login?error=govbr_signup_failed', request.url))
      }

      userEmail = email

      // Update profile with Gov.br data
      await supabase
        .from('profiles')
        .update({
          nome,
          cpf_cnpj: cpf,
          telefone,
          consentimento_lgpd: true,
          data_consentimento: new Date().toISOString(),
        })
        .eq('id', newUser.user.id)
    }

    // 5. Generate a magic link to establish Supabase session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    })

    if (linkError || !linkData) {
      console.error('Gov.br magic link error:', linkError)
      return NextResponse.redirect(new URL('/login?error=govbr_session_failed', request.url))
    }

    // Redirect to Supabase verify endpoint to set session cookie
    const linkUrl = new URL(linkData.properties.action_link)
    const token = linkUrl.searchParams.get('token')
    const type = linkUrl.searchParams.get('type') || 'magiclink'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const dashboardUrl = new URL('/dashboard', request.url).toString()
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(dashboardUrl)}`

    return NextResponse.redirect(verifyUrl)
  } catch (err) {
    console.error('Gov.br callback error:', err)
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }
}
