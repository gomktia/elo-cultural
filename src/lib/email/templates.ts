/**
 * Email templates — white-label ready.
 * Uses inline CSS for maximum email client compatibility.
 */

export interface BrandOptions {
  brandName?: string
  brandColor?: string
}

function baseLayout(title: string, content: string, brand?: BrandOptions): string {
  const name = brand?.brandName || 'Elo Cultural'
  const color = brand?.brandColor || '#0047AB'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <tr><td style="background:${color};padding:24px 32px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px">${name}</h1>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600">${title}</h2>
    ${content}
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">${name} — Plataforma de Processos Seletivos Culturais</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.6">${text}</p>`
}

function highlight(label: string, value: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:8px 0">
    <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">${label}</span><br>
    <strong style="color:#0f172a;font-size:14px">${value}</strong>
  </div>`
}

function statusBadge(text: string, color: string): string {
  const colors: Record<string, string> = {
    green: 'background:#dcfce7;color:#166534',
    red: 'background:#fef2f2;color:#991b1b',
    amber: 'background:#fffbeb;color:#92400e',
    blue: 'background:#eff6ff;color:#1e40af',
  }
  return `<span style="${colors[color] || colors.blue};padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;text-transform:uppercase">${text}</span>`
}

// ─── TEMPLATES ─────────────────────────────────────────────────

