export type UserRole = 'proponente' | 'avaliador' | 'gestor' | 'admin' | 'super_admin'

export type FaseEdital =
  | 'criacao' | 'publicacao' | 'inscricao' | 'inscricao_encerrada'
  | 'divulgacao_inscritos' | 'recurso_divulgacao_inscritos'
  | 'habilitacao' | 'resultado_preliminar_habilitacao' | 'recurso_habilitacao'
  | 'resultado_definitivo_habilitacao' | 'avaliacao_tecnica' | 'resultado_preliminar_avaliacao'
  | 'recurso_avaliacao' | 'resultado_final' | 'homologacao' | 'arquivamento'

export interface Tenant {
  id: string
  nome: string
  cnpj: string
  dominio: string
  logo_url: string | null
  tema_cores: { primary: string; secondary: string }
  status: 'ativo' | 'inativo' | 'suspenso'
  created_at: string
  updated_at: string
  version: number
}

export interface Profile {
  id: string
  tenant_id: string
  nome: string
  cpf_cnpj: string | null
  telefone: string | null
  role: UserRole
  consentimento_lgpd: boolean
  data_consentimento: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  version: number
  // Proponente fields
  areas_atuacao: string[] | null
  tempo_atuacao: string | null
  renda: string | null
  genero: string | null
  orientacao_sexual: string | null
  raca_etnia: string | null
  pcd: boolean
  endereco_completo: string | null
  municipio: string | null
  estado: string | null
  tipo_pessoa: 'fisica' | 'juridica' | 'coletivo_sem_cnpj'
  nome_artistico: string | null
  data_nascimento: string | null
  comunidade_tradicional: string | null
  tipo_deficiencia: string | null
  escolaridade: string | null
  beneficiario_programa_social: string | null
  funcao_cultural: string | null
  // Pessoa Juridica fields (Fase 1.2)
  razao_social: string | null
  nome_fantasia: string | null
  endereco_sede: string | null
  representante_nome: string | null
  representante_cpf: string | null
  representante_genero: string | null
  representante_raca_etnia: string | null
  representante_pcd: boolean
  representante_escolaridade: string | null
  // Avaliador fields
  curriculo_descricao: string | null
  areas_avaliacao: string[] | null
  lattes_url: string | null
  // Gestor fields
  orgao_vinculado: string | null
  funcao_cargo: string | null
  matricula: string | null
}

export interface Edital {
  id: string
  tenant_id: string
  numero_edital: string
  titulo: string
  descricao: string | null
  status: FaseEdital
  tipo_edital: string | null
  inicio_inscricao: string | null
  fim_inscricao: string | null
  inicio_recurso: string | null
  fim_recurso: string | null
  inicio_recurso_inscricao: string | null
  fim_recurso_inscricao: string | null
  inicio_recurso_selecao: string | null
  fim_recurso_selecao: string | null
  inicio_recurso_habilitacao: string | null
  fim_recurso_habilitacao: string | null
  config_cotas: Record<string, unknown>[] | null
  config_desempate: string[] | null
  config_pontuacao_extra: Record<string, unknown>[] | null
  config_reserva_vagas: Record<string, unknown>[] | null
  cancelado: boolean
  justificativa_cancelamento: string | null
  numero_pareceristas: number
  nota_minima_aprovacao: number
  nota_zero_desclassifica: boolean
  limiar_discrepancia: number
  versao: number
  active: boolean
  created_at: string
  created_by: string | null
}

export interface EditalCategoria {
  id: string
  edital_id: string
  tenant_id: string
  nome: string
  vagas: number
  created_at: string
}

export interface Criterio {
  id: string
  edital_id: string
  descricao: string
  nota_minima: number
  nota_maxima: number
  peso: number
  ordem: number | null
  tenant_id: string
}

export interface EditalFase {
  id: string
  edital_id: string
  fase: FaseEdital
  data_inicio: string | null
  data_fim: string | null
  bloqueada: boolean
  observacao: string | null
  created_at: string
}

