// Siga as instruções oficiais do Deno / Supabase Edge Functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req: Request) => {
    // Verificação básica de segurança / chave secreta
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
        return new Response(JSON.stringify({ error: "Acesso Inválido. Cron não autorizado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Inicializa o cliente Supabase com chave de serviço (ignora RLS já que é um job de sistema confiável)
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();

    // 1. CRON DA TRAVA AUTOMÁTICA
    // Buscar editais ainda marcados como 'inscricao' MAS cuja data_fim já estourou em relação ao "now()" do Cloud.
    const { data: editaisVencidos, error: errBusca } = await supabaseAdmin
        .from("editais")
        .select("id, titulo, tenant_id")
        .eq("status", "inscricao")
        .lte("fim_inscricao", now); // lte = "Menor ou igual a Data Atual do job"

    if (errBusca) {
        console.error("Erro na busca de editais vencidos:", errBusca);
        return new Response(JSON.stringify({ error: "Erro DB", detalhe: errBusca }), { status: 500 });
    }

    if (!editaisVencidos || editaisVencidos.length === 0) {
        return new Response(JSON.stringify({ mensagem: "Nenhum edital expirou no ciclo atual. Tudo normal." }), { status: 200 });
    }

    // 2. ALTERAÇÃO EM MASSA (Aciona a Trigger de Auditoria no banco!)
    const idsVencidos = editaisVencidos.map(e => e.id);

    const { error: errUpdate } = await supabaseAdmin
        .from("editais")
        .update({ status: "inscricao_encerrada" })
        .in("id", idsVencidos);

    if (errUpdate) {
        console.error("Erro ao travar inscrições:", errUpdate);
        return new Response(JSON.stringify({ error: "Falha Update DB", detalhe: errUpdate }), { status: 500 });
    }

    // Resumo de Sucesso
    return new Response(
        JSON.stringify({
            sucesso: true,
            mensagem: `${editaisVencidos.length} edital(is) foram migrados automaticamente de 'inscricao' para 'inscricao_encerrada'`,
            editais_alterados: editaisVencidos.map(e => e.titulo)
        }),
        { headers: { "Content-Type": "application/json" } }
    );
});
