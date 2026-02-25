'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-10 md:p-12 text-center">

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none mb-3">Link Enviado</h2>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Enviamos as instruções de recuperação para o e-mail: <br />
                    <span className="text-slate-900 font-bold">{email}</span>
                  </p>
                </div>
                <Link href="/login" className="block pt-4">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wide hover:bg-slate-100 transition-all active:scale-95">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-10">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
                    <Mail className="h-8 w-8 text-[#0047AB]" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-2">
                    Recuperar <span className="text-[var(--brand-primary)]">Senha</span>
                  </h1>
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
                    Portal de Autoatendimento
                  </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6 text-left">
                  {error && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200/60 p-4 text-xs font-bold text-rose-600 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">E-mail de Cadastro</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@acesso.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enviar Link de Recuperação'}
                  </Button>

                  <div className="text-center pt-2">
                    <Link href="/login" className="text-[11px] font-medium text-slate-400 uppercase tracking-wider hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
                      <ArrowLeft className="h-3 w-3" />
                      Lembrei minha senha
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