export interface Projeto {
  id: string
  tenant_id: string
  edital_id: string
  proponente_id: string
  categoria_id: string | null
  numero_protocolo: string
  titulo: string
  resumo: string | null
  descricao_tecnica: string | null
  orcamento_total: number | null
  cronograma_execucao: string | null
  status_habilitacao: 'pendente' | 'em_analise' | 'habilitado' | 'inabilitado'
  nota_final: number | null
  campos_extras: Record<string, string> | null
  status_atual: string
  data_envio: string
  ip_submissao: string | null
  // Campos estruturados (Fase 1.4)
  areas_projeto: string[] | null
  minicurriculo_proponente: string | null
  objetivos: string | null
  metas_projeto: string | null
  perfil_publico: string | null
  publico_prioritario: string[] | null
  local_execucao: string | null
  periodo_execucao_inicio: string | null
  periodo_execucao_fim: string | null
  estrategia_divulgacao: string | null
  outras_fontes_recurso: boolean
  outras_fontes_detalhamento: string | null
  venda_produtos_ingressos: boolean
  venda_detalhamento: string | null
  contrapartida_social: string | null
  concorre_cota: boolean
  tipo_cota: 'negra' | 'indigena' | 'pcd' | null
  // Acessibilidade (Fase 1.5)
  acessibilidade: Record<string, boolean> | null
  acessibilidade_descricao: string | null
  // Classificacao (Fase 3.1)
  classificacao_tipo: 'ampla_concorrencia' | 'cota_pessoa_negra' | 'cota_pessoa_indigena' | 'cota_pessoa_pcd' | 'cota_areas_perifericas' | 'remanejamento' | null
}

export interface ProjetoDocumento {
  id: string
  tenant_id: string
  projeto_id: string
  tipo: 'identidade' | 'proposta' | 'orcamento' | 'complementar' | 'comprovante_despesa' | 'relatorio_atividade' | 'prestacao_contas'
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number | null
  created_at: string
}

