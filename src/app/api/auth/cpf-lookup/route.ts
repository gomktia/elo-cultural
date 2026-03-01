import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 5 lookups per minute per IP
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`cpf-lookup:${ip}`, { limit: 5, windowSeconds: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em breve.' }, { status: 429 })
  }

  // Auth check: only authenticated users can look up CPFs
  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { cpf } = await request.json()

  if (!cpf || typeof cpf !== 'string') {
    return NextResponse.json({ error: 'CPF invalido' }, { status: 400 })
  }

  // Normaliza: remove tudo que nao e digito
  const cpfLimpo = cpf.replace(/\D/g, '')

  if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
    return NextResponse.json({ error: 'CPF/CNPJ invalido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Busca pelo cpf_cnpj (limpo ou formatado)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .or(`cpf_cnpj.eq.${cpfLimpo},cpf_cnpj.eq.${formatCpf(cpfLimpo)},cpf_cnpj.eq.${formatCnpj(cpfLimpo)}`)
    .limit(1)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'CPF/CNPJ nao encontrado' }, { status: 404 })
  }

  // Buscar email via auth.admin usando service role
  const { data: { user: foundUser } } = await supabase.auth.admin.getUserById(profile.id)

  if (!foundUser?.email) {
    return NextResponse.json({ error: 'Email nao encontrado para este CPF' }, { status: 404 })
  }

  return NextResponse.json({ email: foundUser.email })
}

function formatCpf(digits: string): string {
  if (digits.length !== 11) return digits
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}
