'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/schemas/auth'
import { translateAuthError } from '@/lib/utils/translate-auth-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTenant } from '@/components/TenantProvider'
import { GovBrButton } from '@/components/auth/GovBrButton'
import { MicoMascot, useMicoState } from '@/components/auth/MicoMascot'

function isCpfOrCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 11 && /^[\d.\-/]+$/.test(value.trim())
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { name: tenantName, logoUrl: tenantLogoUrl } = useTenant()
  const logoSrc = tenantLogoUrl || '/icon-192.png'
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const mico = useMicoState()

  // Gov.br and other redirect error/message handling
  const govbrErrors: Record<string, string> = {
    govbr_unavailable: 'Login Gov.br não está disponível no momento.',
    govbr_token_failed: 'Erro na autenticação com Gov.br. Tente novamente.',
    govbr_userinfo_failed: 'Não foi possível obter seus dados do Gov.br.',
    govbr_no_cpf: 'CPF não encontrado nos dados do Gov.br.',
    govbr_signup_failed: 'Erro ao criar conta via Gov.br. Tente novamente.',
    govbr_session_failed: 'Erro ao iniciar sessão via Gov.br. Tente novamente.',
    govbr_error: 'Erro inesperado ao conectar com Gov.br.',
  }
  const urlError = searchParams.get('error')
  const urlMsg = searchParams.get('msg')
  const initialError = urlError ? (govbrErrors[urlError] || '') : ''
  const initialMsg = urlMsg === 'govbr_em_breve' ? 'Integração Gov.br em breve. Use e-mail e senha por enquanto.' : ''
  const [error, setError] = useState(initialError)

  const isCpf = isCpfOrCnpj(identifier)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validation = loginSchema.safeParse({ identifier, password })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

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
          setError(data.error || 'CPF/CNPJ não encontrado no sistema.')
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
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({ email: emailToLogin, password })

    if (loginError) {
      setError(translateAuthError(loginError.message))
      setLoading(false)
      return
    }

    // Validate staff role vs domain tenant
    if (authData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', authData.user.id)
        .single()

      const cookieTenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenant_id='))
        ?.split('=')[1] || null

      const role = profile?.role || 'proponente'
      const isStaff = ['admin', 'gestor', 'avaliador'].includes(role)
      const isRootDomain = !cookieTenantId
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      if (isStaff) {
        if (isRootDomain && !isDev) {
          await supabase.auth.signOut()
          setError('Acesse pelo domínio do seu município para fazer login.')
          setLoading(false)
          return
        }
        // In dev without tenant, auto-assign tenant from profile
        if (isRootDomain && isDev && profile?.tenant_id) {
          const { data: userTenant } = await supabase
            .from('tenants')
            .select('id, dominio')
            .eq('id', profile.tenant_id)
            .single()
          if (userTenant) {
            document.cookie = `tenant_id=${userTenant.id}; path=/; SameSite=Lax`
            document.cookie = `tenant_slug=${userTenant.dominio}; path=/; SameSite=Lax`
          }
        }
        if (profile?.tenant_id && cookieTenantId && profile.tenant_id !== cookieTenantId) {
          const { data: correctTenant } = await supabase
            .from('tenants')
            .select('nome, dominio')
            .eq('id', profile.tenant_id)
            .single()
          await supabase.auth.signOut()
          const tenantUrl = correctTenant?.dominio
            ? `${correctTenant.dominio}.eloculturas.com.br`
            : 'o domínio correto'
          setError(`Sua conta pertence a ${correctTenant?.nome || 'outro município'}. Acesse em ${tenantUrl}.`)
          setLoading(false)
          return
        }
      }
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

            {/* Mico Mascot + Branding */}
            <div className="flex flex-col items-center mb-6">
              <MicoMascot state={mico.micoState} lookProgress={mico.lookProgress} />
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={logoSrc}
                  alt={tenantName || 'Elo Cultural'}
                  className="h-8 w-8 rounded-xl bg-white p-1 object-contain shadow-sm ring-1 ring-slate-100"
                />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                  {tenantName || (<>Elo<span className="text-[var(--brand-primary)]">Cultural</span></>)}
                </h1>
              </div>
              <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400 mt-1.5">
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

              {initialMsg && !error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-blue-50 border border-blue-200/60 p-4 text-xs font-bold text-blue-600 text-center"
                >
                  {initialMsg}
                </motion.div>
              )}

              <div className="space-y-2 group">
                <Label htmlFor="identifier" className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">
                  {isCpf ? 'CPF / CNPJ' : 'E-mail ou CPF'}
                </Label>
                <div className="relative">
                  {isCpf ? (
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                  ) : (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    inputMode={isCpf ? 'numeric' : 'email'}
                    placeholder="seu@email.com ou 000.000.000-00"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value)
                      mico.onEmailChange(e.target.value)
                    }}
                    onFocus={mico.onEmailFocus}
                    onBlur={mico.onEmailBlur}
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
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                  <Input
                    id="password"
                    type={mico.showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={mico.onPasswordFocus}
                    onBlur={mico.onPasswordBlur}
                    required
                    className="h-11 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={mico.toggleShowPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    tabIndex={-1}
                    aria-label={mico.showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mico.showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-[var(--brand-primary)] hover:brightness-110 text-white font-semibold uppercase text-xs tracking-wider shadow-xl shadow-[var(--brand-primary)]/20 transition-all active:scale-[0.98] disabled:opacity-50"
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

            <GovBrButton />

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
