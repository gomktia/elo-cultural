'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Download, Loader2, BarChart3, CheckSquare } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { gerarRanking } from '@/lib/pdf/gerarRanking'
import { gerarAtaResultado } from '@/lib/pdf/gerarAtaResultado'
import { gerarHomologacao } from '@/lib/pdf/gerarHomologacao'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DownloadRelatoriosProps {
    editalId: string
    editalTitulo: string
    editalNumero: string
    tenantId: string
    tenantNome: string
}

export function DownloadRelatorios({
    editalId, editalTitulo, editalNumero, tenantId, tenantNome
}: DownloadRelatoriosProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const supabase = createClient()

    async function fetchData() {
        if (data) return
        setLoading(true)

        // Buscar ranking completo
        const { data: projetos, error } = await supabase
            .from('projetos')
            .select('id, titulo, numero_protocolo, nota_final, status_atual')
            .eq('edital_id', editalId)
            .order('nota_final', { ascending: false })

        if (error) {
            toast.error('Erro ao buscar dados para o relatório')
            setLoading(false)
            return
        }

        const rankingData = (projetos || []).map((p, idx) => ({
            posicao: idx + 1,
            titulo: p.titulo,
            protocolo: p.numero_protocolo,
            nota: p.nota_final,
            avaliacoes: 0 // Simplificado para o exemplo
        }))

        setData({ ranking: rankingData })
        setLoading(false)
    }

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchData()}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl border-brand-primary/20 hover:bg-brand-primary/5 hover:text-brand-primary transition-all">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span>Baixar Relatórios</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-white/20 glass">
                <DropdownMenuLabel className="font-bold text-slate-900">Documentos Oficiais</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {data ? (
                    <>
                        <DropdownMenuItem asChild className="focus:bg-brand-primary focus:text-white hover:bg-brand-primary hover:text-white rounded-lg cursor-pointer transition-colors px-3 py-2">
                            <PDFDownloadLink
                                document={gerarRanking({
                                    editalTitulo,
                                    editalNumero,
                                    ranking: data.ranking,
                                    tenantNome
                                })}
                                fileName={`ranking-${editalNumero.replace('/', '-')}.pdf`}
                                className="flex items-center gap-2 w-full"
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span>Ranking Consolidado</span>
                            </PDFDownloadLink>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="focus:bg-brand-primary focus:text-white hover:bg-brand-primary hover:text-white rounded-lg cursor-pointer transition-colors px-3 py-2">
                            <PDFDownloadLink
                                document={gerarAtaResultado({
                                    editalTitulo,
                                    editalNumero,
                                    tipo: 'final',
                                    ranking: data.ranking,
                                    dataPublicacao: new Date().toLocaleDateString('pt-BR'),
                                    tenantNome
                                })}
                                fileName={`ata-resultado-${editalNumero.replace('/', '-')}.pdf`}
                                className="flex items-center gap-2 w-full"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Ata de Resultado</span>
                            </PDFDownloadLink>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="focus:bg-brand-primary focus:text-white hover:bg-brand-primary hover:text-white rounded-lg cursor-pointer transition-colors px-3 py-2 text-slate-700">
                            <PDFDownloadLink
                                document={gerarHomologacao({
                                    editalTitulo,
                                    editalNumero,
                                    tenantNome,
                                    dataHomologacao: new Date().toLocaleDateString('pt-BR'),
                                    responsavel: 'Secretaria de Cultura'
                                })}
                                fileName={`homologacao-${editalNumero.replace('/', '-')}.pdf`}
                                className="flex items-center gap-2 w-full"
                            >
                                <CheckSquare className="h-4 w-4" />
                                <span>Termo Homologação</span>
                            </PDFDownloadLink>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <div className="p-4 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-300" />
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Carregando dados...</p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