export interface Avaliacao {
  id: string
  tenant_id: string
  projeto_id: string
  avaliador_id: string
  pontuacao_total: number | null
  justificativa: string | null
  status: 'em_andamento' | 'finalizada' | 'bloqueada'
  versao: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface AvaliacaoCriterio {
  id: string
  avaliacao_id: string
  criterio_id: string
  nota: number
  comentario: string | null
  created_at: string
}

export interface Recurso {
  id: string
  tenant_id: string
  projeto_id: string
  proponente_id: string
  tipo: 'habilitacao' | 'avaliacao'
  numero_protocolo: string
  fundamentacao: string
  status: 'pendente' | 'em_analise' | 'deferido' | 'indeferido'
  decisao: string | null
  decidido_por: string | null
  data_decisao: string | null
  created_at: string
}

export interface RecursoAnexo {
  id: string
  recurso_id: string
  storage_path: string
  nome_arquivo: string
  created_at: string
}

export interface Publicacao {
  id: string
  tenant_id: string
  edital_id: string
  tipo: 'resultado_preliminar' | 'resultado_final' | 'ata' | 'homologacao'
  numero_publicacao: number
  titulo: string
  conteudo: string | null
  arquivo_pdf: string | null
  publicado_por: string | null
  data_publicacao: string
  created_at: string
}

export type StatusPrestacao = 'rascunho' | 'enviada' | 'em_analise' | 'aprovada' | 'reprovada' | 'com_pendencias'

export type AcoesRealizadas = 'sim_conforme' | 'sim_com_adaptacoes' | 'parcial' | 'nao_conforme'
export type LocalTipo = 'presencial' | 'virtual' | 'hibrido'
export type JulgamentoPrestacao = 'aprovada_sem_ressalvas' | 'aprovada_com_ressalvas' | 'rejeitada_parcial' | 'rejeitada_total'

export interface PrestacaoMeta {
  meta: string
  status: 'cumprida' | 'parcial' | 'nao_cumprida'
  observacao: string
  justificativa: string
}

export interface PrestacaoProduto {
  tipo: string
  quantidade: number
  descricao: string
}

export interface PrestacaoContas {
  id: string
  tenant_id: string
  projeto_id: string
  proponente_id: string
  valor_total_executado: number | null
  resumo_atividades: string | null
  observacoes: string | null
  status: StatusPrestacao
  parecer_gestor: string | null
  analisado_por: string | null
  data_envio: string | null
  data_analise: string | null
  // Campos estruturados ANEXO XI
  acoes_realizadas: AcoesRealizadas
  acoes_desenvolvidas: string | null
  metas: PrestacaoMeta[]
  produtos_gerados: PrestacaoProduto[]
  produtos_disponibilizacao: string | null
  resultados_gerados: string[]
  publico_alcancado_quantidade: number | null
  publico_mensuracao: string | null
  publico_justificativa: string | null
  equipe_quantidade: number | null
  equipe_houve_mudancas: boolean
  local_tipo: LocalTipo
  local_plataformas: string | null
  local_links: string | null
  local_descricao: string | null
  divulgacao: string | null
  topicos_adicionais: string | null
  julgamento: JulgamentoPrestacao | null
  plano_compensatorio: string | null
  valor_devolucao: number | null
  created_at: string
}

export interface PrestacaoEquipe {
  id: string
  prestacao_id: string
  tenant_id: string
  nome: string
  funcao: string
  cpf_cnpj: string | null
  pessoa_negra_indigena: boolean
  pessoa_pcd: boolean
  created_at: string
}

// ============================================================
// Habilitacao - Checklist de Documentos
// ============================================================

export interface EditalDocHabilitacao {
  id: string
  edital_id: string
  tenant_id: string
  tipo_documento: string
  nome: string
  descricao: string | null
  obrigatorio: boolean
  ordem: number
  created_at: string
}

export type StatusConferenciaDoc = 'pendente' | 'aprovado' | 'reprovado' | 'pendencia'

export interface HabilitacaoDocConferencia {
  id: string
  projeto_id: string
  doc_exigido_id: string
  documento_id: string | null
  tenant_id: string
  status: StatusConferenciaDoc
  observacao: string | null
  conferido_por: string | null
  conferido_em: string | null
  created_at: string
}

export interface HabilitacaoDiligencia {
  id: string
  projeto_id: string
  tenant_id: string
  numero: number
  descricao: string
  prazo_dias: number
  data_envio: string
  data_resposta: string | null
  respondida: boolean
  criado_por: string | null
  created_at: string
}

// ============================================================
// Equipe do Projeto (Fase 1.6)
// ============================================================

export interface ProjetoEquipe {
  id: string
  projeto_id: string
  tenant_id: string
  nome: string
  funcao: string
  cpf_cnpj: string | null
  minicurriculo: string | null
  created_at: string
}

// ============================================================
// Planilha Orcamentaria (Fase 1.7)
// ============================================================

export type CategoriaOrcamento = 'producao' | 'divulgacao' | 'acessibilidade' | 'outras_fontes'

export interface ProjetoOrcamentoItem {
  id: string
  projeto_id: string
  tenant_id: string
  categoria: CategoriaOrcamento
  item: string
  unidade_medida: string | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
}

// ============================================================
// Cronograma de Execucao (Fase 1.8)
// ============================================================

export type FaseCronograma = 'pre_producao' | 'divulgacao' | 'producao' | 'pos_producao'

export interface ProjetoCronograma {
  id: string
  projeto_id: string
  tenant_id: string
  fase: FaseCronograma
  atividade: string
  data_inicio: string | null
  data_fim: string | null
  created_at: string
}

// ============================================================
// Coletivo sem CNPJ (Fase 1.3)
// ============================================================

export interface Coletivo {
  id: string
  profile_id: string
  nome_coletivo: string
  ano_criacao: number | null
  quantidade_membros: number
  portfolio: string | null
  created_at: string
  updated_at: string
}

export interface ColetivoMembro {
  id: string
  coletivo_id: string
  nome: string
  cpf: string | null
  created_at: string
}

// ============================================================
// Erratas do Edital (Fase 9.1)
// ============================================================

export interface EditalErrata {
  id: string
  edital_id: string
  tenant_id: string
  numero_errata: number
  descricao: string
  campo_alterado: string | null
  valor_anterior: string | null
  valor_novo: string | null
  publicado_em: string | null
  publicado_por: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Comissão de Avaliação (Fase 2.4)
// ============================================================

export type TipoMembroComissao = 'sociedade_civil' | 'poder_executivo' | 'suplente'

export interface EditalComissao {
  id: string
  edital_id: string
  tenant_id: string
  nome: string
  cpf: string | null
  qualificacao: string | null
  tipo: TipoMembroComissao
  portaria_numero: string | null
  created_at: string
}

// ============================================================
// Convocações de Suplentes (Fase 3.3)
// ============================================================

export type StatusConvocacao = 'convocado' | 'habilitado' | 'inabilitado' | 'desistente' | 'prazo_expirado'

export interface Convocacao {
  id: string
  edital_id: string
  projeto_id: string
  tenant_id: string
  numero_chamada: number
  motivo: string
  projeto_substituido_id: string | null
  data_convocacao: string
  prazo_habilitacao: string | null
  status: StatusConvocacao
  convocado_por: string | null
  observacao: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Anexos do Edital (Fase 1.9)
// ============================================================

export type TipoAnexoEdital = 'carta_anuencia' | 'planilha_orcamentaria' | 'cronograma' |
  'termo_compromisso' | 'declaracao_etnico_racial' | 'declaracao_pcd' |
  'declaracao_coletivo' | 'formulario_recurso' | 'modelo_projeto' |
  'edital_completo' | 'outros'

export interface EditalAnexo {
  id: string
  edital_id: string
  tenant_id: string
  nome: string
  descricao: string | null
  tipo_anexo: TipoAnexoEdital
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  mime_type: string | null
  ordem: number
  criado_por: string | null
  created_at: string
  updated_at: string
}

export interface LogAuditoria {
  id: string
  tenant_id: string
  usuario_id: string | null
  acao: string
  tabela_afetada: string
  registro_id: string
  dados_antigos: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ── Joined query types (Supabase relations) ──

export type ProjetoWithEdital = Projeto & {
  editais: Pick<Edital, 'titulo' | 'numero_edital' | 'status'> | null
}

export type AvaliacaoWithProjeto = Avaliacao & {
  projetos: (Pick<Projeto, 'titulo' | 'numero_protocolo'> & {
    editais: Pick<Edital, 'titulo' | 'numero_edital'> | null
  }) | null
}

export type LogAuditoriaWithProfile = LogAuditoria & {
  profiles: Pick<Profile, 'nome'> | null
}

export type PrestacaoWithProjeto = PrestacaoContas & {
  projetos: Pick<Projeto, 'titulo' | 'numero_protocolo' | 'orcamento_total'> & {
    editais: Pick<Edital, 'titulo' | 'numero_edital'> | null
  } | null
}

export type TenantTemaCores = { primary: string; secondary: string }

// ============================================================
// Triagem IA
// ============================================================

export type TipoTriagem = 'habilitacao' | 'avaliacao' | 'irregularidades' | 'completa'
export type StatusTriagem = 'em_andamento' | 'concluida' | 'erro'
export type SugestaoHabilitacao = 'habilitado' | 'inabilitado' | 'pendencia'

export interface TriagemExecucao {
  id: string
  tenant_id: string
  edital_id: string
  executado_por: string
  tipo: TipoTriagem
  status: StatusTriagem
  total_projetos: number
  projetos_analisados: number
  erro_mensagem: string | null
  created_at: string
  concluida_em: string | null
}

export interface TriagemResultado {
  id: string
  execucao_id: string
  projeto_id: string
  tenant_id: string
  habilitacao_sugerida: SugestaoHabilitacao | null
  habilitacao_motivo: string | null
  docs_completos: boolean
  docs_problemas: string[]
  irregularidades_flags: string[]
  similaridade_max: number
  projeto_similar_id: string | null
  created_at: string
}

export interface TriagemNota {
  id: string
  resultado_id: string
  criterio_id: string
  nota_sugerida: number
  justificativa: string
  confianca: number
  created_at: string
}

export type TriagemResultadoWithProjeto = TriagemResultado & {
  projetos: Pick<Projeto, 'titulo' | 'numero_protocolo' | 'resumo' | 'orcamento_total'> | null
  projeto_similar: Pick<Projeto, 'titulo' | 'numero_protocolo'> | null
}

export type TriagemResultadoWithNotas = TriagemResultado & {
  triagem_ia_notas: (TriagemNota & {
    criterios: Pick<Criterio, 'descricao' | 'nota_minima' | 'nota_maxima' | 'peso'> | null
  })[]
}

export type TriagemExecucaoWithResults = TriagemExecucao & {
  triagem_ia_resultados: TriagemResultadoWithProjeto[]
}

// ============================================================
// Termo de Execução Cultural + Assinatura Digital
// ============================================================

export type StatusTermo = 'rascunho' | 'pendente_assinatura_proponente' | 'pendente_assinatura_gestor' | 'assinado' | 'vigente' | 'encerrado' | 'rescindido'

export interface TermoExecucao {
  id: string
  tenant_id: string
  projeto_id: string
  proponente_id: string
  numero_termo: string
  edital_referencia: string | null
  valor_total: number
  valor_extenso: string | null
  banco: string | null
  agencia: string | null
  conta_corrente: string | null
  tipo_conta: 'corrente' | 'poupanca'
  vigencia_inicio: string | null
  vigencia_fim: string | null
  vigencia_meses: number
  prorrogacao_meses: number
  status: StatusTermo
  prazo_assinatura_dias: number
  data_envio_para_assinatura: string | null
  pdf_storage_path: string | null
  pdf_assinado_storage_path: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface AssinaturaDigital {
  id: string
  tenant_id: string
  documento_tipo: 'termo_execucao' | 'decisao_recurso' | 'prestacao_contas' | 'publicacao'
  documento_id: string
  usuario_id: string
  nome_signatario: string
  cpf_signatario: string | null
  papel_signatario: 'proponente' | 'gestor' | 'secretario' | 'parecerista' | 'coordenador'
  metodo: 'simples' | 'govbr'
  hash_documento: string
  ip_address: string
  user_agent: string | null
  govbr_certificado: string | null
  govbr_transaction_id: string | null
  assinado_em: string
  created_at: string
}

export interface TermoAditivo {
  id: string
  tenant_id: string
  termo_id: string
  numero_aditivo: number
  tipo: 'prorrogacao' | 'alteracao_valor' | 'alteracao_objeto' | 'alteracao_equipe' | 'outro'
  justificativa: string
  valor_alterado: number | null
  nova_vigencia_fim: string | null
  requer_aprovacao: boolean
  aprovado_por: string | null
  aprovado_em: string | null
  status: 'pendente' | 'aprovado' | 'rejeitado'
  pdf_storage_path: string | null
  created_at: string
  updated_at: string
}

export interface Pagamento {
  id: string
  tenant_id: string
  termo_id: string
  projeto_id: string
  numero_parcela: number
  valor: number
  data_pagamento: string | null
  comprovante_storage_path: string | null
  status: 'pendente' | 'liberado' | 'pago' | 'cancelado'
  observacoes: string | null
  registrado_por: string | null
  created_at: string
  updated_at: string
}

export type TermoWithProjeto = TermoExecucao & {
  projetos: Pick<Projeto, 'titulo' | 'numero_protocolo'> & {
    editais: Pick<Edital, 'titulo' | 'numero_edital'> | null
  } | null
  profiles: Pick<Profile, 'nome' | 'cpf_cnpj'> | null
}
