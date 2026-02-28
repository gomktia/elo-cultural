'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentUpload } from '@/components/projeto/DocumentUpload'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function RecursoPage() {
  const router = useRouter()
  const params = useParams()
  const projetoId = params.id as string
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<string>('')
  const [fundamentacao, setFundamentacao] = useState('')
  const [anexos, setAnexos] = useState<Array<{ storage_path: string; nome_arquivo: string }>>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tipo || !fundamentacao) {
      toast.error('Preencha todos os campos obrigatorios.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    const protocolo = `REC-${Date.now().toString(36).toUpperCase()}`

    const { data: recurso, error } = await supabase
      .from('recursos')
      .insert({
        tenant_id: profile!.tenant_id,
        projeto_id: projetoId,
        proponente_id: user!.id,
        tipo,
        numero_protocolo: protocolo,
        fundamentacao,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar recurso: ' + error.message)
      setLoading(false)
      return
    }

    // Save attachments
    if (anexos.length > 0 && recurso) {
      await supabase.from('recurso_anexos').insert(
        anexos.map(a => ({
          recurso_id: recurso.id,
          storage_path: a.storage_path,
          nome_arquivo: a.nome_arquivo,
        }))
      )
    }

    toast.success(`Recurso enviado! Protocolo: ${protocolo}`)
    router.push(`/projetos/${projetoId}`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/projetos/${projetoId}`}>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interpor Recurso</h1>
          <p className="text-muted-foreground">Fundamentacao obrigatoria</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do Recurso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Recurso *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habilitacao">Habilitacao</SelectItem>
                  <SelectItem value="avaliacao">Avaliacao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundamentacao">Fundamentacao *</Label>
              <Textarea
                id="fundamentacao"
                value={fundamentacao}
                onChange={e => setFundamentacao(e.target.value)}
                placeholder="Descreva detalhadamente os motivos do recurso..."
                rows={8}
                required
              />
            </div>

            <DocumentUpload
              tipo="complementar"
              label="Anexos do Recurso"
              tenantId=""
              onUpload={(doc) => setAnexos(prev => [...prev, { storage_path: doc.storage_path, nome_arquivo: doc.nome_arquivo }])}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Link href={`/projetos/${projetoId}`}>
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Recurso
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
