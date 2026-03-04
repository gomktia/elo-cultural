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

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code || !GOVBR_CLIENT_ID || !GOVBR_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=govbr_unavailable', request.url))
  }

  // Validate state to prevent CSRF
  const cookieStore = await cookies()
  const savedState = cookieStore.get('govbr_state')?.value
  const codeVerifier = cookieStore.get('govbr_code_verifier')?.value

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }

  // Clean up PKCE cookies
  cookieStore.delete('govbr_state')
  cookieStore.delete('govbr_code_verifier')

  try {
    // 1. Exchange code for token using Basic auth + PKCE
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

    const { access_token } = await tokenRes.json()

    // 2. Fetch user info from gov.br (use access_token, never id_token)
    const userRes = await fetch(GOVBR_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=govbr_userinfo_failed', request.url))
    }

    const govUser = await userRes.json()
    // govUser: { sub: CPF, name, email, phone_number, picture }

    const cpf = govUser.sub?.replace(/\D/g, '') || ''
    const email = govUser.email || `${cpf}@govbr.local`
    const nome = govUser.name || ''
    const telefone = govUser.phone_number || null

    if (!cpf) {
      return NextResponse.redirect(new URL('/login?error=govbr_no_cpf', request.url))
    }

    const supabase = createServiceClient()

    // 3. Search for existing profile by CPF
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf_cnpj', cpf)
      .single()

    let userId: string
    let userEmail: string

    if (existingProfile) {
      // User already exists — get their auth email
      userId = existingProfile.id
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
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

      userId = newUser.user.id
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
        .eq('id', userId)
    }

    // 5. Generate a magic link to sign the user in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    })

    if (linkError || !linkData) {
      console.error('Gov.br magic link error:', linkError)
      return NextResponse.redirect(new URL('/login?error=govbr_session_failed', request.url))
    }

    // Redirect to Supabase verify endpoint to establish session
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
