'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarHabilitacao(
    projetoId: string,
    status: 'habilitado' | 'inabilitado',
    justificativa: string
) {
    const supabase = await createClient()

    // Fetch the project's edital_id for proper revalidation
    const { data: projeto } = await supabase
        .from('projetos')
        .select('edital_id')
        .eq('id', projetoId)
        .single()

    const { error } = await supabase
        .from('projetos')
        .update({
            status_habilitacao: status,
            justificativa_habilitacao: justificativa || null,
        })
        .eq('id', projetoId)

    if (error) {
        console.error('Erro ao atualizar habilitacao:', error)
        return { success: false, error: error.message }
    }

    // Revalidate the specific habilitacao page
    if (projeto?.edital_id) {
        revalidatePath(`/admin/editais/${projeto.edital_id}/habilitacao`)
    }
    revalidatePath(`/admin/editais`, 'layout')
    return { success: true }
}
