'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Loader2, FileText } from 'lucide-react'

export default function PublicacoesAdminPage() {
  const params = useParams()
  const editalId = params.id as string
  const [publicacoes, setPublicacoes] = useState<any[]>([])
  const [edital, setEdital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ tipo: '', titulo: '', conteudo: '' })

  useEffect(() => {
    loadData()
  }, [editalId])

  async function loadData() {
    const supabase = createClient()
    const { data: ed } = await supabase.from('editais').select('*').eq('id', editalId).single()
    setEdital(ed)

    const { data: pubs } = await supabase
      .from('publicacoes')
      .select('*')
      .eq('edital_id', editalId)
      .order('data_publicacao', { ascending: false })

    setPublicacoes(pubs || [])
    setLoading(false)
  }

  async function criarPublicacao() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const nextNum = publicacoes.length + 1

    const { error } = await supabase.from('publicacoes').insert({
      tenant_id: edital.tenant_id,
      edital_id: editalId,
      tipo: form.tipo,
      numero_publicacao: nextNum,
      titulo: form.titulo,
      conteudo: form.conteudo || null,
      publicado_por: user!.id,
    })

    if (error) {
      toast.error('Erro ao criar publicação: ' + error.message)
    } else {
      toast.success('Publicação criada com sucesso')
      setDialogOpen(false)
      setForm({ tipo: '', titulo: '', conteudo: '' })
      loadData()
    }
    setSaving(false)
  }

  const tipoLabels: Record<string, string> = {
    resultado_preliminar: 'Resultado Preliminar',
    resultado_final: 'Resultado Final',
    ata: 'Ata',
    homologacao: 'Homologação',
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-6">
          <Link href={`/admin/editais/${editalId}`}>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" />
            </Button>
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Publicações</h1>
            <p className="text-base text-slate-400 font-normal">{edital?.titulo}</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95 group text-sm">
              <Plus className="mr-2 h-4 w-4 text-white transition-transform duration-500" />
              Nova Publicação
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] p-6 border-slate-200 shadow-2xl overflow-hidden max-w-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--brand-primary)]" />
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 text-left">Criar Comunicado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide ml-1">Tipo de Documento</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-slate-200">
                    <SelectItem value="resultado_preliminar">Resultado Preliminar</SelectItem>
                    <SelectItem value="resultado_final">Resultado Final</SelectItem>
                    <SelectItem value="ata">Ata de Reunião</SelectItem>
                    <SelectItem value="homologacao">Termo de Homologação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide ml-1">Título da Publicação</Label>
                <Input
                  value={form.titulo}
                  onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm"
                  placeholder="Ex: Resultado da Etapa Técnica"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide ml-1">Conteúdo / Descrição</Label>
                <Textarea
                  value={form.conteudo}
                  onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
                  rows={4}
                  className="rounded-2xl border-slate-200 bg-slate-50 font-medium p-4 focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm"
                  placeholder="Digite aqui os detalhes da publicação..."
                />
              </div>
              <Button
                onClick={criarPublicacao}
                disabled={saving || !form.tipo || !form.titulo}
                className="h-11 w-full rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-bold shadow-xl shadow-[#0047AB]/20 transition-all active:scale-98 text-sm mt-2"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Publicação'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 p-1 overflow-hidden shadow-lg">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead className="w-16 py-4 px-6 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">#</TableHead>
              <TableHead className="py-4 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Título</TableHead>
              <TableHead className="py-4 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Tipo</TableHead>
              <TableHead className="py-4 px-8 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publicacoes.map((pub: any) => (
              <TableRow key={pub.id} className="hover:bg-white transition-all duration-300 border-slate-50 group">
                <TableCell className="py-3.5 px-6">
                  <div className="h-8 w-8 flex items-center justify-center font-semibold text-slate-300 text-sm bg-slate-50 rounded-lg mx-auto">
                    {pub.numero_publicacao}
                  </div>
                </TableCell>
                <TableCell className="py-3.5 px-4">
                  <div className="text-sm font-bold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                    {pub.titulo}
                  </div>
                </TableCell>
                <TableCell className="py-3.5 px-4">
                  <Badge className="bg-slate-100 text-slate-500 border-none font-medium text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-md">
                    {tipoLabels[pub.tipo] || pub.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="py-3.5 px-8 text-right font-medium text-[11px] text-slate-400 uppercase tracking-wide">
                  {new Date(pub.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </TableCell>
              </TableRow>
            ))}
            {publicacoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-[200px] mx-auto">
                      Nenhuma publicação registrada.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
