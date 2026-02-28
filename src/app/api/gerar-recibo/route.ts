import { NextResponse } from 'next/server';
import { gerarReciboHTML } from '../../../lib/pdf/geradorRecibo';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const data = await req.json();

        if (!data.protocolo || !data.nome || !data.cpf || !data.titulo || !data.edital) {
            return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
        }

        const payload = {
            numeroProtocolo: data.protocolo,
            nomeProponente: data.nome,
            cpfProponente: data.cpf,
            tituloProjeto: data.titulo,
            nomeEdital: data.edital,
            orgaoRealizador: data.orgao || '',
            dataEnvio: new Date(),
            ipSubmissao: req.headers.get('x-forwarded-for') || '',
        };

        const rawData = `${payload.numeroProtocolo}|${payload.cpfProponente}|${payload.dataEnvio.toISOString()}`;
        const hashAsinatura = crypto.createHash('sha256').update(rawData).digest('hex');

        const htmlFile = gerarReciboHTML({
            ...payload,
            hashAssinatura: hashAsinatura
        }, data.corTenant || "#1A56DB");

        return new NextResponse(htmlFile, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': 'inline; filename="protocolo.html"'
            }
        });

    } catch (error) {
        return NextResponse.json({ error: "Erro ao gerar protocolo." }, { status: 500 });
    }
}
