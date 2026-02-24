'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RecursoFormProps {
  tipo: string
  onTipoChange: (v: string) => void
  fundamentacao: string
  onFundamentacaoChange: (v: string) => void
  disabled?: boolean
}

export function RecursoForm({ tipo, onTipoChange, fundamentacao, onFundamentacaoChange, disabled }: RecursoFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Recurso *</Label>
        <Select value={tipo} onValueChange={onTipoChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="habilitacao">Recurso de Habilitacao</SelectItem>
            <SelectItem value="avaliacao">Recurso de Avaliacao</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fundamentacao">Fundamentacao *</Label>
        <Textarea
          id="fundamentacao"
          value={fundamentacao}
          onChange={e => onFundamentacaoChange(e.target.value)}
          placeholder="Descreva detalhadamente os motivos do recurso, com base legal e argumentativa..."
          rows={8}
          disabled={disabled}
          required
        />
        <p className="text-xs text-muted-foreground">Minimo de 50 caracteres. Seja claro e objetivo.</p>
      </div>
    </div>
  )
}
