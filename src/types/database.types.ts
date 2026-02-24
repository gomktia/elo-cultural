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
  versao: number
  active: boolean
  created_at: string
  created_by: string | null
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
  numero_protocolo: string
  titulo: string
  resumo: string | null
  descricao_tecnica: string | null
  orcamento_total: number | null
  cronograma_execucao: string | null
  status_habilitacao: 'pendente' | 'habilitado' | 'inabilitado'
  nota_final: number | null
  status_atual: string
  data_envio: string
  ip_submissao: string | null
}

export interface ProjetoDocumento {
  id: string
  tenant_id: string
  projeto_id: string
  tipo: 'identidade' | 'proposta' | 'orcamento' | 'complementar'
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

export type TenantTemaCores = { primary: string; secondary: string }
