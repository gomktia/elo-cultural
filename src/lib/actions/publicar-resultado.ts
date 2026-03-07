'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyInAppEditalFase } from '@/lib/notifications/notify'

type TipoResultado =
  | 'resultado_preliminar_selecao'
  | 'resultado_final_selecao'
  | 'resultado_preliminar_habilitacao'
  | 'resultado_definitivo_habilitacao'
  | 'homologacao_final'

const TIPO_LABELS: Record<TipoResultado, string> = {
  resultado_preliminar_selecao: 'Resultado Preliminar da Seleção',
  resultado_final_selecao: 'Resultado Final da Seleção',
  resultado_preliminar_habilitacao: 'Resultado Preliminar da Habilitação',
  resultado_definitivo_habilitacao: 'Resultado Definitivo da Habilitação',
  homologacao_final: 'Homologação Final',
}

const ETAPA_MAP: Record<TipoResultado, string> = {
  resultado_preliminar_selecao: 'selecao',
  resultado_final_selecao: 'resultado',
  resultado_preliminar_habilitacao: 'habilitacao',
  resultado_definitivo_habilitacao: 'habilitacao',
  homologacao_final: 'homologacao',
}

const TIPO_PUBLICACAO_MAP: Record<TipoResultado, string> = {
  resultado_preliminar_selecao: 'resultado_preliminar',
  resultado_final_selecao: 'resultado_final',
  resultado_preliminar_habilitacao: 'resultado_preliminar',
  resultado_definitivo_habilitacao: 'resultado_final',
  homologacao_final: 'homologacao',
}

export async function publicarResultado(editalId: string, tipo: TipoResultado) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, tenant_id')
    .eq('id', editalId)
    .single()
  if (!edital) return { error: 'Edital não encontrado' }

  let conteudo = ''
  const titulo = `${TIPO_LABELS[tipo]} - ${edital.numero_edital}`

  if (tipo === 'resultado_preliminar_selecao' || tipo === 'resultado_final_selecao') {
    conteudo = await gerarConteudoSelecao(supabase, editalId, edital.numero_edital, tipo)
  } else if (tipo === 'resultado_preliminar_habilitacao' || tipo === 'resultado_definitivo_habilitacao') {
    conteudo = await gerarConteudoHabilitacao(supabase, editalId, edital.numero_edital, tipo)
  } else if (tipo === 'homologacao_final') {
    conteudo = await gerarConteudoHomologacao(supabase, editalId, edital.numero_edital)
  }

  // Get next publication number
  const { count } = await supabase
    .from('publicacoes')
    .select('id', { count: 'exact', head: true })
    .eq('edital_id', editalId)

  const { error } = await supabase.from('publicacoes').insert({
    tenant_id: edital.tenant_id,
    edital_id: editalId,
    tipo: TIPO_PUBLICACAO_MAP[tipo],
    etapa: ETAPA_MAP[tipo],
    numero_publicacao: (count || 0) + 1,
    titulo,
    conteudo,
    publicado_por: user.id,
  })

  if (error) return { error: error.message }

  // Map resultado type to edital fase for notification
  const faseMap: Record<TipoResultado, string> = {
    resultado_preliminar_selecao: 'resultado_preliminar_avaliacao',
    resultado_final_selecao: 'resultado_final',
    resultado_preliminar_habilitacao: 'resultado_preliminar_habilitacao',
    resultado_definitivo_habilitacao: 'resultado_final',
    homologacao_final: 'homologacao',
  }

  notifyInAppEditalFase({
    editalId,
    novaFase: faseMap[tipo],
  }).catch(() => {})

  return { success: true, titulo }
}

interface ProjetoPublicacao {
  titulo: string
  numero_protocolo: string | null
  nota_final: number | null
  status_atual: string
  classificacao_tipo: string | null
  categoria: string | null
  orcamento_total?: number | null
  profiles: unknown
}

async function gerarConteudoSelecao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  editalId: string,
  numeroEdital: string,
  tipo: TipoResultado,
) {
  const { data: projetos } = await supabase
    .from('projetos')
    .select('titulo, numero_protocolo, nota_final, status_atual, classificacao_tipo, categoria, profiles(nome)')
    .eq('edital_id', editalId)
    .order('nota_final', { ascending: false })

  if (!projetos || projetos.length === 0) return 'Nenhum projeto encontrado para este edital.'

  const isPreliminar = tipo === 'resultado_preliminar_selecao'
  const header = isPreliminar
    ? `RESULTADO PRELIMINAR DA SELEÇÃO\n${numeroEdital}\n\nA Comissão de Seleção torna público o resultado preliminar da avaliação técnica dos projetos inscritos.\n`
    : `RESULTADO FINAL DA SELEÇÃO\n${numeroEdital}\n\nA Comissão de Seleção torna público o resultado final da avaliação técnica, após análise dos recursos interpostos.\n`

  const classificados = (projetos as unknown as ProjetoPublicacao[]).filter(p =>
    ['classificado', 'habilitado', 'contemplado'].includes(p.status_atual)
  )
  const suplentes = (projetos as unknown as ProjetoPublicacao[]).filter(p => p.status_atual === 'suplente')
  const desclassificados = (projetos as unknown as ProjetoPublicacao[]).filter(p =>
    ['desclassificado', 'eliminado'].includes(p.status_atual)
  )

  let body = header
  body += `\n--- PROJETOS CLASSIFICADOS (${classificados.length}) ---\n\n`
  body += formatarListaProjetos(classificados, true)

  if (suplentes.length > 0) {
    body += `\n--- SUPLENTES (${suplentes.length}) ---\n\n`
    body += formatarListaProjetos(suplentes, true)
  }

  if (desclassificados.length > 0) {
    body += `\n--- NÃO CLASSIFICADOS (${desclassificados.length}) ---\n\n`
    body += formatarListaProjetos(desclassificados, false)
  }

  if (isPreliminar) {
    body += `\n---\nOs proponentes poderão interpor recurso no prazo estabelecido no edital.`
  }

  return body
}

