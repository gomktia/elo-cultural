'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { avancarEtapa } from '@/lib/actions/edital-actions'
import { toast } from 'sonner'
import { Loader2, ChevronRight } from 'lucide-react'

const FASE_LABELS: Record<string, string> = {
  criacao: 'Criacao',
  publicacao: 'Publicacao',
  inscricao: 'Inscricao',
  inscricao_encerrada: 'Inscricao Encerrada',
  divulgacao_inscritos: 'Divulgacao de Inscritos',
  recurso_divulgacao_inscritos: 'Recurso da Divulgacao',
  avaliacao_tecnica: 'Avaliacao Tecnica',
  resultado_preliminar_avaliacao: 'Resultado Preliminar (Avaliacao)',
  recurso_avaliacao: 'Recurso da Avaliacao',
  habilitacao: 'Habilitacao',
  resultado_preliminar_habilitacao: 'Resultado Preliminar (Habilitacao)',
  recurso_habilitacao: 'Recurso da Habilitacao',
  resultado_definitivo_habilitacao: 'Resultado Definitivo (Habilitacao)',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologacao',
  arquivamento: 'Arquivamento',
}

interface AvancarEtapaButtonProps {
  editalId: string
  currentStatus: string
}

export function AvancarEtapaButton({ editalId, currentStatus }: AvancarEtapaButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (currentStatus === 'arquivamento') return null

  async function handleClick() {
    if (!confirm('Tem certeza que deseja avancar para a proxima etapa?')) return

    setLoading(true)
    const result = await avancarEtapa(editalId)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Etapa avancada para: ${FASE_LABELS[result.newPhase!] || result.newPhase}`)
      router.refresh()
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-10 rounded-xl bg-[var(--brand-success)] hover:opacity-90 text-white font-semibold transition-all text-xs uppercase tracking-wide shadow-sm"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ChevronRight className="mr-2 h-4 w-4" />
      )}
      Avancar Etapa
    </Button>
  )
}
