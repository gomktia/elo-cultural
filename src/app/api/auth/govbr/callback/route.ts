import { NextRequest, NextResponse } from 'next/server'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID
const GOVBR_CLIENT_SECRET = process.env.GOVBR_CLIENT_SECRET
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''
const GOVBR_TOKEN_URL = 'https://sso.acesso.gov.br/token'
const GOVBR_USERINFO_URL = 'https://sso.acesso.gov.br/userinfo'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code || !GOVBR_CLIENT_ID || !GOVBR_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=govbr_unavailable', request.url))
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch(GOVBR_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: GOVBR_REDIRECT_URI,
        client_id: GOVBR_CLIENT_ID,
        client_secret: GOVBR_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=govbr_token_failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // 2. Fetch user info from gov.br
    const userRes = await fetch(GOVBR_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=govbr_userinfo_failed', request.url))
    }

    const govUser = await userRes.json()
    // govUser contains: sub (CPF), name, email, phone_number, picture
    // govUser.govbr_confiabilidades contains trust level (bronze/prata/ouro)

    // TODO: When gov.br credentials are available, implement:
    // 1. Search profiles by cpf_cnpj = govUser.sub (CPF)
    // 2. If found: create Supabase session for that user
    // 3. If not found: create new proponente (global, tenant_id = NULL)
    //    with data from gov.br (nome, email, cpf, telefone)
    // 4. Redirect to /dashboard

    // For now, redirect with info message
    return NextResponse.redirect(new URL('/login?msg=govbr_em_breve', request.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }
}
