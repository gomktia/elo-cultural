'use server'

import { createClient } from '@/lib/supabase/server'

interface AdminUpdateProfileData {
  nome: string
  telefone: string | null
  cpf_cnpj: string | null
  // Avaliador
  curriculo_descricao?: string | null
  areas_avaliacao?: string[] | null
  lattes_url?: string | null
  // Gestor
  orgao_vinculado?: string | null
  funcao_cargo?: string | null
  matricula?: string | null
  // Proponente
  areas_atuacao?: string[] | null
  tempo_atuacao?: string | null
  renda?: string | null
  genero?: string | null
  orientacao_sexual?: string | null
  raca_etnia?: string | null
  pcd?: boolean
  endereco_completo?: string | null
  municipio?: string | null
  estado?: string | null
  // Fase 1.1
  tipo_pessoa?: string
  nome_artistico?: string | null
  data_nascimento?: string | null
  comunidade_tradicional?: string | null
  tipo_deficiencia?: string | null
  escolaridade?: string | null
  beneficiario_programa_social?: string | null
  funcao_cultural?: string | null
  // Fase 1.2 - PJ
  razao_social?: string | null
  nome_fantasia?: string | null
  endereco_sede?: string | null
  representante_nome?: string | null
  representante_cpf?: string | null
  representante_genero?: string | null
  representante_raca_etnia?: string | null
  representante_pcd?: boolean
  representante_escolaridade?: string | null
}

export async function adminUpdateProfile(targetUserId: string, data: AdminUpdateProfileData) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role)) {
    return { success: false, error: 'Sem permissão' }
  }

  // Verify target user belongs to same tenant (unless super_admin)
  if (callerProfile.role === 'admin') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile || targetProfile.tenant_id !== callerProfile.tenant_id) {
      return { success: false, error: 'Usuário não pertence ao seu tenant' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nome: data.nome,
      telefone: data.telefone || null,
      cpf_cnpj: data.cpf_cnpj || null,
      curriculo_descricao: data.curriculo_descricao ?? undefined,
      areas_avaliacao: data.areas_avaliacao ?? undefined,
      lattes_url: data.lattes_url ?? undefined,
      orgao_vinculado: data.orgao_vinculado ?? undefined,
      funcao_cargo: data.funcao_cargo ?? undefined,
      matricula: data.matricula ?? undefined,
      areas_atuacao: data.areas_atuacao ?? undefined,
      tempo_atuacao: data.tempo_atuacao ?? undefined,
      renda: data.renda ?? undefined,
      genero: data.genero ?? undefined,
      orientacao_sexual: data.orientacao_sexual ?? undefined,
      raca_etnia: data.raca_etnia ?? undefined,
      pcd: data.pcd ?? undefined,
      endereco_completo: data.endereco_completo ?? undefined,
      municipio: data.municipio ?? undefined,
      estado: data.estado ?? undefined,
      tipo_pessoa: data.tipo_pessoa ?? undefined,
      nome_artistico: data.nome_artistico ?? undefined,
      data_nascimento: data.data_nascimento ?? undefined,
      comunidade_tradicional: data.comunidade_tradicional ?? undefined,
      tipo_deficiencia: data.tipo_deficiencia ?? undefined,
      escolaridade: data.escolaridade ?? undefined,
      beneficiario_programa_social: data.beneficiario_programa_social ?? undefined,
      funcao_cultural: data.funcao_cultural ?? undefined,
      razao_social: data.razao_social ?? undefined,
      nome_fantasia: data.nome_fantasia ?? undefined,
      endereco_sede: data.endereco_sede ?? undefined,
      representante_nome: data.representante_nome ?? undefined,
      representante_cpf: data.representante_cpf ?? undefined,
      representante_genero: data.representante_genero ?? undefined,
      representante_raca_etnia: data.representante_raca_etnia ?? undefined,
      representante_pcd: data.representante_pcd ?? undefined,
      representante_escolaridade: data.representante_escolaridade ?? undefined,
    })
    .eq('id', targetUserId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
