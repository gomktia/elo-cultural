import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Scale } from 'lucide-react'
import { HabilitacaoTable } from '@/components/admin/HabilitacaoTable'
import { Projeto } from '@/types/database.types'

export default async function HabilitacaoPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Busca edital
    const { data: edital } = await supabase
        .from('editais')
        .select('titulo, numero_edital')
        .eq('id', id)
        .single()

    if (!edital) notFound()

    // 2. Busca projetos inscritos
    const { data: projetos } = await supabase
        .from('projetos')
        .select('*')
        .eq('edital_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href={`/admin/editais/${id}`}>
                        <Button variant="outline" size="icon" className="rounded-xl border-white/20 bg-white shadow-sm transition-transform">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Scale className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">{edital.numero_edital}</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Habilitação Documental
                        </h1>
                        <p className="text-slate-500 font-medium">{edital.titulo}</p>
                    </div>
                </div>
            </div>

            {/* Grid decorativo ou estatísticas rápidas podem vir aqui */}

            {/* Tabela de Projetos */}
            <section>
                <HabilitacaoTable projetos={(projetos as Projeto[]) || []} />
            </section>
        </div>
    )
}
