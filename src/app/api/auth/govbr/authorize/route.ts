import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''

// Staging for dev, production for prod
const GOVBR_AUTH_URL = process.env.GOVBR_ENV === 'production'
  ? 'https://sso.acesso.gov.br/authorize'
  : 'https://sso.staging.acesso.gov.br/authorize'

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = ''
  for (const byte of buffer) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function GET() {
  if (!GOVBR_CLIENT_ID) {
    return NextResponse.json({ enabled: false })
  }

  // Generate PKCE pair
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = crypto.randomUUID()
  const nonce = crypto.randomUUID()

  // Store code_verifier and state in httpOnly cookies for the callback
  const cookieStore = await cookies()
  cookieStore.set('govbr_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  cookieStore.set('govbr_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOVBR_CLIENT_ID,
    scope: 'openid email phone profile govbr_confiabilidades',
    redirect_uri: GOVBR_REDIRECT_URI,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.json({
    enabled: true,
    url: `${GOVBR_AUTH_URL}?${params.toString()}`,
  })
}
