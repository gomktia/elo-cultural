'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Upload, Image, X } from 'lucide-react'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    dominio: '',
    cor_primaria: '#1A56DB',
    cor_secundaria: '#7E3AF2',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoRodapeUrl, setLogoRodapeUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingRodape, setUploadingRodape] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

      // Role guard: only admin and super_admin can access this page
      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        toast.error('Acesso não autorizado')
        router.push('/dashboard')
        return
      }

      if (!profile.tenant_id) {
        setLoading(false)
        return
      }

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

      setTenant(t)
      if (t) {
        setForm({
          nome: t.nome || '',
          cnpj: t.cnpj || '',
          dominio: t.dominio || '',
          cor_primaria: t.tema_cores?.primary || '#1A56DB',
          cor_secundaria: t.tema_cores?.secondary || '#7E3AF2',
        })
        setLogoUrl(t.logo_url || null)
        setLogoRodapeUrl(t.logo_rodape_url || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tenants')
      .update({
        nome: form.nome,
        cnpj: form.cnpj,
        dominio: form.dominio,
        tema_cores: { primary: form.cor_primaria, secondary: form.cor_secundaria },
        logo_url: logoUrl,
        logo_rodape_url: logoRodapeUrl,
      })
      .eq('id', tenant.id)

    if (error) {
      toast.error('Erro ao salvar configuracoes: ' + error.message)
    } else {
      toast.success('Configuracoes salvas com sucesso')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum municipio configurado para sua conta.
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Configurações</h1>
            <p className="text-sm text-slate-500">Dados do município e personalização visual da plataforma.</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={salvar} className="space-y-6">
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[var(--brand-primary)] p-4 border-b border-[var(--brand-primary)]">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Dados do Município</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Nome da Prefeitura / Secretaria</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dominio" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Domínio Customizado</Label>
                <Input
                  id="dominio"
                  value={form.dominio}
                  onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  placeholder="prefeitura.gov.br"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[var(--brand-primary)] p-4 border-b border-[var(--brand-primary)]">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Identidade Visual</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cor-primaria" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="cor-primaria"
                    value={form.cor_primaria}
                    onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))}
                    className="h-10 w-10 rounded-lg cursor-pointer border-slate-200 bg-white"
                  />
                  <Input
                    value={form.cor_primaria}
                    onChange={e => setForm(p => ({ ...p, cor_primaria: e.target.value }))}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-mono text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cor-secundaria" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Cor Secundária</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="cor-secundaria"
                    value={form.cor_secundaria}
                    onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))}
                    className="h-10 w-10 rounded-lg cursor-pointer border-slate-200 bg-white"
                  />
                  <Input
                    value={form.cor_secundaria}
                    onChange={e => setForm(p => ({ ...p, cor_secundaria: e.target.value }))}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-mono text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div
                className="h-10 flex-1 rounded-xl flex items-center justify-center text-white text-xs font-medium uppercase tracking-wide shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: form.cor_primaria }}
              >
                Branding Primário
              </div>
              <div
                className="h-10 flex-1 rounded-xl flex items-center justify-center text-white text-xs font-medium uppercase tracking-wide shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: form.cor_secundaria }}
              >
                Branding Secundário
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[var(--brand-primary)] p-4 border-b border-[var(--brand-primary)]">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Logotipos</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Principal */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Logo Principal (Cabeçalho)</Label>
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
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)]/40 hover:bg-brand-primary/5 transition-all">
                    {uploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-300" />
                        <p className="text-xs text-slate-400 font-medium">Enviar logo</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadingLogo(true)
                        const supabase = createClient()
                        const path = `${tenant.id}/branding/logo-${Date.now()}.${file.name.split('.').pop()}`
                        const { error: upErr } = await supabase.storage.from('documentos').upload(path, file)
                        if (upErr) { toast.error('Erro: ' + upErr.message); setUploadingLogo(false); return }
                        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
                        setLogoUrl(urlData.publicUrl)
                        setUploadingLogo(false)
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Logo Rodape */}
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
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)]/40 hover:bg-brand-primary/5 transition-all">
                    {uploadingRodape ? (
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
                    ) : (
                      <>
                        <Image className="h-6 w-6 text-slate-300" />
                        <p className="text-xs text-slate-400 font-medium">Enviar logo rodape</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadingRodape(true)
                        const supabase = createClient()
                        const path = `${tenant.id}/branding/rodape-${Date.now()}.${file.name.split('.').pop()}`
                        const { error: upErr } = await supabase.storage.from('documentos').upload(path, file)
                        if (upErr) { toast.error('Erro: ' + upErr.message); setUploadingRodape(false); return }
                        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path)
                        setLogoRodapeUrl(urlData.publicUrl)
                        setUploadingRodape(false)
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-slate-100" />

        <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status da Instância</span>
            <Badge className={[
              'border-none rounded-lg px-2 text-xs font-medium uppercase tracking-wide py-0.5',
              tenant.status === 'ativo' ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-slate-50 text-slate-400'
            ].join(' ')}>
              {tenant.status}
            </Badge>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-bold text-xs uppercase tracking-wide shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
