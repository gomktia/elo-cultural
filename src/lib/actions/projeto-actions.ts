'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyHabilitacaoResultado } from '@/lib/email/notify'
import { notifyInAppHabilitacao } from '@/lib/notifications/notify'
import { logAudit } from '@/lib/audit'

export async function atualizarHabilitacao(
    projetoId: string,
    status: 'habilitado' | 'inabilitado',
    justificativa: string
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch the project's edital_id and current status for audit
    const { data: projeto } = await supabase
        .from('projetos')
        .select('edital_id, tenant_id, status_habilitacao')
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

    if (user && projeto) {
        logAudit({
            supabase,
            acao: 'HABILITACAO_PROJETO',
            tabela_afetada: 'projetos',
            registro_id: projetoId,
            tenant_id: projeto.tenant_id,
            usuario_id: user.id,
            dados_antigos: { status_habilitacao: projeto.status_habilitacao },
            dados_novos: { status_habilitacao: status, justificativa },
        }).catch(() => {})
    }

    // Revalidate the specific habilitacao page
    if (projeto?.edital_id) {
        revalidatePath(`/admin/editais/${projeto.edital_id}/habilitacao`)
    }
    revalidatePath(`/admin/editais`, 'layout')

    // Fire-and-forget: notify proponente
    notifyHabilitacaoResultado({
        projetoId,
        status,
        justificativa: justificativa || '',
    }).catch(() => {})
    notifyInAppHabilitacao({
        projetoId,
        status,
        justificativa: justificativa || '',
    }).catch(() => {})

    return { success: true }
}
