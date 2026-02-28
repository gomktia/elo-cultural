import { ScrollText, UserCheck, AlertTriangle, Scale, ShieldCheck, Gavel, FileText, Ban } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso | Elo Cultural',
  description: 'Termos e condições de uso da plataforma Elo Cultural para gestão de editais culturais.',
}

const sections = [
  {
    icon: ScrollText,
    title: '1. Objeto',
    content: `A plataforma Elo Cultural é um sistema de gestão de processos seletivos culturais desenvolvido para a administração pública. Estes Termos de Uso regulam o acesso e a utilização da plataforma por todos os usuários, incluindo proponentes, avaliadores, gestores e administradores.

Ao se cadastrar e utilizar a plataforma, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso e com a Política de Privacidade.`,
  },
  {
    icon: UserCheck,
    title: '2. Cadastro e Acesso',
    content: `Para utilizar a plataforma, o usuário deve:

• Fornecer dados pessoais verdadeiros, completos e atualizados no momento do cadastro
• Manter suas credenciais de acesso (e-mail e senha) em sigilo e segurança
• Não compartilhar sua conta com terceiros
• Informar imediatamente qualquer uso não autorizado de sua conta

O usuário é responsável por todas as atividades realizadas em sua conta. A plataforma se reserva o direito de suspender ou cancelar contas que violem estes termos ou apresentem comportamento fraudulento.`,
  },
  {
    icon: FileText,
    title: '3. Submissão de Projetos',
    content: `Ao submeter um projeto cultural através da plataforma, o proponente declara que:

• Todas as informações prestadas são verdadeiras e podem ser comprovadas
• Os documentos anexados são autênticos e estão em conformidade com as exigências do edital
• O projeto é de sua autoria ou possui autorização dos demais envolvidos
• Está ciente de que a falsidade das informações pode resultar em desclassificação, devolução de recursos e responsabilização civil e criminal

A plataforma registra o IP de submissão e mantém logs de auditoria imutáveis para garantir a integridade do processo seletivo.`,
  },
  {
    icon: Scale,
    title: '4. Processo de Avaliação',
    content: `O processo de avaliação dos projetos segue as seguintes etapas:

• Habilitação documental: verificação da conformidade dos documentos exigidos
• Avaliação técnica: análise do mérito do projeto conforme critérios definidos no edital
• Publicação de resultados preliminares: com prazo para interposição de recursos
• Resultado definitivo: após análise dos recursos interpostos
• Homologação: validação final pela autoridade competente

Os avaliadores são designados pela administração e devem observar imparcialidade, confidencialidade e os critérios estabelecidos no edital. A plataforma pode utilizar inteligência artificial como ferramenta auxiliar de triagem, sendo a decisão final sempre humana.`,
  },
  {
    icon: Gavel,
    title: '5. Recursos e Contestações',
    content: `O proponente tem direito a interpor recurso nas fases previstas pelo edital:

• O recurso deve ser fundamentado e apresentado dentro do prazo estipulado
• A análise do recurso será realizada por autoridade competente, diferente do avaliador original quando possível
• O resultado do recurso será comunicado através da plataforma
• A decisão sobre o recurso é definitiva na esfera administrativa

Todos os recursos e suas decisões ficam registrados na plataforma para fins de transparência e auditoria.`,
  },
  {
    icon: Ban,
    title: '6. Condutas Proibidas',
    content: `É expressamente proibido ao usuário:

• Submeter informações falsas ou fraudulentas
• Utilizar a plataforma para fins diferentes dos previstos nestes termos
• Tentar acessar dados de outros usuários ou do sistema sem autorização
• Submeter projetos idênticos ou substancialmente similares em múltiplas inscrições do mesmo edital
• Interferir no funcionamento da plataforma por meios técnicos (ataques, scripts, etc.)
• Assediar, ameaçar ou intimidar outros usuários, avaliadores ou gestores

A violação dessas regras pode resultar em suspensão da conta, desclassificação do projeto e comunicação às autoridades competentes.`,
  },
  {
    icon: ShieldCheck,
    title: '7. Propriedade Intelectual',
    content: `A plataforma Elo Cultural, incluindo seu código, design, marca e funcionalidades, é protegida por direitos de propriedade intelectual.

O conteúdo dos projetos submetidos permanece de propriedade de seus respectivos autores. Ao submeter um projeto, o proponente concede à administração pública o direito de utilizar as informações para fins do processo seletivo e de prestação de contas.

Os resultados, atas e publicações oficiais geradas pela plataforma são documentos públicos, sujeitos ao princípio da publicidade administrativa.`,
  },
  {
    icon: AlertTriangle,
    title: '8. Limitação de Responsabilidade',
    content: `A plataforma se compromete a manter o sistema disponível e funcionando adequadamente. No entanto:

• Não se responsabiliza por interrupções decorrentes de manutenção programada ou eventos de força maior
• Não garante que o sistema estará livre de erros ou vulnerabilidades em todos os momentos
• A responsabilidade pela veracidade dos dados cadastrais e dos projetos é exclusiva do usuário
• Decisões sobre habilitação, avaliação e seleção são de responsabilidade da administração pública contratante

Em caso de indisponibilidade do sistema durante períodos críticos (como prazo de inscrição), a administração poderá prorrogar os prazos conforme necessário.`,
  },
  {
    icon: ScrollText,
    title: '9. Disposições Gerais',
    content: `• Estes termos podem ser atualizados a qualquer momento, com comunicação prévia aos usuários cadastrados
• A legislação aplicável é a brasileira, em especial a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e a legislação sobre licitações e processos seletivos públicos
• Eventuais controvérsias serão resolvidas pelo foro da comarca do município contratante
• Caso alguma disposição destes termos seja considerada inválida, as demais permanecerão em pleno vigor

Ao utilizar a plataforma, o usuário concorda com todos os termos aqui descritos.`,
  },
]

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0047AB] to-[#003080] text-white">
        <div className="container mx-auto px-4 md:px-8 py-14 md:py-20 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10">
              <ScrollText className="h-7 w-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Termos de Uso
            </h1>
          </div>
          <p className="text-sm md:text-base text-white/70 max-w-2xl">
            Condições gerais de uso da plataforma Elo Cultural para gestão
            de processos seletivos culturais da administração pública.
          </p>
          <p className="text-xs text-white/40 mt-4">
            Última atualização: 28 de fevereiro de 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 max-w-4xl">
        <div className="space-y-8">
          {sections.map((section, i) => (
            <section
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-[#0047AB]/5 text-[#0047AB] flex-shrink-0">
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight pt-1">
                  {section.title}
                </h2>
              </div>
              <div className="pl-[52px]">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
