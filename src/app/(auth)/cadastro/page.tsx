'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProponenteForm } from '@/components/cadastro/ProponenteForm'
import { AvaliadorForm } from '@/components/cadastro/AvaliadorForm'
import { GestorForm } from '@/components/cadastro/GestorForm'
import { Loader2, User, Mail, Lock, Phone, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type PerfilTipo = 'proponente' | 'avaliador' | 'gestor'

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [perfilTipo, setPerfilTipo] = useState<PerfilTipo>('proponente')

  // Step 1: Personal data
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [lgpdConsent, setLgpdConsent] = useState(false)

  // Step 2: Role-specific data
  const [proponenteData, setProponenteData] = useState({
    areas_atuacao: [] as string[],
    tempo_atuacao: '',
    renda: '',
    genero: '',
    orientacao_sexual: '',
    raca_etnia: '',
    pcd: false,
    endereco_completo: '',
    municipio: '',
    estado: '',
  })
  const [avaliadorData, setAvaliadorData] = useState({
    curriculo_descricao: '',
    areas_avaliacao: [] as string[],
    lattes_url: '',
  })
  const [gestorData, setGestorData] = useState({
    orgao_vinculado: '',
    funcao_cargo: '',
    matricula: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!lgpdConsent) {
      setError('Voce deve aceitar os termos de uso e politica de privacidade.')
      return
    }
    setError('')
    setStep(2)
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 1. Create account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cpf_cnpj: cpfCnpj,
          telefone,
          consentimento_lgpd: true,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Update profile with role-specific data
    if (signUpData.user) {
      const extraData: Record<string, any> = {}

      if (perfilTipo === 'proponente') {
        Object.assign(extraData, {
          areas_atuacao: proponenteData.areas_atuacao.length > 0 ? proponenteData.areas_atuacao : null,
          tempo_atuacao: proponenteData.tempo_atuacao || null,
          renda: proponenteData.renda || null,
          genero: proponenteData.genero || null,
          orientacao_sexual: proponenteData.orientacao_sexual || null,
          raca_etnia: proponenteData.raca_etnia || null,
          pcd: proponenteData.pcd,
          endereco_completo: proponenteData.endereco_completo || null,
          municipio: proponenteData.municipio || null,
          estado: proponenteData.estado || null,
        })
      } else if (perfilTipo === 'avaliador') {
        Object.assign(extraData, {
          curriculo_descricao: avaliadorData.curriculo_descricao || null,
          areas_avaliacao: avaliadorData.areas_avaliacao.length > 0 ? avaliadorData.areas_avaliacao : null,
          lattes_url: avaliadorData.lattes_url || null,
        })
      } else if (perfilTipo === 'gestor') {
        Object.assign(extraData, {
          orgao_vinculado: gestorData.orgao_vinculado || null,
          funcao_cargo: gestorData.funcao_cargo || null,
          matricula: gestorData.matricula || null,
        })
      }

      if (Object.keys(extraData).length > 0) {
        await supabase
          .from('profiles')
          .update(extraData)
          .eq('id', signUpData.user.id)
      }
    }

    router.push('/login?msg=cadastro-sucesso')
  }

  function updateProponente(field: string, value: any) {
    setProponenteData(prev => ({ ...prev, [field]: value }))
  }
  function updateAvaliador(field: string, value: any) {
    setAvaliadorData(prev => ({ ...prev, [field]: value }))
  }
  function updateGestor(field: string, value: any) {
    setGestorData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#1a1c20] overflow-hidden selection:bg-[#0047AB]/30">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF1493] rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-white/[0.03] backdrop-blur-[32px] rounded-[40px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-8 md:p-12">

            <div className="flex flex-col items-center mb-8">
              <h1 className="text-3xl font-[900] tracking-tighter text-white leading-none mb-2">
                Criar <span className="text-[#0047AB]">Conta</span>
              </h1>
              <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/30 text-center">
                {step === 1 ? 'Dados Pessoais' : 'Dados do Perfil'}
              </p>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-[#0047AB]' : 'bg-white/10'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-[#0047AB]' : 'bg-white/10'}`} />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400 text-center mb-5">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleStep1}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 group">
                      <Label htmlFor="nome" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="nome" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="email" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="password" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="password" type="password" placeholder="Min. 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required
                          className="h-11 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="cpf" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">CPF ou CNPJ</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="cpf" placeholder="000.000.000-00" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2 group md:col-span-2">
                      <Label htmlFor="telefone" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Telefone / WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#0047AB] transition-colors" />
                        <Input id="telefone" placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} required
                          className="h-11 pl-12 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5 mt-4">
                    <input type="checkbox" id="lgpd" checked={lgpdConsent} onChange={e => setLgpdConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-[#0047AB] focus:ring-offset-0 focus:ring-[#0047AB]" />
                    <Label htmlFor="lgpd" className="text-[10px] text-white/40 font-bold leading-relaxed uppercase tracking-wider cursor-pointer">
                      Li e aceito os <span className="text-white underline">Termos de Uso</span> e a <span className="text-white underline">Politica de Privacidade</span> (LGPD).
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98] mt-4">
                    <ArrowRight className="mr-2 h-4 w-4" /> Proximo: Dados do Perfil
                  </Button>

                  <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest pt-2">
                    Ja possui acesso? {' '}
                    <Link href="/login" className="text-white hover:text-[#0047AB] underline transition-colors">Entrar</Link>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleFinalSubmit}
                  className="space-y-5"
                >
                  {/* Profile type selector */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tipo de Perfil</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'proponente' as const, label: 'Proponente' },
                        { key: 'avaliador' as const, label: 'Avaliador' },
                        { key: 'gestor' as const, label: 'Gestor' },
                      ]).map(tipo => (
                        <button
                          key={tipo.key}
                          type="button"
                          onClick={() => setPerfilTipo(tipo.key)}
                          className={[
                            'py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                            perfilTipo === tipo.key
                              ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-lg shadow-[#0047AB]/20'
                              : 'bg-white/[0.02] text-white/40 border-white/10 hover:border-white/20'
                          ].join(' ')}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Role-specific form */}
                  <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                    {perfilTipo === 'proponente' && (
                      <ProponenteForm form={proponenteData} onChange={updateProponente} />
                    )}
                    {perfilTipo === 'avaliador' && (
                      <AvaliadorForm form={avaliadorData} onChange={updateAvaliador} />
                    )}
                    {perfilTipo === 'gestor' && (
                      <GestorForm form={gestorData} onChange={updateGestor} />
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="h-12 px-6 rounded-2xl border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase text-xs tracking-[0.2em] transition-all"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button type="submit" className="flex-1 h-12 rounded-2xl bg-[#0047AB] hover:bg-[#005cdd] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#0047AB]/20 transition-all active:scale-[0.98]" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Finalizar Cadastro'}
                    </Button>
                  </div>

                  <p className="text-center text-[10px] font-bold text-white/15 uppercase tracking-widest pt-1">
                    Esses dados podem ser atualizados depois no seu perfil.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