async function gerarConteudoHabilitacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  editalId: string,
  numeroEdital: string,
  tipo: TipoResultado,
) {
  const { data: projetos } = await supabase
    .from('projetos')
    .select('titulo, numero_protocolo, status_atual, categoria, profiles(nome)')
    .eq('edital_id', editalId)
    .in('status_atual', ['habilitado', 'inabilitado', 'classificado', 'contemplado', 'suplente'])
    .order('categoria')

  if (!projetos || projetos.length === 0) return 'Nenhum projeto na fase de habilitação.'

  const isPreliminar = tipo === 'resultado_preliminar_habilitacao'
  const header = isPreliminar
    ? `RESULTADO PRELIMINAR DA HABILITAÇÃO\n${numeroEdital}\n\nA Comissão torna público o resultado preliminar da análise documental dos projetos classificados.\n`
    : `RESULTADO DEFINITIVO DA HABILITAÇÃO\n${numeroEdital}\n\nA Comissão torna público o resultado definitivo da habilitação, após análise dos recursos interpostos.\n`

  const projetosTyped = projetos as unknown as ProjetoPublicacao[]
  const habilitados = projetosTyped.filter(p => ['habilitado', 'contemplado'].includes(p.status_atual))
  const inabilitados = projetosTyped.filter(p => p.status_atual === 'inabilitado')

  let body = header
  body += `\n--- HABILITADOS (${habilitados.length}) ---\n\n`
  habilitados.forEach((p, i: number) => {
    const nome = (p.profiles as unknown as { nome: string } | null)?.nome || 'N/A'
    body += `${i + 1}. ${p.numero_protocolo || '—'} | ${p.titulo} | ${nome} | ${p.categoria || '—'}\n`
  })

  if (inabilitados.length > 0) {
    body += `\n--- INABILITADOS (${inabilitados.length}) ---\n\n`
    inabilitados.forEach((p, i: number) => {
      const nome = (p.profiles as unknown as { nome: string } | null)?.nome || 'N/A'
      body += `${i + 1}. ${p.numero_protocolo || '—'} | ${p.titulo} | ${nome} | ${p.categoria || '—'}\n`
    })
  }

  if (isPreliminar) {
    body += `\n---\nOs proponentes inabilitados poderão interpor recurso no prazo estabelecido no edital.`
  }

  return body
}

async function gerarConteudoHomologacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  editalId: string,
  numeroEdital: string,
) {
  const { data: projetos } = await supabase
    .from('projetos')
    .select('titulo, numero_protocolo, nota_final, status_atual, classificacao_tipo, categoria, orcamento_total, profiles(nome)')
    .eq('edital_id', editalId)
    .in('status_atual', ['habilitado', 'contemplado'])
    .order('nota_final', { ascending: false })

  const projetosTyped = (projetos || []) as unknown as ProjetoPublicacao[]
  const total = projetosTyped.length
  const valorTotal = projetosTyped.reduce((s: number, p) => s + (Number(p.orcamento_total) || 0), 0)

  let body = `HOMOLOGAÇÃO FINAL\n${numeroEdital}\n\n`
  body += `O Secretário Municipal de Cultura HOMOLOGA o resultado final do processo seletivo.\n\n`
  body += `Total de projetos contemplados: ${total}\n`
  body += `Valor total: ${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`
  body += `--- PROJETOS CONTEMPLADOS ---\n\n`

  projetosTyped.forEach((p, i: number) => {
    const nome = (p.profiles as unknown as { nome: string } | null)?.nome || 'N/A'
    const valor = Number(p.orcamento_total) || 0
    body += `${i + 1}. ${p.numero_protocolo || '—'} | ${p.titulo} | ${nome} | ${p.categoria || '—'} | ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Nota: ${p.nota_final ?? '—'}\n`
  })

  body += `\n---\nEsta homologação produz seus efeitos a partir da data de publicação.`

  return body
}

function formatarListaProjetos(projetos: ProjetoPublicacao[], showNota: boolean) {
  let text = ''
  projetos.forEach((p, i: number) => {
    const nome = (p.profiles as unknown as { nome: string } | null)?.nome || 'N/A'
    const classificacao = p.classificacao_tipo ? ` [${p.classificacao_tipo.replace(/_/g, ' ').toUpperCase()}]` : ''
    const nota = showNota && p.nota_final != null ? ` | Nota: ${Number(p.nota_final).toFixed(2)}` : ''
    text += `${i + 1}. ${p.numero_protocolo || '—'} | ${p.titulo} | ${nome} | ${p.categoria || '—'}${nota}${classificacao}\n`
  })
  return text
}
