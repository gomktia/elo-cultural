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
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#1a1c20] overflow-hidden selection:bg-[#0047AB]/30">
      {/* Background Depth Effects (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF1493] rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/[0.03] backdrop-blur-[32px] rounded-[40px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-10 md:p-12 text-center">

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight leading-none mb-3">Link Enviado</h2>
                  <p className="text-sm text-white/40 font-medium leading-relaxed">
                    Enviamos as instruções de recuperação para o e-mail: <br />
                    <span className="text-white font-bold">{email}</span>
                  </p>
                </div>
                <Link href="/login" className="block pt-4">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 bg-white/5 text-white font-semibold uppercase text-xs tracking-wide hover:bg-white/10 transition-all active:scale-95">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-10">
                  <div className="h-16 w-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <Mail className="h-8 w-8 text-[#0047AB]" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-white leading-none mb-2">
                    Recuperar <span className="text-[#0047AB]">Senha</span>
                  </h1>
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-white/30">
                    Portal de Autoatendimento
                  </p>
                </div>

                <form onSubmit={handleReset} className="space-y-6 text-left">
                  {error && (
                    <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">E-mail de Cadastro</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@acesso.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-12 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white font-medium placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Enviar Link de Recuperação'}
                  </Button>

                  <div className="text-center pt-2">
                    <Link href="/login" className="text-[11px] font-medium text-white/20 uppercase tracking-wider hover:text-white transition-colors flex items-center justify-center gap-2">
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
