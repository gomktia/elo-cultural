'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { avancarEtapa } from '@/lib/actions/edital-actions'
import { toast } from 'sonner'
import { Loader2, ChevronRight } from 'lucide-react'

const FASE_LABELS: Record<string, string> = {
  criacao: 'Criação',
  publicacao: 'Publicação',
  inscricao: 'Inscrição',
  inscricao_encerrada: 'Inscrição Encerrada',
  divulgacao_inscritos: 'Divulgação de Inscritos',
  recurso_divulgacao_inscritos: 'Recurso da Divulgação',
  avaliacao_tecnica: 'Avaliação Técnica',
  resultado_preliminar_avaliacao: 'Resultado Preliminar (Avaliação)',
  recurso_avaliacao: 'Recurso da Avaliação',
  habilitacao: 'Habilitação',
  resultado_preliminar_habilitacao: 'Resultado Preliminar (Habilitação)',
  recurso_habilitacao: 'Recurso da Habilitação',
  resultado_definitivo_habilitacao: 'Resultado Definitivo (Habilitação)',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologação',
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
    if (!confirm('Tem certeza que deseja avançar para a próxima etapa?')) return

    setLoading(true)
    const result = await avancarEtapa(editalId)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Etapa avançada para: ${FASE_LABELS[result.newPhase!] || result.newPhase}`)
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
      Avançar Etapa
    </Button>
  )
}
