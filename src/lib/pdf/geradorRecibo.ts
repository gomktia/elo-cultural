import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DadosProtocolo {
    numeroProtocolo: string;
    nomeProponente: string;
    cpfProponente: string;
    tituloProjeto: string;
    nomeEdital: string;
    orgaoRealizador: string; // Ex: Prefeitura de SP
    dataEnvio: Date;
    ipSubmissao: string;
    hashAssinatura: string; // Um SHA256 simulado dos dados que garante integridade
}

// Essa função só roda do lado do SERVIDOR (Server Action ou Route Handler)
// pois usa bibliotecas ou carrega fontes de buffer que não servem pro navegador.
// Em vez de importar uma lib pesada como react-pdf, aqui usamos o Padrão Gov 
// e devolvemos um HTML que a Route API converte via headless (Puppeteer/Browserless) ou 
// apenas criamos a base do comprovante digital assinado.
export function gerarReciboHTML(dados: DadosProtocolo, corTenant: string = "#1A56DB") {

    // Gerando o HTML que formará o Recibo Oficial do Município
    const htmlString = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 40px;
                color: #111827;
                background-color: #ffffff;
            }
            .border_top { border-top: 5px solid ${corTenant}; }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #E5E7EB;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .gov-logo {
                background-color: ${corTenant};
                color: white;
                font-weight: 900;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 24px;
                letter-spacing: -1px;
            }
            .title { text-align: right; }
            .title h1 { margin: 0; font-size: 18px; color: #4B5563; text-transform: uppercase; }
            .title p { margin: 5px 0 0 0; color: #6B7280; font-size: 13px; font-weight: 600; }
            
            .box-protocolo {
                background-color: #F8FAFC;
                border: 2px dashed #CBD5E1;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                margin-bottom: 40px;
            }
            .box-protocolo h2 { margin: 0 0 10px 0; color: #64748B; font-size: 14px; text-transform: uppercase; }
            .box-protocolo .numero { font-size: 32px; font-weight: 900; color: ${corTenant}; letter-spacing: 2px;}
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px; background-color: #F3F4F6; border-bottom: 2px solid #E5E7EB; font-size: 12px; text-transform: uppercase; color: #6B7280; }
            td { padding: 14px 12px; border-bottom: 1px solid #E5E7EB; font-size: 15px; font-weight: 600;}
            
            .footer {
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #9CA3AF;
            }
            .hash-box {
                background-color: #F1F5F9;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 11px;
                word-break: break-all;
                color: #475569;
            }
        </style>
    </head>
    <body class="border_top">
        <div class="header">
            <div class="gov-logo">GOV . BR</div>
            <div class="title">
                <h1>Sistema de Editais Culturais</h1>
                <p>${dados.orgaoRealizador}</p>
            </div>
        </div>

        <div class="box-protocolo">
            <h2>Comprovante Oficial de Inscrição</h2>
            <div class="numero">${dados.numeroProtocolo}</div>
            <p style="margin-top: 15px; color: #334155; font-size: 13px; font-weight: 600;">Registrado em ${format(dados.dataEnvio, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
        </div>

        <table>
            <tr>
                <th width="30%">Edital</th>
                <td>${dados.nomeEdital}</td>
            </tr>
            <tr>
                <th>Proponente</th>
                <td>${dados.nomeProponente} <br/><span style="color:#64748B; font-size: 13px; font-weight: 400;">CPF: ${dados.cpfProponente}</span></td>
            </tr>
            <tr>
                <th>Projeto / Obra</th>
                <td>${dados.tituloProjeto}</td>
            </tr>
        </table>

        <div style="margin-top: 40px;">
            <p style="font-size: 14px; font-weight: bold; color: #1F2937; margin-bottom: 10px;">Autenticidade e Auditoria (Blockchain / SHA-256)</p>
            <div class="hash-box">
                Assinatura Digital (Hash): <br/><strong style="color: #0F172A">${dados.hashAssinatura}</strong>
            </div>
        </div>

        <div class="footer">
            <div>
                IP de Submissão: ${dados.ipSubmissao}<br/>
                Plataforma ELO Cultura V2
            </div>
            <div style="text-align: right;">
                Documento gerado automaticamente pelo sistema de licitações Culturais.<br/>
                Para verificar a autenticidade, acesse o portal do município.
            </div>
        </div>
    </body>
    </html>
    `;

    return htmlString;
}
