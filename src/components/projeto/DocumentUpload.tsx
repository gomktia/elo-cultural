'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

interface UploadedFile {
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  tipo: string
}

interface DocumentUploadProps {
  tipo: string
  label: string
  projetoId?: string
  tenantId: string
  onUpload: (file: UploadedFile) => void
  existingFiles?: UploadedFile[]
}

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

export function DocumentUpload({ tipo, label, tenantId, onUpload, existingFiles = [] }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB`)
      e.target.value = ''
      return
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const supabase = createClient()

    const filePath = `${tenantId}/${tipo}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('documentos')
      .upload(filePath, file)

    if (error) {
      toast.error('Erro ao enviar arquivo. Tente novamente.')
      setUploading(false)
      return
    }

    const uploaded: UploadedFile = {
      nome_arquivo: file.name,
      storage_path: filePath,
      tamanho_bytes: file.size,
      tipo,
    }

    setFiles(prev => [...prev, uploaded])
    onUpload(uploaded)
    setUploading(false)
    toast.success('Arquivo enviado com sucesso')
  }, [tenantId, tipo, onUpload])

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground/60">
              PDF, DOC, DOCX, JPG ou PNG (máx. {MAX_FILE_SIZE_MB}MB)
            </p>
            <label>
              <input
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Selecionar arquivo
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{f.nome_arquivo}</span>
              <span className="text-xs text-muted-foreground">
                {(f.tamanho_bytes / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