export function inscricaoConfirmada(params: {
  nome: string
  protocolo: string
  titulo: string
  editalTitulo: string
  dataEnvio: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  return {
    subject: `Inscricao confirmada — ${params.protocolo}`,
    html: baseLayout('Inscricao Confirmada', `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p('Sua inscricao foi recebida com sucesso. Guarde o numero de protocolo para acompanhamento.')}
      ${highlight('Protocolo', params.protocolo)}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Edital', params.editalTitulo)}
      ${highlight('Data de Envio', params.dataEnvio)}
      ${p('Acompanhe o andamento pelo painel do proponente.')}
    `, params.brand),
  }
}

export function habilitacaoResultado(params: {
  nome: string
  titulo: string
  editalTitulo: string
  status: 'habilitado' | 'inabilitado'
  justificativa: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  const isHabilitado = params.status === 'habilitado'
  return {
    subject: `Habilitacao: ${params.status.toUpperCase()} — ${params.titulo}`,
    html: baseLayout('Resultado da Habilitacao', `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p(`O resultado da habilitacao do seu projeto foi publicado:`)}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Edital', params.editalTitulo)}
      <div style="margin:16px 0">${statusBadge(params.status, isHabilitado ? 'green' : 'red')}</div>
      ${params.justificativa ? highlight('Justificativa', params.justificativa) : ''}
      ${!isHabilitado ? p('Caso discorde, voce podera interpor recurso no prazo previsto no edital.') : p('Parabens! Seu projeto segue para a proxima etapa.')}
    `, params.brand),
  }
}

export function recursoDecisao(params: {
  nome: string
  titulo: string
  editalTitulo: string
  tipo: string
  status: 'deferido' | 'indeferido'
  decisao: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  const isDeferido = params.status === 'deferido'
  return {
    subject: `Recurso ${params.status.toUpperCase()} — ${params.titulo}`,
    html: baseLayout('Decisao do Recurso', `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p(`A decisao sobre o seu recurso de <strong>${params.tipo}</strong> foi publicada:`)}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Edital', params.editalTitulo)}
      <div style="margin:16px 0">${statusBadge(params.status, isDeferido ? 'green' : 'red')}</div>
      ${params.decisao ? highlight('Decisao', params.decisao) : ''}
    `, params.brand),
  }
}

export function editalFaseAlterada(params: {
  nome: string
  editalTitulo: string
  editalNumero: string
  novaFase: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  const faseLabels: Record<string, string> = {
    inscricao: 'Inscricoes Abertas',
    inscricao_encerrada: 'Inscricoes Encerradas',
    divulgacao_inscritos: 'Lista de Inscritos Publicada',
    avaliacao_tecnica: 'Avaliacao Tecnica em Andamento',
    resultado_preliminar_avaliacao: 'Resultado Preliminar da Avaliacao',
    resultado_preliminar_habilitacao: 'Resultado Preliminar da Habilitacao',
    resultado_final: 'Resultado Final Publicado',
    homologacao: 'Resultado Homologado',
  }
  const faseTexto = faseLabels[params.novaFase] || params.novaFase

  return {
    subject: `${faseTexto} — Edital ${params.editalNumero}`,
    html: baseLayout(faseTexto, `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p('Houve uma atualizacao no edital em que voce esta inscrito:')}
      ${highlight('Edital', `${params.editalNumero} — ${params.editalTitulo}`)}
      <div style="margin:16px 0">${statusBadge(faseTexto, 'blue')}</div>
      ${p('Acesse a plataforma para mais detalhes.')}
    `, params.brand),
  }
}

export function convocacaoSuplente(params: {
  nome: string
  titulo: string
  numeroChamada: number
  prazoHabilitacao: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  return {
    subject: `Convocacao de Suplente (${params.numeroChamada}a chamada) — ${params.titulo}`,
    html: baseLayout(`Convocacao de Suplente — ${params.numeroChamada}a Chamada`, `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p(`Seu projeto foi convocado como suplente na <strong>${params.numeroChamada}a chamada</strong>.`)}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Prazo para Habilitacao', params.prazoHabilitacao)}
      ${p('Apresente a documentacao de habilitacao dentro do prazo indicado para garantir sua vaga.')}
      ${p('Acesse a plataforma para mais detalhes.')}
    `, params.brand),
  }
}

export function pagamentoLiberado(params: {
  nome: string
  titulo: string
  valor: string
  status: 'liberado' | 'pago'
  brand?: BrandOptions
}): { subject: string; html: string } {
  const statusLabel = params.status === 'pago' ? 'Pago' : 'Liberado'
  return {
    subject: `Pagamento ${statusLabel} — ${params.titulo}`,
    html: baseLayout(`Pagamento ${statusLabel}`, `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p(`O pagamento referente ao seu projeto foi <strong>${statusLabel.toLowerCase()}</strong>.`)}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Valor', params.valor)}
      <div style="margin:16px 0">${statusBadge(statusLabel, params.status === 'pago' ? 'green' : 'blue')}</div>
      ${p('Acesse a plataforma para mais detalhes.')}
    `, params.brand),
  }
}

export function errataPublicada(params: {
  nome: string
  editalTitulo: string
  numeroErrata: number
  descricao: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  return {
    subject: `Errata no ${params.numeroErrata} — ${params.editalTitulo}`,
    html: baseLayout(`Errata no ${params.numeroErrata} Publicada`, `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p('Uma errata foi publicada no edital em que voce esta inscrito.')}
      ${highlight('Edital', params.editalTitulo)}
      ${highlight('Errata', `no ${params.numeroErrata}`)}
      ${highlight('Descricao', params.descricao)}
      ${p('Acesse a plataforma para consultar a errata completa.')}
    `, params.brand),
  }
}

export function termoDisponivel(params: {
  nome: string
  titulo: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  return {
    subject: `Termo de Execucao Disponivel — ${params.titulo}`,
    html: baseLayout('Termo de Execucao Disponivel', `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p('O Termo de Execucao Cultural referente ao seu projeto esta disponivel para assinatura.')}
      ${highlight('Projeto', params.titulo)}
      ${p('Acesse a plataforma para revisar e assinar o termo.')}
    `, params.brand),
  }
}

export function prazoLembrete(params: {
  nome: string
  titulo: string
  tipo: 'assinatura' | 'prestacao' | 'recurso'
  diasRestantes: number
  brand?: BrandOptions
}): { subject: string; html: string } {
  const tipoLabels: Record<string, string> = {
    assinatura: 'assinatura do termo',
    prestacao: 'prestacao de contas',
    recurso: 'interposicao de recurso',
  }
  const tipoLabel = tipoLabels[params.tipo] || params.tipo
  const urgencia = params.diasRestantes <= 2 ? 'red' : params.diasRestantes <= 5 ? 'amber' : 'blue'

  return {
    subject: `Prazo: ${params.diasRestantes} dia(s) para ${tipoLabel} — ${params.titulo}`,
    html: baseLayout('Lembrete de Prazo', `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p(`Voce tem <strong>${params.diasRestantes} dia(s)</strong> restante(s) para ${tipoLabel}.`)}
      ${highlight('Projeto', params.titulo)}
      <div style="margin:16px 0">${statusBadge(`${params.diasRestantes} dia(s) restante(s)`, urgencia)}</div>
      ${p('Acesse a plataforma para completar a acao pendente.')}
    `, params.brand),
  }
}

export function prestacaoStatus(params: {
  nome: string
  titulo: string
  protocolo: string
  status: string
  parecer: string
  brand?: BrandOptions
}): { subject: string; html: string } {
  const statusLabels: Record<string, { label: string; color: string }> = {
    aprovada: { label: 'Aprovada', color: 'green' },
    reprovada: { label: 'Reprovada', color: 'red' },
    com_pendencias: { label: 'Com Pendencias', color: 'amber' },
    em_analise: { label: 'Em Analise', color: 'blue' },
  }
  const info = statusLabels[params.status] || { label: params.status, color: 'blue' }

  return {
    subject: `Prestacao de Contas: ${info.label} — ${params.protocolo}`,
    html: baseLayout(`Prestacao de Contas — ${info.label}`, `
      ${p(`Ola, <strong>${params.nome}</strong>!`)}
      ${p('A prestacao de contas do seu projeto teve uma atualizacao:')}
      ${highlight('Projeto', params.titulo)}
      ${highlight('Protocolo', params.protocolo)}
      <div style="margin:16px 0">${statusBadge(info.label, info.color)}</div>
      ${params.parecer ? highlight('Parecer', params.parecer) : ''}
      ${p('Acesse a plataforma para mais detalhes.')}
    `, params.brand),
  }
}
