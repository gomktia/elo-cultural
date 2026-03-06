'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { ADMIN_ROLES } from '@/lib/constants/roles'
import { revalidatePath } from 'next/cache'

export async function assinarDecisao(recursoId: string, editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, nome, cpf_cnpj')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissao para assinar decisoes' }
  }

  // Load the recurso with its decision
  const { data: recurso, error: recursoError } = await supabase
    .from('recursos')
    .select('id, status, decisao, data_decisao, decidido_por')
    .eq('id', recursoId)
    .single()

  if (recursoError || !recurso) {
    return { error: 'Recurso nao encontrado' }
  }

  if (!recurso.decisao || (recurso.status !== 'deferido' && recurso.status !== 'indeferido' && recurso.status !== 'deferido_parcial')) {
    return { error: 'Recurso ainda nao possui decisao registrada' }
  }

  // Check if already signed
  const { data: existingSignature } = await supabase
    .from('assinaturas_digitais')
    .select('id')
    .eq('documento_tipo', 'decisao_recurso')
    .eq('documento_id', recursoId)
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (existingSignature) {
    return { error: 'Decisao ja assinada por este usuario' }
  }

  // Build content string for hashing
  const content = [
    recurso.id,
    recurso.status,
    recurso.decisao,
    recurso.data_decisao || new Date().toISOString(),
  ].join('|')

  // Generate SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content)
  )
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Get IP and user agent from request headers
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headersList.get('x-real-ip')
    || '0.0.0.0'
  const userAgent = headersList.get('user-agent') || ''

  // Insert digital signature
  const { error: insertError } = await supabase
    .from('assinaturas_digitais')
    .insert({
      tenant_id: profile.tenant_id,
      documento_tipo: 'decisao_recurso',
      documento_id: recursoId,
      usuario_id: user.id,
      nome_signatario: profile.nome || user.email || 'Assessor',
      cpf_signatario: profile.cpf_cnpj || null,
      papel_signatario: 'gestor',
      metodo: 'simples',
      hash_documento: hashHex,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  if (insertError) {
    return { error: `Erro ao registrar assinatura: ${insertError.message}` }
  }

  revalidatePath(`/admin/editais/${editalId}/recursos/${recursoId}`)
  revalidatePath(`/admin/editais/${editalId}/recursos`)

  return {
    success: true,
    hash: hashHex,
    assinado_em: new Date().toISOString(),
    nome_signatario: profile.nome,
  }
}

export async function buscarAssinaturaDecisao(recursoId: string) {
  const supabase = await createClient()

  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select('id, hash_documento, nome_signatario, papel_signatario, assinado_em, ip_address')
    .eq('documento_tipo', 'decisao_recurso')
    .eq('documento_id', recursoId)
    .order('assinado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  return assinatura
}
