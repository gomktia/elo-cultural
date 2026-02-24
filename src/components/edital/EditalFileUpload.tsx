'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FileText, X, Loader2 } from 'lucide-react'

interface UploadedFile {
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  tipo: string
}

interface EditalFileUploadProps {
  tenantId: string
  editalId?: string
  label: string
  tipo: 'edital_pdf' | 'anexo'
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  multiple?: boolean
}

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.odt,.ods'

export function EditalFileUpload({ tenantId, editalId, label, tipo, files, onFilesChange, multiple = true }: EditalFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const newFiles: UploadedFile[] = []

    for (const file of Array.from(selectedFiles)) {
      const timestamp = Date.now()
      const path = `${tenantId}/editais/${editalId || 'temp'}/${tipo}/${timestamp}-${file.name}`

      const { error } = await supabase.storage
        .from('documentos')
        .upload(path, file)

      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`)
        continue
      }

      newFiles.push({
        nome_arquivo: file.name,
        storage_path: path,
        tamanho_bytes: file.size,
        tipo,
      })
    }

    onFilesChange([...files, ...newFiles])
    setUploading(false)

    if (inputRef.current) inputRef.current.value = ''
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} arquivo(s) enviado(s)`)
    }
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index)
    onFilesChange(updated)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>

      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[var(--brand-primary)]/40 hover:bg-brand-primary/5 transition-all"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">Clique para selecionar arquivos</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">PDF, DOC, DOCX, XLS, XLSX</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple={multiple}
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{file.nome_arquivo}</p>
                <p className="text-[9px] text-slate-400 font-bold">{formatSize(file.tamanho_bytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="h-6 w-6 rounded-lg bg-slate-200/50 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
