import { Shield, Lock, Eye, FileText, Trash2, Download, Mail } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | Elo Cultural',
  description: 'Política de Privacidade e proteção de dados pessoais da plataforma Elo Cultural, em conformidade com a LGPD.',
}

const sections = [
  {
    icon: Eye,
    title: '1. Dados Coletados',
    content: `A plataforma Elo Cultural coleta os seguintes dados pessoais para viabilizar a participação em editais culturais:

• Dados de identificação: nome completo, CPF/CNPJ, e-mail, telefone
• Dados demográficos (opcional): gênero, orientação sexual, raça/etnia, pessoa com deficiência, renda
• Dados profissionais: áreas de atuação, tempo de experiência, currículo, link Lattes
• Dados de projetos: título, resumo, descrição técnica, orçamento, cronograma, documentos anexados
• Dados técnicos: endereço IP no momento de submissão, registros de acesso (logs de auditoria)

Todos os dados demográficos são de preenchimento voluntário e utilizados exclusivamente para fins estatísticos e de políticas de ação afirmativa, conforme legislação vigente.`,
  },
  {
    icon: FileText,
    title: '2. Finalidade do Tratamento',
    content: `Os dados pessoais são tratados para as seguintes finalidades:

• Cadastro e autenticação de usuários na plataforma
• Inscrição e gestão de projetos em editais de fomento cultural
• Análise de habilitação documental e avaliação técnica de propostas
• Geração de rankings e resultados de seleção pública
• Comunicação oficial sobre andamento de editais e projetos
• Prestação de contas e transparência pública
• Produção de indicadores culturais e relatórios estatísticos agregados
• Cumprimento de obrigações legais e regulatórias`,
  },
  {
    icon: Lock,
    title: '3. Base Legal (LGPD)',
    content: `O tratamento dos dados pessoais pela plataforma Elo Cultural está fundamentado nas seguintes bases legais da Lei Geral de Proteção de Dados (Lei nº 13.709/2018):

• Art. 7º, I — Consentimento do titular: para dados demográficos opcionais
• Art. 7º, II — Cumprimento de obrigação legal: para registros de auditoria e prestação de contas
• Art. 7º, III — Execução de políticas públicas: para gestão de editais culturais pela administração pública
• Art. 7º, V — Execução de contrato: para viabilizar a participação do proponente no processo seletivo
• Art. 11, II, "b" — Tratamento de dados sensíveis para execução de políticas públicas de ação afirmativa`,
  },
  {
    icon: Shield,
    title: '4. Compartilhamento de Dados',
    content: `Os dados pessoais poderão ser compartilhados nas seguintes situações:

• Com avaliadores designados: apenas dados do projeto (sem dados pessoais do proponente) para garantir imparcialidade na avaliação
• Com a administração pública contratante: para fins de prestação de contas e transparência
• Publicação de resultados: nome do proponente e título do projeto, conforme exigência legal de publicidade dos atos administrativos
• Órgãos de controle: quando solicitado por determinação legal ou judicial

Os dados NÃO são compartilhados com terceiros para fins comerciais, publicitários ou de marketing.`,
  },
  {
    icon: Download,
    title: '5. Direitos do Titular',
    content: `Em conformidade com o Art. 18 da LGPD, você possui os seguintes direitos:

• Confirmação da existência de tratamento dos seus dados
• Acesso aos dados pessoais armazenados
• Correção de dados incompletos, inexatos ou desatualizados
• Anonimização, bloqueio ou eliminação de dados desnecessários
• Portabilidade dos dados (exportação em formato JSON)
• Eliminação dos dados pessoais tratados com consentimento
• Informação sobre compartilhamento de dados
• Revogação do consentimento a qualquer momento

Para exercer esses direitos, acesse a seção "LGPD" no seu perfil ou entre em contato pelo e-mail indicado abaixo.`,
  },
  {
    icon: Trash2,
    title: '6. Retenção e Exclusão',
    content: `Os dados pessoais são retidos pelos seguintes períodos:

• Dados de cadastro: enquanto a conta estiver ativa
• Dados de projetos e editais: pelo período exigido pela legislação de prestação de contas públicas (mínimo 5 anos)
• Logs de auditoria: 5 anos, conforme obrigação legal
• Dados demográficos: enquanto houver consentimento ativo

Após solicitação de exclusão, os dados serão eliminados no prazo de até 15 dias úteis, exceto aqueles cuja retenção seja obrigatória por lei. Os registros de auditoria são mantidos de forma anonimizada.`,
  },
  {
    icon: Lock,
    title: '7. Segurança dos Dados',
    content: `A plataforma adota as seguintes medidas de segurança:

• Criptografia em trânsito (HTTPS/TLS) para todas as comunicações
• Autenticação segura com hash de senhas (bcrypt)
• Isolamento de dados por tenant (Row Level Security no banco de dados)
• Controle de acesso baseado em papéis (RBAC)
• Registros imutáveis de auditoria para rastreabilidade
• Backups regulares com criptografia
• Hospedagem em infraestrutura com certificações de segurança (SOC 2)`,
  },
  {
    icon: Mail,
    title: '8. Contato e Encarregado (DPO)',
    content: `Para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais, entre em contato:

• E-mail: privacidade@elocultura.com.br
• Encarregado de Proteção de Dados (DPO): definido pela administração pública contratante

Você também pode registrar uma reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD) pelo site: https://www.gov.br/anpd`,
  },
]

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0047AB] to-[#003080] text-white">
        <div className="container mx-auto px-4 md:px-8 py-14 md:py-20 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-sm md:text-base text-white/70 max-w-2xl">
            Em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018),
            esta política descreve como seus dados são coletados, utilizados e protegidos na plataforma Elo Cultural.
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
