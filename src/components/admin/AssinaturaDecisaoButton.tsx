'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assinarDecisao } from '@/lib/actions/assinar-decisao'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, Fingerprint } from 'lucide-react'

interface AssinaturaDecisaoButtonProps {
  recursoId: string
  editalId: string
  assinatura?: {
    hash_documento: string
    nome_signatario: string
    assinado_em: string
    ip_address: string
  } | null
}

export function AssinaturaDecisaoButton({
  recursoId,
  editalId,
  assinatura,
}: AssinaturaDecisaoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [localAssinatura, setLocalAssinatura] = useState(assinatura || null)

  async function handleAssinar() {
    setLoading(true)
    const result = await assinarDecisao(recursoId, editalId)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.success) {
      toast.success('Decisao assinada digitalmente com sucesso')
      setLocalAssinatura({
        hash_documento: result.hash!,
        nome_signatario: result.nome_signatario!,
        assinado_em: result.assinado_em!,
        ip_address: '',
      })
      router.refresh()
    }
  }

  if (localAssinatura) {
    return (
      <div className="bg-green-50/60 border border-green-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <Badge className="bg-green-100 text-green-700 border-none text-[11px] font-medium uppercase tracking-wide rounded-lg px-2 py-0.5">
            Assinado digitalmente
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-600">
            <span className="font-medium text-slate-500">Signatario:</span>{' '}
            {localAssinatura.nome_signatario}
          </p>
          <p className="text-xs text-slate-600">
            <span className="font-medium text-slate-500">Data:</span>{' '}
            {new Date(localAssinatura.assinado_em).toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-slate-400 font-mono break-all">
            SHA-256: {localAssinatura.hash_documento}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={handleAssinar}
      disabled={loading}
      variant="outline"
      className="w-full h-10 rounded-xl border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold text-sm gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      Assinar Decisao Digitalmente
    </Button>
  )
}
