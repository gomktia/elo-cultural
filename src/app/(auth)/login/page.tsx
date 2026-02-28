'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import { motion } from 'framer-motion'

function isCpfOrCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 11 && /^[\d.\-/]+$/.test(value.trim())
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isCpf = isCpfOrCnpj(identifier)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let emailToLogin = identifier.trim()

    // Se parece CPF/CNPJ, buscar o email correspondente
    if (isCpfOrCnpj(emailToLogin)) {
      try {
        const res = await fetch('/api/auth/cpf-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: emailToLogin }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'CPF/CNPJ nao encontrado no sistema.')
          setLoading(false)
          return
        }
        emailToLogin = data.email
      } catch {
        setError('Erro ao buscar CPF. Tente novamente.')
        setLoading(false)
        return
      }
    }

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailToLogin, password })

    if (loginError) {
      setError('Credenciais invalidas ou acesso nao autorizado.')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-8 md:p-12">

            {/* Branding */}
            <div className="flex flex-col items-center mb-8">
              <img
                src="/icon-192.png"
                alt="Elo Cultura"
                className="h-14 w-14 mb-4 rounded-2xl bg-white p-2 object-contain shadow-md ring-1 ring-slate-100"
              />
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-2">
                Elo<span className="text-[var(--brand-primary)]">Cultural</span>
              </h1>
              <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
                Acesse sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-rose-50 border border-rose-200/60 p-4 text-xs font-bold text-rose-600 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2 group">
                <Label htmlFor="identifier" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">
                  {isCpf ? 'CPF / CNPJ' : 'E-mail ou CPF'}
                </Label>
                <div className="relative">
                  {isCpf ? (
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                  ) : (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    inputMode={isCpf ? 'numeric' : 'email'}
                    placeholder="seu@email.com ou 000.000.000-00"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Senha</Label>
                  <Link href="/esqueci-senha" className="text-[11px] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Entrar'
                )}
              </Button>

              <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wide pt-2">
                Não possui conta?{' '}
                <Link href="/cadastro" className="text-[var(--brand-primary)] hover:underline transition-colors">
                  Criar conta
                </Link>
              </p>
            </form>

          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
