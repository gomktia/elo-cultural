import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Buscar perfil completo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // Buscar projetos do usuario
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, resumo, descricao_tecnica, orcamento_total, cronograma_execucao, numero_protocolo, status_habilitacao, nota_final, status_atual, data_envio')
    .eq('proponente_id', user.id)

  // Buscar documentos dos projetos
  const projetoIds = (projetos || []).map(p => p.id)
  const { data: documentos } = projetoIds.length > 0
    ? await supabase
        .from('projeto_documentos')
        .select('id, projeto_id, tipo, nome_arquivo, tamanho_bytes, created_at')
        .in('projeto_id', projetoIds)
    : { data: [] }

  // Buscar recursos do usuario
  const { data: recursos } = await supabase
    .from('recursos')
    .select('id, projeto_id, tipo, numero_protocolo, fundamentacao, status, decisao, data_decisao, created_at')
    .eq('proponente_id', user.id)

  // Buscar avaliacoes feitas pelo usuario (se for avaliador)
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('id, projeto_id, pontuacao_total, justificativa, status, versao, created_at, updated_at')
    .eq('avaliador_id', user.id)

  // Buscar logs de auditoria do usuario
  const { data: logs } = await supabase
    .from('logs_auditoria')
    .select('acao, tabela_afetada, registro_id, created_at, ip_address')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const exportData = {
    meta: {
      exportado_em: new Date().toISOString(),
      usuario_id: user.id,
      email: user.email,
      formato: 'JSON (LGPD Art. 18, V - Portabilidade)',
    },
    dados_pessoais: {
      nome: profile.nome,
      cpf_cnpj: profile.cpf_cnpj,
      telefone: profile.telefone,
      role: profile.role,
      consentimento_lgpd: profile.consentimento_lgpd,
      data_consentimento: profile.data_consentimento,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
    dados_demograficos: {
      genero: profile.genero,
      orientacao_sexual: profile.orientacao_sexual,
      raca_etnia: profile.raca_etnia,
      pcd: profile.pcd,
      renda: profile.renda,
      municipio: profile.municipio,
      estado: profile.estado,
      endereco_completo: profile.endereco_completo,
    },
    dados_profissionais: {
      areas_atuacao: profile.areas_atuacao,
      tempo_atuacao: profile.tempo_atuacao,
      curriculo_descricao: profile.curriculo_descricao,
      areas_avaliacao: profile.areas_avaliacao,
      lattes_url: profile.lattes_url,
      orgao_vinculado: profile.orgao_vinculado,
      funcao_cargo: profile.funcao_cargo,
      matricula: profile.matricula,
    },
    projetos: projetos || [],
    documentos: (documentos || []).map(d => ({
      ...d,
      nota: 'Arquivos podem ser baixados individualmente na plataforma.',
    })),
    recursos: recursos || [],
    avaliacoes_realizadas: avaliacoes || [],
    historico_acoes: logs || [],
  }

  // Retornar como download JSON
  const jsonStr = JSON.stringify(exportData, null, 2)
  return new NextResponse(jsonStr, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="elo-cultura-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
