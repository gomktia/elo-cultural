'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Upload, X, Users, FileText, Save, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function EditarTenantPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingRodape, setUploadingRodape] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    dominio: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
    cor_primaria: '#0047AB',
    cor_secundaria: '#7E3AF2',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoRodapeUrl, setLogoRodapeUrl] = useState<string | null>(null)
  const [stats, setStats] = useState({ usuarios: 0, editais: 0 })
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'super_admin') { router.push('/dashboard'); return }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (!tenant) {
        toast.error('Tenant nao encontrado.')
        router.push('/super/tenants')
        return
      }

      const cores = tenant.tema_cores as { primary?: string; secondary?: string } | null
      setForm({
        nome: tenant.nome || '',
        cnpj: tenant.cnpj || '',
        dominio: tenant.dominio || '',
        status: tenant.status || 'ativo',
        cor_primaria: cores?.primary || '#0047AB',
        cor_secundaria: cores?.secondary || '#7E3AF2',
      })
      setLogoUrl(tenant.logo_url || null)
      setLogoRodapeUrl(tenant.logo_rodape_url || null)
      setCreatedAt(tenant.created_at)

      // Buscar contagens
      const [{ count: userCount }, { count: editalCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('editais').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      ])
      setStats({ usuarios: userCount || 0, editais: editalCount || 0 })

      setLoading(false)
    }
    load()
  }, [tenantId, router])

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('tenants')
      .update({
        nome: form.nome,
        cnpj: form.cnpj,
        dominio: form.dominio,
        status: form.status,
        tema_cores: { primary: form.cor_primaria, secondary: form.cor_secundaria },
        logo_url: logoUrl,
        logo_rodape_url: logoRodapeUrl,
      })
      .eq('id', tenantId)

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Prefeitura atualizada com sucesso!')
    }
    setSaving(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'rodape') {
    const file = e.target.files?.[0]
    if (!file) return

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingRodape
    const setUrl = type === 'logo' ? setLogoUrl : setLogoRodapeUrl

    setUploading(true)
    const supabase = createClient()
    const path = `${tenantId}/branding/${type}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('documentos').upload(path, file)
    if (upErr) {
      toast.error('Erro no upload: ' + upErr.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
    setUrl(urlData.publicUrl)
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-50 text-[var(--brand-success)]',
    inativo: 'bg-slate-50 text-slate-400',
    suspenso: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/super/tenants">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Editar Prefeitura</h1>
                <Badge className={`${statusColors[form.status]} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                  {form.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{form.nome || 'Carregando...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <Users className="h-5 w-5 text-[var(--brand-primary)] mx-auto mb-2" />
          <p className="text-2xl font-semibold text-slate-900">{stats.usuarios}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Usuarios</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <FileText className="h-5 w-5 text-[#059669] mx-auto mb-2" />
          <p className="text-2xl font-semibold text-slate-900">{stats.editais}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Editais</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <Building2 className="h-5 w-5 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">{form.dominio || '—'}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Dominio</p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-700 mt-2">{createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '—'}</p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Criado em</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados da Prefeitura */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[var(--brand-primary)] p-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Dados da Prefeitura</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="nome" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Nome da Prefeitura / Secretaria *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Prefeitura Municipal de Goiania"
                    value={form.nome}
                    onChange={e => updateForm('nome', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    placeholder="Ex: 00.000.000/0001-00"
                    value={form.cnpj}
                    onChange={e => updateForm('cnpj', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dominio" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Dominio / Slug *</Label>
                  <Input
                    id="dominio"
                    placeholder="Ex: goiania"
                    value={form.dominio}
                    onChange={e => updateForm('dominio', e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={e => updateForm('status', e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identidade Visual */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[var(--brand-primary)] p-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cor_primaria" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Cor Primaria</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor_primaria"
                      value={form.cor_primaria}
                      onChange={e => updateForm('cor_primaria', e.target.value)}
                      className="h-11 w-14 rounded-xl border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={form.cor_primaria}
                      onChange={e => updateForm('cor_primaria', e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cor_secundaria" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Cor Secundaria</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor_secundaria"
                      value={form.cor_secundaria}
                      onChange={e => updateForm('cor_secundaria', e.target.value)}
                      className="h-11 w-14 rounded-xl border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={form.cor_secundaria}
                      onChange={e => updateForm('cor_secundaria', e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: form.cor_primaria }}
                  >
                    {form.nome ? form.nome.slice(0, 2).toUpperCase() : 'AB'}
                  </div>
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: form.cor_secundaria }}
                  >
                    {form.nome ? form.nome.slice(0, 2).toUpperCase() : 'AB'}
                  </div>
                  <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${form.cor_primaria}, ${form.cor_secundaria})` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logotipos */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[var(--brand-primary)] p-4">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Logotipos</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Principal */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Logo Principal (Cabecalho)</Label>
                  {logoUrl ? (
                    <div className="relative inline-block">
                      <img src={logoUrl} alt="Logo" className="h-20 w-auto rounded-xl border border-slate-200 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-rose-100 hover:bg-rose-200 rounded-full flex items-center justify-center text-rose-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/5 transition-all">
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-300" />
                          <p className="text-xs text-slate-400 font-medium">Enviar logo</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logo')} />
                    </label>
                  )}
                </div>

                {/* Logo Rodapé */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Logo de Rodape (Gov. Federal)</Label>
                  {logoRodapeUrl ? (
                    <div className="relative inline-block">
                      <img src={logoRodapeUrl} alt="Logo Rodape" className="h-20 w-auto rounded-xl border border-slate-200 shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setLogoRodapeUrl(null)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-rose-100 hover:bg-rose-200 rounded-full flex items-center justify-center text-rose-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/5 transition-all">
                      {uploadingRodape ? (
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-300" />
                          <p className="text-xs text-slate-400 font-medium">Enviar logo rodape</p>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'rodape')} />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/super/tenants">
              <Button variant="ghost" type="button" className="h-10 px-6 rounded-xl font-semibold text-xs uppercase tracking-wide text-slate-400 hover:text-slate-900 transition-all">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-xs uppercase tracking-wide shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
