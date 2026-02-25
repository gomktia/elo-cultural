'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentUpload } from './DocumentUpload'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react'

interface InscricaoFormProps {
  editalId: string
  tenantId: string
}

export function InscricaoForm({ editalId, tenantId }: InscricaoFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    resumo: '',
    descricao_tecnica: '',
    orcamento_total: '',
    cronograma_execucao: '',
  })
  const [documents, setDocuments] = useState<Array<{
    nome_arquivo: string
    storage_path: string
    tamanho_bytes: number
    tipo: string
  }>>([])
  const [aceitaTermos, setAceitaTermos] = useState(false)

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleDocUpload(doc: { nome_arquivo: string; storage_path: string; tamanho_bytes: number; tipo: string }) {
    setDocuments(prev => [...prev, doc])
  }

  async function handleSubmit() {
    if (!aceitaTermos) {
      toast.error('Voce deve aceitar os termos para enviar.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}`

    const { data: projeto, error } = await supabase
      .from('projetos')
      .insert({
        tenant_id: tenantId,
        edital_id: editalId,
        proponente_id: user!.id,
        numero_protocolo: protocolo,
        titulo: form.titulo,
        resumo: form.resumo || null,
        descricao_tecnica: form.descricao_tecnica || null,
        orcamento_total: form.orcamento_total ? parseFloat(form.orcamento_total) : null,
        cronograma_execucao: form.cronograma_execucao || null,
        ip_submissao: null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar inscricao: ' + error.message)
      setLoading(false)
      return
    }

    // Save documents
    if (documents.length > 0 && projeto) {
      await supabase.from('projeto_documentos').insert(
        documents.map(doc => ({
          tenant_id: tenantId,
          projeto_id: projeto.id,
          tipo: doc.tipo,
          nome_arquivo: doc.nome_arquivo,
          storage_path: doc.storage_path,
          tamanho_bytes: doc.tamanho_bytes,
        }))
      )
    }

    toast.success(`Inscricao enviada! Protocolo: ${protocolo}`)
    router.push('/projetos')
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              s < step ? 'bg-primary text-primary-foreground' :
              s === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Dados' : s === 2 ? 'Documentos' : 'Revisao'}
            </span>
            {s < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Project Data */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo do Projeto *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={e => updateForm('titulo', e.target.value)}
                placeholder="Nome do seu projeto cultural"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                value={form.resumo}
                onChange={e => updateForm('resumo', e.target.value)}
                placeholder="Breve descricao do projeto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao_tecnica">Descricao Tecnica</Label>
              <Textarea
                id="descricao_tecnica"
                value={form.descricao_tecnica}
                onChange={e => updateForm('descricao_tecnica', e.target.value)}
                placeholder="Detalhamento tecnico do projeto"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orcamento">Orcamento Total (R$)</Label>
                <Input
                  id="orcamento"
                  type="number"
                  step="0.01"
                  value={form.orcamento_total}
                  onChange={e => updateForm('orcamento_total', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cronograma">Cronograma de Execucao</Label>
              <Textarea
                id="cronograma"
                value={form.cronograma_execucao}
                onChange={e => updateForm('cronograma_execucao', e.target.value)}
                placeholder="Descreva as etapas e prazos"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!form.titulo}>
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUpload tipo="identidade" label="Documento de Identidade" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="proposta" label="Proposta do Projeto" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="orcamento" label="Planilha Orcamentaria" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="complementar" label="Documentos Complementares" tenantId={tenantId} onUpload={handleDocUpload} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisao e Envio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <h4 className="font-medium">Dados do Projeto</h4>
              <p className="text-sm"><strong>Titulo:</strong> {form.titulo}</p>
              {form.resumo && <p className="text-sm"><strong>Resumo:</strong> {form.resumo}</p>}
              {form.orcamento_total && <p className="text-sm"><strong>Orcamento:</strong> R$ {parseFloat(form.orcamento_total).toFixed(2)}</p>}
            </div>
            <div className="rounded-md border p-4 space-y-2">
              <h4 className="font-medium">Documentos ({documents.length})</h4>
              {documents.map((doc, i) => (
                <p key={i} className="text-sm">{doc.tipo}: {doc.nome_arquivo}</p>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
              )}
            </div>
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="termos"
                checked={aceitaTermos}
                onChange={e => setAceitaTermos(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="termos" className="text-sm text-muted-foreground leading-snug">
                Declaro que as informacoes prestadas sao verdadeiras e que estou ciente das regras do edital.
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !aceitaTermos}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Inscricao
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
