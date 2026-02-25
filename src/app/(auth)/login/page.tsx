'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Fingerprint, Lock, Shield, BarChart3, ClipboardList, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'

const TEST_USERS = [
  { email: 'admin@elocultura.teste', password: 'Teste@2026', role: 'Admin', nome: 'Maria Admin', icon: Shield, color: '#ef4444' },
  { email: 'gestor@elocultura.teste', password: 'Teste@2026', role: 'Gestor', nome: 'João Gestor', icon: BarChart3, color: '#f59e0b' },
  { email: 'avaliador@elocultura.teste', password: 'Teste@2026', role: 'Avaliador', nome: 'Ana Avaliadora', icon: ClipboardList, color: '#0047AB' },
  { email: 'proponente@elocultura.teste', password: 'Teste@2026', role: 'Proponente', nome: 'Carlos Proponente', icon: FolderOpen, color: '#43A047' },
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
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#1a1c20] overflow-hidden selection:bg-[#0047AB]/30">
      {/* Background Depth Effects (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E91E63] rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0047AB] rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />

      {/* Luxury Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/[0.03] backdrop-blur-[32px] rounded-[40px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-10 md:p-12">

            {/* Branding Section */}
            <div className="flex flex-col items-center mb-10">
              <img
                src="/icon-192.png"
                alt="Elo Cultura"
                className="h-20 w-20 mb-5 rounded-full bg-white/10 p-2.5 ring-1 ring-white/10 shadow-[0_8px_32px_rgba(0,71,171,0.3)] transition-all duration-500 hover:scale-105 active:scale-95"
              />
              <h1 className="text-3xl font-[900] tracking-tighter text-white leading-none mb-2">
                Elo<span className="text-[#0047AB]">Cultura</span>
              </h1>
              <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 text-center">
                Portal de Acesso Restrito
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">E-mail ou CPF</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@acesso.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-12 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white font-medium placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 focus:border-[#0047AB]/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black text-white/40 uppercase tracking-widest">Senha de Acesso</Label>
                  <Link href="/esqueci-senha" className="text-[9px] font-black text-[#0047AB] uppercase tracking-widest hover:text-white transition-colors">
                    Recuperar
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-12 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white font-medium placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 focus:border-[#0047AB]/50 transition-all outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Entrar na Plataforma'
                )}
              </Button>

              <div className="pt-4 text-center">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  Não possui conta? {' '}
                  <Link href="/cadastro" className="text-white hover:text-[#0047AB] underline underline-offset-4 transition-colors">
                    Solicitar Registro
                  </Link>
                </p>
              </div>
            </form>

            {/* Quick Access — Test Users */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mb-4">
                  Acesso Rápido — Ambiente de Teste
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
                        className="group flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.05] transition-all text-left"
                      >
                        <div
                          className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${user.color}15` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: user.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-white/70 uppercase tracking-wider leading-none mb-0.5">{user.role}</p>
                          <p className="text-[9px] text-white/25 font-medium truncate">{user.nome}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">
          Ambiente Seguro • Encriptação de Ponta a Ponta
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#0047AB] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
