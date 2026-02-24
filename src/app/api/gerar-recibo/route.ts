import { NextResponse } from 'next/server';
import { gerarReciboHTML } from '../../../lib/pdf/geradorRecibo';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Simulação do payload esperado do banco após a inscrição
        const payload = {
            numeroProtocolo: data.protocolo || "2026.0001.X",
            nomeProponente: data.nome || "Cidadão Cultural Padrão",
            cpfProponente: data.cpf || "123.456.789-00",
            tituloProjeto: data.titulo || "Meu Projeto de Impacto",
            nomeEdital: data.edital || "Edital LPG 001/2026",
            orgaoRealizador: data.orgao || "Secretaria de Cultura - Prefeitura Exemplo",
            dataEnvio: new Date(),
            // Em Vercel Edge o IP vem neste cabeçalho
            ipSubmissao: req.headers.get('x-forwarded-for') || "IP Desconhecido",
        };

        // Criando a Assinatura Hash (Diferencial GO MKT exigido)
        const rawData = `${payload.numeroProtocolo}|${payload.cpfProponente}|${payload.dataEnvio.toISOString()}`;
        const hashAsinatura = crypto.createHash('sha256').update(rawData).digest('hex');

        // Montar HTML do PDF
        const htmlFile = gerarReciboHTML({
            ...payload,
            hashAssinatura: hashAsinatura
        }, data.corTenant || "#1A56DB");

        // NOTA: Em produção, você conecta isso a uma API como o Browserless.io via Puppeteer 
        // ou usa a camada do html-pdf-node. Como estamos no App Router na Vercel,
        // o meio mais leve é retornar o HTML pronto pro usuário dar Print/Salvar como PDF, 
        // ou direcionar para um endpoint Serverless que compila o Buffer.

        // Para fins de demonstração imediata do modelo GOV.br:
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
