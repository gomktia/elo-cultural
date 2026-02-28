'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovaTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    dominio: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
    cor_primaria: '#0047AB',
    cor_secundaria: '#7E3AF2',
  })

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Sessao expirada. Faca login novamente.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      toast.error('Acesso negado.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('tenants').insert({
      nome: form.nome,
      cnpj: form.cnpj,
      dominio: form.dominio,
      status: form.status,
      tema_cores: {
        primary: form.cor_primaria,
        secondary: form.cor_secundaria,
      },
    })

    if (error) {
      toast.error('Erro ao criar prefeitura: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Prefeitura criada com sucesso!')
    router.push('/super/tenants')
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/super/tenants">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Nova Prefeitura</h1>
              <p className="text-sm text-slate-500">Cadastre uma nova prefeitura ou municipio na plataforma.</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/super/tenants">
              <Button variant="ghost" type="button" className="h-10 px-6 rounded-xl font-semibold text-xs uppercase tracking-wide text-slate-400 hover:text-slate-900 transition-all">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-xs uppercase tracking-wide shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Criando...' : 'Criar Prefeitura'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
