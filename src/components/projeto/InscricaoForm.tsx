'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
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

interface Categoria {
  id: string
  nome: string
  vagas: number
}

interface CampoExtra {
  id: string
  label: string
  tipo: string
  obrigatorio: boolean
  opcoes: string[]
  placeholder: string | null
  ordem: number
}

export function InscricaoForm({ editalId, tenantId }: InscricaoFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [camposExtras, setCamposExtras] = useState<CampoExtra[]>([])
  const [camposValues, setCamposValues] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    titulo: '',
    resumo: '',
    descricao_tecnica: '',
    orcamento_total: '',
    cronograma_execucao: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('edital_categorias')
      .select('id, nome, vagas')
      .eq('edital_id', editalId)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) setCategorias(data)
      })
    supabase
      .from('edital_campos_inscricao')
      .select('*')
      .eq('edital_id', editalId)
      .order('ordem')
      .then(({ data }) => {
        if (data && data.length > 0) setCamposExtras(data)
      })
  }, [editalId])
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
      toast.error('Você deve aceitar os termos para enviar.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setLoading(false); return }

    const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}`

    const { data: projeto, error } = await supabase
      .from('projetos')
      .insert({
        tenant_id: tenantId,
        edital_id: editalId,
        proponente_id: user.id,
        categoria_id: categoriaId || null,
        numero_protocolo: protocolo,
        titulo: form.titulo,
        resumo: form.resumo || null,
        descricao_tecnica: form.descricao_tecnica || null,
        orcamento_total: form.orcamento_total ? parseFloat(form.orcamento_total) : null,
        cronograma_execucao: form.cronograma_execucao || null,
        campos_extras: camposExtras.length > 0 ? Object.fromEntries(
          camposExtras.map(c => [c.label, camposValues[c.id] || ''])
        ) : {},
        ip_submissao: null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar inscrição: ' + error.message)
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

    logAudit({
      supabase,
      acao: 'INSCRICAO_PROJETO',
      tabela_afetada: 'projetos',
      registro_id: projeto!.id,
      tenant_id: tenantId,
      usuario_id: user.id,
      dados_novos: {
        protocolo,
        titulo: form.titulo,
        edital_id: editalId,
        documentos: documents.length,
      },
    }).catch(() => {})

    toast.success(`Inscrição enviada! Protocolo: ${protocolo}`)

    // Fire-and-forget: send confirmation email
    fetch('/api/email/notify-inscricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolo, titulo: form.titulo, editalTitulo: '' }),
    }).catch(() => {})

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
              {s === 1 ? 'Dados' : s === 2 ? 'Documentos' : 'Revisão'}
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
              <Label htmlFor="titulo">Título do Projeto *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={e => updateForm('titulo', e.target.value)}
                placeholder="Nome do seu projeto cultural"
                required
              />
            </div>
            {categorias.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria de Seleção *</Label>
                <select
                  id="categoria"
                  value={categoriaId}
                  onChange={e => setCategoriaId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}{c.vagas > 0 ? ` (${c.vagas} vagas)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea
                id="resumo"
                value={form.resumo}
                onChange={e => updateForm('resumo', e.target.value)}
                placeholder="Breve descrição do projeto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao_tecnica">Descrição Técnica</Label>
              <Textarea
                id="descricao_tecnica"
                value={form.descricao_tecnica}
                onChange={e => updateForm('descricao_tecnica', e.target.value)}
                placeholder="Detalhamento técnico do projeto"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orcamento">Orçamento Total (R$)</Label>
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
              <Label htmlFor="cronograma">Cronograma de Execução</Label>
              <Textarea
                id="cronograma"
                value={form.cronograma_execucao}
                onChange={e => updateForm('cronograma_execucao', e.target.value)}
                placeholder="Descreva as etapas e prazos"
                rows={3}
              />
            </div>

            {/* Campos extras do edital */}
            {camposExtras.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Informações Adicionais</h4>
                {camposExtras.map(campo => (
                  <div key={campo.id} className="space-y-2">
                    <Label htmlFor={`campo-${campo.id}`}>
                      {campo.label}{campo.obrigatorio ? ' *' : ''}
                    </Label>
                    {campo.tipo === 'text' && (
                      <Input
                        id={`campo-${campo.id}`}
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                      />
                    )}
                    {campo.tipo === 'textarea' && (
                      <Textarea
                        id={`campo-${campo.id}`}
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                        rows={3}
                      />
                    )}
                    {campo.tipo === 'number' && (
                      <Input
                        id={`campo-${campo.id}`}
                        type="number"
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                      />
                    )}
                    {campo.tipo === 'select' && (
                      <select
                        id={`campo-${campo.id}`}
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecione...</option>
                        {campo.opcoes?.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    )}
                    {campo.tipo === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={camposValues[campo.id] === 'true'}
                          onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.checked ? 'true' : 'false' }))}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">{campo.placeholder || campo.label}</span>
                      </label>
                    )}
                    {campo.tipo === 'file' && (
                      <DocumentUpload
                        tipo="complementar"
                        label=""
                        tenantId={tenantId}
                        onUpload={(doc) => {
                          setCamposValues(prev => ({ ...prev, [campo.id]: doc.storage_path }))
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => {
                const missingRequired = camposExtras.filter(c => c.obrigatorio && !camposValues[c.id]?.trim())
                if (missingRequired.length > 0) {
                  toast.error(`Preencha: ${missingRequired.map(c => c.label).join(', ')}`)
                  return
                }
                setStep(2)
              }} disabled={!form.titulo || (categorias.length > 0 && !categoriaId)}>
                Próximo
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
            <DocumentUpload tipo="orcamento" label="Planilha Orçamentária" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="complementar" label="Documentos Complementares" tenantId={tenantId} onUpload={handleDocUpload} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Próximo
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
            <CardTitle>Revisão e Envio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <h4 className="font-medium">Dados do Projeto</h4>
              <p className="text-sm"><strong>Título:</strong> {form.titulo}</p>
              {categoriaId && (
                <p className="text-sm"><strong>Categoria:</strong> {categorias.find(c => c.id === categoriaId)?.nome}</p>
              )}
              {form.resumo && <p className="text-sm"><strong>Resumo:</strong> {form.resumo}</p>}
              {form.orcamento_total && <p className="text-sm"><strong>Orçamento:</strong> R$ {parseFloat(form.orcamento_total).toFixed(2)}</p>}
              {camposExtras.filter(c => camposValues[c.id]?.trim()).map(c => (
                <p key={c.id} className="text-sm"><strong>{c.label}:</strong> {camposValues[c.id]}</p>
              ))}
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
                Declaro que as informações prestadas são verdadeiras e que estou ciente das regras do edital.
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !aceitaTermos}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Inscrição
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
