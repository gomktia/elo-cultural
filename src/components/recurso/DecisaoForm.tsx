'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'

interface DecisaoFormProps {
  recursoId: string
  onDecisao?: () => void
}

export function DecisaoForm({ recursoId, onDecisao }: DecisaoFormProps) {
  const [decisao, setDecisao] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDecisao(status: 'deferido' | 'indeferido') {
    if (!decisao.trim()) {
      toast.error('A justificativa da decisao e obrigatoria.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessão expirada'); setLoading(false); return }

    const { error } = await supabase
      .from('recursos')
      .update({
        status,
        decisao,
        decidido_por: user.id,
        data_decisao: new Date().toISOString(),
      })
      .eq('id', recursoId)

    if (error) {
      toast.error('Erro ao registrar decisao: ' + error.message)
    } else {
      toast.success(`Recurso ${status === 'deferido' ? 'deferido' : 'indeferido'} com sucesso`)
      onDecisao?.()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decisao do Recurso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="decisao">Justificativa da Decisao *</Label>
          <Textarea
            id="decisao"
            value={decisao}
            onChange={e => setDecisao(e.target.value)}
            placeholder="Fundamentacao da decisao..."
            rows={5}
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleDecisao('indeferido')}
            disabled={loading}
            className="text-destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <X className="mr-2 h-4 w-4" />
            Indeferir
          </Button>
          <Button onClick={() => handleDecisao('deferido')} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-4 w-4" />
            Deferir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
