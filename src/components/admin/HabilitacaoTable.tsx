'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Projeto } from '@/types/database.types'
import { HabilitacaoSheet } from './HabilitacaoSheet'
import { Search, Eye, Filter, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface HabilitacaoTableProps {
    projetos: Projeto[]
    aiSugestoes?: Record<string, { sugestao: string; motivo: string }>
}

function getAiBadge(sugestao: string) {
    switch (sugestao) {
        case 'habilitado':
            return <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none rounded-md px-2 text-[11px] font-medium"><Sparkles className="h-3 w-3 mr-1" />Habilitado</Badge>
        case 'inabilitado':
            return <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none rounded-md px-2 text-[11px] font-medium"><Sparkles className="h-3 w-3 mr-1" />Inabilitado</Badge>
        default:
            return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none rounded-md px-2 text-[11px] font-medium"><Sparkles className="h-3 w-3 mr-1" />Pendência</Badge>
    }
}

export function HabilitacaoTable({ projetos, aiSugestoes }: HabilitacaoTableProps) {
    const router = useRouter()
    const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredProjetos = projetos.filter(p =>
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.numero_protocolo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function getStatusBadge(status: string) {
        switch (status) {
            case 'habilitado':
                return <Badge className="bg-green-50 text-[var(--brand-success)] hover:bg-green-50 border-none rounded-md px-2 font-semibold">Habilitado</Badge>
            case 'inabilitado':
                return <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none rounded-md px-2 font-semibold">Inabilitado</Badge>
            default:
                return <Badge variant="outline" className="text-slate-400 border-slate-200 rounded-md px-2">Pendente</Badge>
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Filtrar por título ou protocolo..."
                        className="h-12 pl-12 bg-white/50 border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-primary/10 font-bold transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 bg-white/50 hover:bg-white shadow-sm">
                    <Filter className="h-5 w-5 text-slate-400" />
                </Button>
            </div>

            <div className="relative overflow-x-auto rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="min-w-[140px] py-6 px-4 md:px-8 font-medium text-xs uppercase tracking-wide text-slate-400">Protocolo</TableHead>
                            <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Título do Projeto</TableHead>
                            <TableHead className="min-w-[120px] py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Status</TableHead>
                            <TableHead className="min-w-[120px] py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Sugestão IA</TableHead>
                            <TableHead className="min-w-[80px] py-6 px-4 md:px-8 text-right font-medium text-xs uppercase tracking-wide text-slate-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProjetos.map((p) => (
                            <TableRow
                                key={p.id}
                                className="hover:bg-slate-50/50 transition-all duration-300 border-slate-50 cursor-pointer group"
                                onClick={() => {
                                    setSelectedProjeto(p)
                                    setIsSheetOpen(true)
                                }}
                            >
                                <TableCell className="py-6 px-8">
                                    <code className="text-[11px] font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide">
                                        {p.numero_protocolo}
                                    </code>
                                </TableCell>
                                <TableCell className="py-6 px-4">
                                    <div className="text-base font-semibold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                                        {p.titulo}
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 px-4">
                                    {getStatusBadge(p.status_habilitacao)}
                                </TableCell>
                                <TableCell className="py-6 px-4">
                                    {aiSugestoes?.[p.id] ? (
                                        <div className="flex flex-col gap-1">
                                            {getAiBadge(aiSugestoes[p.id].sugestao)}
                                            <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={aiSugestoes[p.id].motivo}>
                                                {aiSugestoes[p.id].motivo}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 text-xs">&mdash;</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-6 px-8 text-right">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all border border-transparent group-hover:shadow-lg group-hover:shadow-brand-primary/20">
                                        <Eye className="h-5 w-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredProjetos.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                                            <Search className="h-8 w-8" />
                                        </div>
                                        <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">Nenhum projeto encontrado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <HabilitacaoSheet
                projeto={selectedProjeto}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSuccess={() => router.refresh()}
            />
        </div>
    )
}
