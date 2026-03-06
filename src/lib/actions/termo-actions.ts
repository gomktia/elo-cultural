'use server'

import { createClient } from '@/lib/supabase/server'
import { GESTAO_ROLES } from '@/lib/constants/roles'
import type { UserRole } from '@/types/database.types'
import { notifyInAppTermoDisponivel } from '@/lib/notifications/notify'

/**
 * Gera termos de execução para todos os projetos selecionados de um edital
 * que ainda não possuem termo.
 */
export async function gerarTermosEdital(editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as UserRole)) {
    return { error: 'Sem permissão' }
  }

  // Load edital
  const { data: edital } = await supabase
    .from('editais')
    .select('id, numero_edital, titulo, tenant_id')
    .eq('id', editalId)
    .single()

  if (!edital) return { error: 'Edital não encontrado' }

  // Load selected projects that don't have a termo yet
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, proponente_id, orcamento_total, numero_protocolo')
    .eq('edital_id', editalId)
    .eq('status_atual', 'selecionado')

  if (!projetos || projetos.length === 0) {
    return { error: 'Nenhum projeto selecionado encontrado' }
  }

  // Check which projects already have termos
  const { data: existingTermos } = await supabase
    .from('termos_execucao')
    .select('projeto_id')
    .in('projeto_id', projetos.map(p => p.id))

  const existingIds = new Set((existingTermos || []).map(t => t.projeto_id))
  const newProjects = projetos.filter(p => !existingIds.has(p.id))

  if (newProjects.length === 0) {
    return { error: 'Todos os projetos selecionados já possuem termos gerados' }
  }

  // Generate termos
  const now = new Date()
  const year = now.getFullYear()

  // Get last termo number for this tenant/year
  const { data: lastTermo } = await supabase
    .from('termos_execucao')
    .select('numero_termo')
    .eq('tenant_id', edital.tenant_id)
    .like('numero_termo', `TEC-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNum = 1
  if (lastTermo?.numero_termo) {
    const match = lastTermo.numero_termo.match(/TEC-\d{4}-(\d+)/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }

  const termosToInsert = newProjects.map((p, i) => ({
    tenant_id: edital.tenant_id,
    projeto_id: p.id,
    proponente_id: p.proponente_id,
    numero_termo: `TEC-${year}-${String(nextNum + i).padStart(4, '0')}`,
    edital_referencia: edital.numero_edital,
    valor_total: p.orcamento_total || 0,
    status: 'rascunho',
    created_by: user.id,
  }))

  const { error: insertError } = await supabase
    .from('termos_execucao')
    .insert(termosToInsert)

  if (insertError) {
    return { error: `Erro ao gerar termos: ${insertError.message}` }
  }

  return {
    success: true,
    gerados: termosToInsert.length,
    jaExistiam: existingIds.size,
  }
}

/**
 * Envia o termo para assinatura do proponente
 */
export async function enviarParaAssinatura(termoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as UserRole)) {
    return { error: 'Sem permissão' }
  }

  // Get termo details before updating
  const { data: termo } = await supabase
    .from('termos_execucao')
    .select('projeto_id')
    .eq('id', termoId)
    .eq('status', 'rascunho')
    .single()

  if (!termo) return { error: 'Termo não encontrado ou já enviado' }

  const { error } = await supabase
    .from('termos_execucao')
    .update({
      status: 'pendente_assinatura_proponente',
      data_envio_para_assinatura: new Date().toISOString(),
    })
    .eq('id', termoId)

  if (error) return { error: error.message }

  // Notify proponente
  notifyInAppTermoDisponivel({
    termoId,
    projetoId: termo.projeto_id,
  }).catch(() => {})

  return { success: true }
}

/**
 * Registra assinatura simples do usuário em um documento
 */
export async function assinarDocumento({
  termoId,
  ipAddress,
  userAgent,
}: {
  termoId: string
  ipAddress: string
  userAgent: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, cpf_cnpj, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil não encontrado' }

  // Load the termo
  const { data: termo } = await supabase
    .from('termos_execucao')
    .select('id, tenant_id, status, proponente_id')
    .eq('id', termoId)
    .single()

  if (!termo) return { error: 'Termo não encontrado' }

  // Determine signer role
  const isProponente = user.id === termo.proponente_id
  const isGestor = GESTAO_ROLES.includes(profile.role as UserRole)

  if (isProponente && termo.status !== 'pendente_assinatura_proponente') {
    return { error: 'Termo não está pendente de assinatura do proponente' }
  }
  if (isGestor && !isProponente && termo.status !== 'pendente_assinatura_gestor') {
    return { error: 'Termo não está pendente de assinatura do gestor' }
  }

  // Generate hash (SHA-256 of termo data + timestamp)
  const hashInput = `${termoId}|${user.id}|${new Date().toISOString()}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Insert assinatura
  const { error: sigError } = await supabase
    .from('assinaturas_digitais')
    .insert({
      tenant_id: termo.tenant_id,
      documento_tipo: 'termo_execucao',
      documento_id: termoId,
      usuario_id: user.id,
      nome_signatario: profile.nome,
      cpf_signatario: profile.cpf_cnpj,
      papel_signatario: isProponente ? 'proponente' : 'gestor',
      metodo: 'simples',
      hash_documento: hashHex,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  if (sigError) return { error: sigError.message }

  // Advance status
  const nextStatus = isProponente ? 'pendente_assinatura_gestor' : 'assinado'
  const { error: updateError } = await supabase
    .from('termos_execucao')
    .update({ status: nextStatus })
    .eq('id', termoId)

  if (updateError) return { error: updateError.message }

  return { success: true, newStatus: nextStatus }
}
