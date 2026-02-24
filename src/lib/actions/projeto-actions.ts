'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarHabilitacao(
    projetoId: string,
    status: 'habilitado' | 'inabilitado',
    justificativa: string
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projetos')
        .update({ status_habilitacao: status })
        .eq('id', projetoId)

    if (error) {
        console.error('Erro ao atualizar habilitacao:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/admin/editais`, 'layout')
    return { success: true }
}
