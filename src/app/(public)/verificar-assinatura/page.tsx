'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Shield, Search, CheckCircle2, XCircle, Loader2, FileSignature } from 'lucide-react'

interface AssinaturaResult {
  id: string
  tipo_assinatura: string
  hash_documento: string
  ip_address: string
  user_agent: string
  data_assinatura: string
  assinante_nome: string
  termo_numero: string
  projeto_titulo: string
}

export default function VerificarAssinaturaPage() {
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssinaturaResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch() {
    if (!hash.trim()) return
    setLoading(true)
    setResult(null)
    setNotFound(false)

    const supabase = createClient()

    const { data } = await supabase
      .from('assinaturas_digitais')
      .select(`
        id, papel_signatario, hash_documento, ip_address, user_agent, assinado_em,
        nome_signatario, documento_id
      `)
      .eq('hash_documento', hash.trim())
      .single()

    if (data) {
      // Fetch termo + projeto separately to avoid join issues
      let termoNumero = '—'
      let projetoTitulo = '—'
      if (data.documento_id) {
        const { data: termo } = await supabase
          .from('termos_execucao')
          .select('numero_termo, projetos:projeto_id (titulo)')
          .eq('id', data.documento_id)
          .single()
        if (termo) {
          termoNumero = termo.numero_termo || '—'
          const proj = termo.projetos as unknown as { titulo: string } | null
          projetoTitulo = proj?.titulo || '—'
        }
      }
      setResult({
        id: data.id,
        tipo_assinatura: data.papel_signatario,
        hash_documento: data.hash_documento,
        ip_address: data.ip_address || '',
        user_agent: data.user_agent || '',
        data_assinatura: data.assinado_em,
        assinante_nome: data.nome_signatario || '—',
        termo_numero: termoNumero,
        projeto_titulo: projetoTitulo,
      })
    } else {
      setNotFound(true)
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-[var(--brand-primary)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verificar Assinatura Digital</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Insira o hash SHA-256 do documento para verificar a autenticidade da assinatura eletrônica.
          </p>
        </div>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Hash SHA-256 do documento..."
                value={hash}
                onChange={e => setHash(e.target.value)}
                className="flex-1 rounded-xl h-11 font-mono text-xs"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !hash.trim()}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white rounded-xl h-11 px-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {notFound && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Assinatura não encontrada</p>
                  <p className="text-xs text-red-600 mt-0.5">O hash informado não corresponde a nenhuma assinatura registrada.</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Assinatura válida</p>
                    <p className="text-xs text-green-600 mt-0.5">Este documento foi assinado eletronicamente conforme Lei nº 14.063/2020.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Assinante</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{result.assinante_nome}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Tipo</p>
                    <Badge className="mt-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[10px]">
                      {result.tipo_assinatura === 'proponente' ? 'Agente Cultural' : 'Ente Federativo'}
                    </Badge>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Termo</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{result.termo_numero}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Projeto</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{result.projeto_titulo}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Data/Hora</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {new Date(result.data_assinatura).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">IP</p>
                    <p className="text-xs font-mono text-slate-600 mt-0.5">{result.ip_address || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Hash SHA-256</p>
                    <p className="text-[10px] font-mono text-slate-600 mt-0.5 break-all">{result.hash_documento}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-slate-400 text-center">
          Verificação baseada na Lei nº 14.063/2020 (assinatura eletrônica simples).
        </p>
      </div>
    </div>
  )
}
