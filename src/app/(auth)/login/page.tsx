'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, Shield, BarChart3, ClipboardList, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'

const TEST_USERS = [
  { email: 'admin@elocultura.teste', password: 'Teste@2026', role: 'Admin', nome: 'Maria Admin', icon: Shield, color: '#e32a74' },
  { email: 'gestor@elocultura.teste', password: 'Teste@2026', role: 'Gestor', nome: 'João Gestor', icon: BarChart3, color: '#eeb513' },
  { email: 'avaliador@elocultura.teste', password: 'Teste@2026', role: 'Avaliador', nome: 'Ana Avaliadora', icon: ClipboardList, color: '#0047AB' },
  { email: 'proponente@elocultura.teste', password: 'Teste@2026', role: 'Proponente', nome: 'Carlos Proponente', icon: FolderOpen, color: '#77a80b' },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Credenciais inválidas ou acesso não autorizado.')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
      {/* Subtle background accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#0047AB]/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-[#e32a74]/[0.03] rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-8 md:p-10">

            {/* Branding */}
            <div className="flex flex-col items-center mb-8">
              <img
                src="/icon-192.png"
                alt="Elo Cultura"
                className="h-16 w-16 mb-4 rounded-2xl bg-white p-2 object-contain shadow-md ring-1 ring-slate-100 transition-all duration-300 hover:scale-105"
              />
              <h1 className="text-2xl font-[Sora,sans-serif] font-extrabold tracking-tight text-slate-900 leading-none mb-1.5">
                Elo<span className="text-[var(--brand-primary)]">Cultural</span>
              </h1>
              <p className="text-xs font-medium text-slate-400">
                Acesse sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-rose-50 border border-rose-200/60 p-3.5 text-xs font-semibold text-rose-600 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600 ml-0.5">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-11 pl-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-0.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-600">Senha</Label>
                  <Link href="/esqueci-senha" className="text-[11px] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 pl-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[#005cdd] text-white font-bold text-sm shadow-lg shadow-[var(--brand-primary)]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Entrar'
                )}
              </Button>

              <p className="text-center text-xs text-slate-400 font-medium pt-1">
                Não possui conta?{' '}
                <Link href="/cadastro" className="text-[var(--brand-primary)] hover:underline font-semibold">
                  Criar conta
                </Link>
              </p>
            </form>

            {/* Quick Access — Test Users */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] text-center mb-3">
                  Acesso Rápido — Teste
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_USERS.map((user) => {
                    const Icon = user.icon
                    return (
                      <button
                        key={user.role}
                        type="button"
                        onClick={() => {
                          setEmail(user.email)
                          setPassword(user.password)
                        }}
                        className="group flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/80 transition-all text-left"
                      >
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${user.color}12` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: user.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-600 leading-none mb-0.5">{user.role}</p>
                          <p className="text-[9px] text-slate-400 font-medium truncate">{user.nome}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand accent line */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-1 w-6 rounded-full bg-[#0047AB] opacity-40" />
          <div className="h-1 w-6 rounded-full bg-[#e32a74] opacity-40" />
          <div className="h-1 w-6 rounded-full bg-[#eeb513] opacity-40" />
          <div className="h-1 w-6 rounded-full bg-[#77a80b] opacity-40" />
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
