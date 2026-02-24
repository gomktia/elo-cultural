import React from 'react';
import { EditalTimeline, type FaseEdital } from '@/components/edital/EditalTimeline';
import { ReciboButton } from '@/components/edital/ReciboButton';
import { BadgeCheck, ShieldAlert, FileSignature } from 'lucide-react';

// Dados simulados para o preview
const mockEdital = {
    titulo: "Edital Lei Paulo Gustavo - Audiovisual 2026",
    numero: "001/2026",
    orgao: "Prefeitura Municipal de Exemplo",
    status: "inscricao" as FaseEdital,
    prazos: {
        inicio_inscricao: "2026-02-10T08:00:00Z",
        fim_inscricao: "2026-03-10T23:59:59Z", // Note that the user will be blocked after this date!
        inicio_recurso: "2026-03-20T08:00:00Z",
        fim_recurso: "2026-03-25T23:59:59Z",
    },
    tenantColor: "#1A56DB" // Azul padrão GOV.BR
};

export default function HomePreview() {
    return (
        <div className="min-h-screen bg-gray-50 font-[Inter] pb-24">
            {/* Header Institucional */}
            <header className="w-full bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: mockEdital.tenantColor }}>
                            GOV
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight">ELO Cultura</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">{mockEdital.orgao}</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                        <a href="#" className="hover:text-gray-900 transition-colors">Início</a>
                        <a href="#" className="text-[#1A56DB] pb-1 border-b-2 border-[#1A56DB]">Editais Abertos</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Resultados</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Entrar</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section do Edital */}
            <main className="max-w-6xl mx-auto px-6 mt-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Coluna Principal */}
                    <div className="flex-1 w-full space-y-8">

                        {/* Titulo e Informativo */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                                    Inscrições Abertas
                                </span>
                                <span className="text-sm font-medium text-gray-500">Nº {mockEdital.numero}</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4 font-[Outfit]">
                                {mockEdital.titulo}
                            </h2>

                            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                                Apoio financeiro a projetos culturais que visam fomentar e fortalecer o setor audiovisual do município através de repasse direto via Lei Paulo Gustavo.
                            </p>
                        </div>

                        {/* O Novo Componente Inteligente da Linha do Tempo */}
                        <div className="mt-8">
                            <EditalTimeline
                                faseAtual={mockEdital.status}
                                prazos={mockEdital.prazos}
                                corTenant={mockEdital.tenantColor}
                            />

                            {/* DEMO: Botão de Recibo do Protocolo */}
                            <div className="mt-6">
                                <ReciboButton protocolo="2026.0001.X" corTenant={mockEdital.tenantColor} />
                            </div>
                        </div>

                        {/* Box de Segurança / LGPD demonstrativo */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
                            <ShieldAlert className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-900 mb-1">Processo 100% Auditável e Digital</h4>
                                <p className="text-sm text-blue-800/80 leading-relaxed">
                                    Este processo seletivo é regido pela LGPD e possui trilha de auditoria completa em todas as 15 fases. Todos os documentos enviados e pontuações atribuídas pelos avaliadores são criptografados no servidor.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar (Valores ou Downloads) */}
                    <div className="w-full md:w-80 space-y-6 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileSignature className="w-5 h-5 text-gray-400" />
                                Arquivos do Edital
                            </h3>

                            <ul className="space-y-3">
                                {['Edital Completo', 'Anexo I - Modelo de Projeto', 'Anexo II - Autodeclaração'].map((doc, i) => (
                                    <li key={i}>
                                        <a href="#" className="flex items-center gap-3 text-sm p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all font-medium text-gray-700">
                                            <BadgeCheck className="w-4 h-4 text-[#1A56DB]" />
                                            {doc}.pdf
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
