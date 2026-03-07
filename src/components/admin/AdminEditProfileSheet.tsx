'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil, User, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { adminUpdateProfile } from '@/lib/actions/admin-profile-actions'
import { AvaliadorForm } from '@/components/cadastro/AvaliadorForm'
import { GestorForm } from '@/components/cadastro/GestorForm'
import { ProponenteForm } from '@/components/cadastro/ProponenteForm'
import { ROLE_LABELS } from '@/lib/constants/roles'
import type { Profile } from '@/types/database.types'

interface AdminEditProfileSheetProps {
  profile: Profile
}

export function AdminEditProfileSheet({ profile }: AdminEditProfileSheetProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    nome: profile.nome || '',
    telefone: profile.telefone || '',
    cpf_cnpj: profile.cpf_cnpj || '',
  })

  const [avaliadorData, setAvaliadorData] = useState({
    curriculo_descricao: profile.curriculo_descricao || '',
    areas_avaliacao: profile.areas_avaliacao || [] as string[],
    lattes_url: profile.lattes_url || '',
  })

  const [gestorData, setGestorData] = useState({
    orgao_vinculado: profile.orgao_vinculado || '',
    funcao_cargo: profile.funcao_cargo || '',
    matricula: profile.matricula || '',
  })

  const [proponenteData, setProponenteData] = useState({
    areas_atuacao: profile.areas_atuacao || [] as string[],
    tempo_atuacao: profile.tempo_atuacao || '',
    renda: profile.renda || '',
    genero: profile.genero || '',
    orientacao_sexual: profile.orientacao_sexual || '',
    raca_etnia: profile.raca_etnia || '',
    pcd: profile.pcd || false,
    endereco_completo: profile.endereco_completo || '',
    municipio: profile.municipio || '',
    estado: profile.estado || '',
    tipo_pessoa: profile.tipo_pessoa || 'fisica',
    nome_artistico: profile.nome_artistico || '',
    data_nascimento: profile.data_nascimento || '',
    comunidade_tradicional: profile.comunidade_tradicional || 'nenhuma',
    tipo_deficiencia: profile.tipo_deficiencia || '',
    escolaridade: profile.escolaridade || '',
    beneficiario_programa_social: profile.beneficiario_programa_social || 'nenhum',
    funcao_cultural: profile.funcao_cultural || '',
    razao_social: profile.razao_social || '',
    nome_fantasia: profile.nome_fantasia || '',
    endereco_sede: profile.endereco_sede || '',
    representante_nome: profile.representante_nome || '',
    representante_cpf: profile.representante_cpf || '',
    representante_genero: profile.representante_genero || '',
    representante_raca_etnia: profile.representante_raca_etnia || '',
    representante_pcd: profile.representante_pcd || false,
    representante_escolaridade: profile.representante_escolaridade || '',
    nome_coletivo: '', ano_criacao: '', quantidade_membros: '', portfolio: '',
    membros: [] as { nome: string; cpf: string }[],
  })

  function updateAvaliador(field: string, value: string | string[]) {
    setAvaliadorData(prev => ({ ...prev, [field]: value }))
  }
  function updateGestor(field: string, value: string | string[]) {
    setGestorData(prev => ({ ...prev, [field]: value }))
  }
  function updateProponente(field: string, value: string | boolean | string[] | { nome: string; cpf: string }[]) {
    setProponenteData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSubmitting(true)

    let roleData: Record<string, string | boolean | string[] | null> = {}
    if (profile.role === 'avaliador') {
      roleData = {
        curriculo_descricao: avaliadorData.curriculo_descricao || null,
        areas_avaliacao: avaliadorData.areas_avaliacao.length > 0 ? avaliadorData.areas_avaliacao : null,
        lattes_url: avaliadorData.lattes_url || null,
      }
    } else if (profile.role === 'gestor') {
      roleData = {
        orgao_vinculado: gestorData.orgao_vinculado || null,
        funcao_cargo: gestorData.funcao_cargo || null,
        matricula: gestorData.matricula || null,
      }
    } else if (profile.role === 'proponente') {
      roleData = {
        areas_atuacao: proponenteData.areas_atuacao.length > 0 ? proponenteData.areas_atuacao : null,
        tempo_atuacao: proponenteData.tempo_atuacao || null,
        renda: proponenteData.renda || null,
        genero: proponenteData.genero || null,
        orientacao_sexual: proponenteData.orientacao_sexual || null,
        raca_etnia: proponenteData.raca_etnia || null,
        pcd: proponenteData.pcd,
        endereco_completo: proponenteData.endereco_completo || null,
        municipio: proponenteData.municipio || null,
        estado: proponenteData.estado || null,
        tipo_pessoa: proponenteData.tipo_pessoa || 'fisica',
        nome_artistico: proponenteData.nome_artistico || null,
        data_nascimento: proponenteData.data_nascimento || null,
        comunidade_tradicional: proponenteData.comunidade_tradicional || 'nenhuma',
        tipo_deficiencia: proponenteData.pcd ? (proponenteData.tipo_deficiencia || null) : null,
        escolaridade: proponenteData.escolaridade || null,
        beneficiario_programa_social: proponenteData.beneficiario_programa_social || 'nenhum',
        funcao_cultural: proponenteData.funcao_cultural || null,
        ...(proponenteData.tipo_pessoa === 'juridica' ? {
          razao_social: proponenteData.razao_social || null,
          nome_fantasia: proponenteData.nome_fantasia || null,
          endereco_sede: proponenteData.endereco_sede || null,
          representante_nome: proponenteData.representante_nome || null,
          representante_cpf: proponenteData.representante_cpf || null,
          representante_genero: proponenteData.representante_genero || null,
          representante_raca_etnia: proponenteData.representante_raca_etnia || null,
          representante_pcd: proponenteData.representante_pcd,
          representante_escolaridade: proponenteData.representante_escolaridade || null,
        } : {}),
      }
    }

    const result = await adminUpdateProfile(profile.id, {
      nome: form.nome,
      telefone: form.telefone || null,
      cpf_cnpj: form.cpf_cnpj || null,
      ...roleData,
    })

    if (result.success) {
      toast.success('Perfil atualizado com sucesso')
      setOpen(false)
      // Reload page to reflect changes
      window.location.reload()
    } else {
      toast.error('Erro ao atualizar: ' + result.error)
    }
    setSubmitting(false)
  }

  const roleLabel = ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] || profile.role

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm gap-2 h-10 px-5 transition-all"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar Perfil
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto border-l-0 p-0 bg-white">
          {/* Header */}
          <div className="bg-[var(--brand-primary)] px-8 pt-8 pb-6">
            <SheetHeader className="mb-0">
              <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-white">
                Editar Perfil
              </SheetTitle>
              <SheetDescription className="mt-3 space-y-2">
                <span className="text-sm font-medium text-white/80 block">{profile.nome}</span>
                <code className="text-[11px] font-medium text-white bg-white/15 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {roleLabel}
                </code>
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="space-y-6 px-8 py-6">
            {/* Dados Pessoais */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Dados Pessoais</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome completo</Label>
                  <Input
                    value={form.nome}
                    onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                    required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">CPF / CNPJ</Label>
                    <Input
                      value={form.cpf_cnpj}
                      onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))}
                      placeholder="000.000.000-00"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Telefone</Label>
                    <Input
                      value={form.telefone}
                      onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Role-specific fields */}
            {['avaliador', 'gestor', 'proponente'].includes(profile.role) && (
              <section className="pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Dados do {roleLabel}
                  </h3>
                </div>
                {profile.role === 'avaliador' && (
                  <AvaliadorForm form={avaliadorData} onChange={updateAvaliador} />
                )}
                {profile.role === 'gestor' && (
                  <GestorForm form={gestorData} onChange={updateGestor} />
                )}
                {profile.role === 'proponente' && (
                  <ProponenteForm form={proponenteData} onChange={updateProponente} />
                )}
              </section>
            )}
          </div>

          <SheetFooter className="px-8 py-5 border-t border-slate-100 bg-slate-50/80">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-slate-200">
              Cancelar
            </Button>
            <Button
              disabled={submitting}
              onClick={handleSave}
              className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white min-w-[140px] font-semibold transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
