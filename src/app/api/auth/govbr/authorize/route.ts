import { NextResponse } from 'next/server'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''
const GOVBR_AUTH_URL = 'https://sso.acesso.gov.br/authorize'

export async function GET() {
  if (!GOVBR_CLIENT_ID) {
    return NextResponse.json({ enabled: false })
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOVBR_CLIENT_ID,
    scope: 'openid email phone profile govbr_confiabilidades',
    redirect_uri: GOVBR_REDIRECT_URI,
    state: crypto.randomUUID(),
  })

  return NextResponse.json({
    enabled: true,
    url: `${GOVBR_AUTH_URL}?${params.toString()}`,
  })
}
