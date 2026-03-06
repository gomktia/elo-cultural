# CHECKLIST COMPLETO DE ATUALIZACOES - ELO CULTURAL
# Baseado na analise de TODOS os documentos da pasta MIRASSOL
# Data: 2026-03-06

---

## FASE 1 — INSCRICAO COMPLETA (Formulario do Proponente)

### 1.1 Perfil do Proponente - Campos Demograficos
- [ ] Adicionar campo `tipo_pessoa` (fisica / juridica / coletivo_sem_cnpj) no profiles
- [ ] Adicionar campo `nome_artistico` (nome social)
- [ ] Adicionar campo `data_nascimento`
- [ ] Adicionar campo `comunidade_tradicional` (enum: nenhuma, extrativistas, ribeirinhas, rurais, indigenas, ciganos, pescadores, terreiro, quilombolas, outra)
- [ ] Adicionar campo `tipo_deficiencia` (enum: auditiva, fisica, intelectual, multipla, visual, outra) - quando pcd=true
- [ ] Adicionar campo `escolaridade` (enum: sem_educacao_formal, fundamental_incompleto, fundamental_completo, medio_incompleto, medio_completo, tecnico, superior_incompleto, superior_completo, pos_graduacao)
- [ ] Adicionar campo `beneficiario_programa_social` (enum: nenhum, bolsa_familia, bpc, outro)
- [ ] Adicionar campo `funcao_cultural` (enum: artista, instrutor, curador, produtor, gestor, tecnico, consultor, outro)
- [ ] Atualizar formulario de cadastro do proponente com todos os campos

### 1.2 Perfil Pessoa Juridica
- [ ] Adicionar campos PJ no profiles: `razao_social`, `nome_fantasia`, `endereco_sede`
- [ ] Adicionar campos do representante legal: `representante_nome`, `representante_cpf`, `representante_genero`, `representante_raca_etnia`, `representante_pcd`, `representante_escolaridade`
- [ ] UI condicional: mostrar campos PJ quando tipo_pessoa = juridica

### 1.3 Perfil Coletivo sem CNPJ
- [ ] Criar tabela `coletivos` (id, profile_id, nome_coletivo, ano_criacao, quantidade_membros)
- [ ] Criar tabela `coletivo_membros` (id, coletivo_id, nome, cpf)
- [ ] Campo para upload de portfolio do coletivo
- [ ] UI condicional: mostrar campos de coletivo quando tipo_pessoa = coletivo_sem_cnpj

### 1.4 Formulario de Inscricao do Projeto (campos estruturados)
- [ ] Adicionar campo `areas_projeto` (multi-select: artes_digitais, artes_transversais, artes_visuais, artesanato, audiovisual, circo, cultura_popular, danca, economia_criativa, livro_literatura, musica, patrimonio, teatro, tradicao_folclore, outras)
- [ ] Adicionar campo `minicurriculo_proponente` (textarea)
- [ ] Adicionar campo `objetivos` (textarea)
- [ ] Adicionar campo `metas` (textarea estruturado ou JSON array)
- [ ] Adicionar campo `perfil_publico` (textarea)
- [ ] Adicionar campo `publico_prioritario` (multi-select: vitimas_violencia, pobreza, situacao_rua, privacao_liberdade, pcd, sofrimento_fisico_psiquico, mulheres, lgbtqiapn, povos_tradicionais, negros, ciganos, indigenas, aberto_todos, outro)
- [ ] Adicionar campo `local_execucao` (texto)
- [ ] Adicionar campo `periodo_execucao_inicio` e `periodo_execucao_fim` (date)
- [ ] Adicionar campo `estrategia_divulgacao` (textarea)
- [ ] Adicionar campo `outras_fontes_recurso` (boolean + detalhamento)
- [ ] Adicionar campo `venda_produtos_ingressos` (boolean + detalhamento)
- [ ] Adicionar campo `contrapartida_social` (textarea)
- [ ] Concorrencia a cotas: campo `concorre_cota` (boolean) + `tipo_cota` (negra, indigena, pcd)

### 1.5 Medidas de Acessibilidade do Projeto
- [ ] Criar campo JSONB `acessibilidade` no projeto com 3 categorias:
  - Arquitetonica: rotas_acessiveis, piso_tatil, rampas, elevadores, corrimaos, banheiros_adaptados, vagas_estacionamento, assentos_obesos, iluminacao
  - Comunicacional: libras, braille, sinalizacao_tatil, audiodescricao, legendas, linguagem_simples, textos_leitor_tela
  - Atitudinal: capacitacao_equipes, contratacao_pcd, formacao_sensibilizacao
- [ ] Campo descritivo de como as medidas serao implementadas

### 1.6 Ficha Tecnica / Equipe do Projeto
- [ ] Criar tabela `projeto_equipe` (id, projeto_id, nome, funcao, cpf_cnpj, minicurriculo)
- [ ] UI para adicionar/remover membros da equipe
- [ ] Exibir equipe na visualizacao do projeto

### 1.7 Planilha Orcamentaria Estruturada
- [ ] Criar tabela `projeto_orcamento_itens` (id, projeto_id, categoria [producao/divulgacao/acessibilidade/outras_fontes], item, unidade_medida, quantidade, valor_unitario, valor_total)
- [ ] UI de tabela editavel para adicionar itens por categoria
- [ ] Calculo automatico de totais por categoria e total geral
- [ ] Validacao: total itens deve ser <= orcamento do edital

### 1.8 Cronograma de Execucao Estruturado
- [ ] Criar tabela `projeto_cronograma` (id, projeto_id, fase [pre_producao/divulgacao/producao/pos_producao], atividade, data_inicio, data_fim)
- [ ] UI de tabela editavel agrupada por fase
- [ ] Validacao: datas dentro do periodo de execucao

### 1.9 Templates DOCX/XLSX para Download
- [ ] Zona de "Anexos do Edital" na pagina publica do edital
- [ ] Gestor faz upload de templates (DOCX/XLSX) ao criar edital
- [ ] Proponente baixa templates, preenche offline, faz upload como PDF
- [ ] Aceitar upload de DOCX alem de PDF (adicionar ao mime type do storage)
- [ ] Tipos de anexo no edital: carta_anuencia, planilha_orcamentaria, cronograma, termo_compromisso, declaracao_etnico_racial, declaracao_pcd, declaracao_coletivo, formulario_recurso, outros

---

## FASE 2 — AVALIACAO E SELECAO

### 2.1 Configuracao de Pareceristas por Edital
- [ ] Adicionar campo `numero_pareceristas` no editais (default: 3)
- [ ] Adicionar campo `nota_minima_aprovacao` no editais (ex: 30 pontos)
- [ ] Adicionar campo `nota_zero_desclassifica` (boolean, default true) — nota 0 em qualquer criterio = desclassificado

### 2.2 Atribuicao de Pareceristas
- [ ] Melhorar pagina /admin/editais/[id]/atribuicoes
- [ ] Distribuicao automatica: N pareceristas por projeto, balanceando carga
- [ ] Distribuicao manual: gestor escolhe quais pareceristas avaliam qual projeto
- [ ] Verificacao de impedimento: parecerista nao pode avaliar projeto de parente/conhecido
- [ ] Status visual: quantos projetos cada parecerista ja avaliou

### 2.3 Calculo de Media e Ranking Automatico
- [ ] Calcular nota_final = media das notas dos N pareceristas
- [ ] Exibir no ranking: Parecerista 1 | Parecerista 2 | Parecerista 3 | Media Final
- [ ] Desclassificar automaticamente projetos com nota 0 em qualquer criterio
- [ ] Desclassificar projetos abaixo da nota minima
- [ ] Alerta de discrepancia: quando diferenca entre pareceristas > X pontos

### 2.4 Comissao de Avaliacao
- [ ] Criar tabela `edital_comissao` (id, edital_id, nome, cpf, qualificacao, tipo [sociedade_civil/poder_executivo], portaria_numero)
- [ ] UI para cadastrar membros da comissao
- [ ] Gerar portaria de designacao (PDF)
- [ ] Publicar composicao da comissao

### 2.5 Criterios de Desempate
- [ ] Configuracao dos criterios de desempate por edital (ordem de prioridade)
- [ ] Desempate automatico no ranking: maior nota no criterio A, depois B, depois C, depois D
- [ ] Desempate final por sorteio (registro auditavel)

---

## FASE 3 — COTAS, SUPLENTES E CLASSIFICACAO

### 3.1 Motor de Cotas Inteligente
- [ ] Configuracao de cotas por edital: tipo_cota, percentual ou vagas_fixas, por_categoria (boolean)
- [ ] Tipos de cota: pessoa_negra, pessoa_indigena, pessoa_pcd, areas_perifericas
- [ ] Regra: cotista concorre simultaneamente em ampla concorrencia e na cota
- [ ] Se cotista atinge nota suficiente pela ampla, entra por la e libera vaga da cota
- [ ] Remanejamento automatico: vagas de cota nao preenchidas -> outra cota -> ampla concorrencia
- [ ] Classificacao exibe: "CLASSIFICADO - AMPLA CONCORRENCIA" / "CLASSIFICADO - COTA PESSOAS NEGRAS" / "CLASSIFICADO - AREAS PERIFERICAS" / etc.

### 3.2 Areas Perifericas / Regioes
- [ ] Configuracao de areas perifericas por edital (lista de bairros/regioes)
- [ ] Validacao automatica baseada no endereco do proponente
- [ ] Percentual reservado configuravel (default 20%)

### 3.3 Sistema de Suplentes e Chamadas
- [ ] Lista de suplentes automatica por categoria (classificados apos o corte de vagas)
- [ ] Workflow de convocacao: quando titular e inabilitado -> convocar proximo suplente
- [ ] Historico de chamadas (1a, 2a, 3a, 4a chamada)
- [ ] Status por projeto: CLASSIFICADO / SUPLENTE / SUPLENTE_CONVOCADO_2A / SUPLENTE_CONVOCADO_3A / etc.
- [ ] Notificacao automatica ao suplente convocado
- [ ] Prazo para suplente apresentar documentacao de habilitacao

### 3.4 Lista de Inscritos Publica
- [ ] Pagina publica /editais/[id]/inscritos
- [ ] Exibir: nome proponente, nome projeto, categoria
- [ ] Exportacao em PDF e XLSX
- [ ] Periodo de impugnacao configuravel

### 3.5 Publicacao de Resultados
- [ ] Resultado preliminar da selecao (ranking por categoria com status)
- [ ] Resultado final da selecao (pos-recursos)
- [ ] Resultado preliminar da habilitacao
- [ ] Resultado definitivo da habilitacao
- [ ] Homologacao final
- [ ] Cada publicacao gera PDF automatico + notificacao aos proponentes

---

## FASE 4 — RECURSOS E DECISOES

### 4.1 Workflow de Recurso Completo
- [ ] Recurso da inscricao (impugnacao lista de inscritos)
- [ ] Recurso da selecao (contestar notas/classificacao)
- [ ] Recurso da habilitacao (contestar inabilitacao)
- [ ] Prazo configuravel por tipo de recurso (default 3 dias uteis)
- [ ] Contagem automatica de dias uteis (excluir sabados, domingos, feriados)
- [ ] Bloqueio de envio apos prazo

### 4.2 Analise de Recurso pelo Gestor
- [ ] Dashboard de recursos pendentes por edital
- [ ] Visualizacao lado-a-lado: recurso do proponente + pareceres originais
- [ ] Opcoes de decisao: DEFERIDO / INDEFERIDO / DEFERIDO_PARCIAL
- [ ] No deferimento parcial: selecionar quais criterios devem ser revisados e por qual parecerista
- [ ] Devolver parecer para parecerista revisar criterios especificos
- [ ] Parecerista revisa -> nova nota -> recalcula media -> atualiza ranking

### 4.3 Decisao Administrativa (Template)
- [ ] Template estruturado da decisao com campos: fundamentacao, analise_merito, conclusao, dispositivo
- [ ] Geracao automatica de PDF da decisao
- [ ] Assinatura digital da decisao (assessor + coordenador + secretario)
- [ ] Publicacao da decisao vinculada ao recurso
- [ ] Notificacao ao proponente com a decisao

---

## FASE 5 — HABILITACAO

### 5.1 Checklist de Documentos de Habilitacao
- [ ] Configuracao por edital dos documentos exigidos na habilitacao
- [ ] Tipos: certidao_federal, certidao_estadual, certidao_municipal, certidao_trabalhista, documento_pessoal, comprovante_residencia, estatuto_social, ata_posse, declaracao_conjunta, ficha_cnpj
- [ ] Proponente faz upload de cada documento
- [ ] Gestor confere cada documento (aprovado/reprovado/pendencia)
- [ ] Diligencia: ate 2 notificacoes para regularizar (prazo 5 dias uteis cada)

### 5.2 Consultas Automaticas (futuro)
- [ ] Consulta CND federal via API (Receita Federal)
- [ ] Consulta CNDT via API (TST)
- [ ] Consulta FGTS/CRF via API (Caixa)
- [ ] Consulta CEPIM via API (Portal da Transparencia)
- [ ] Consulta situacao CNPJ via API (Receita Federal)

---

## FASE 6 — TERMO DE EXECUCAO CULTURAL E ASSINATURA

### 6.1 Tabela e Dados do Termo
- [ ] Criar tabela `termos_execucao` (id, projeto_id, tenant_id, numero_termo, edital_referencia)
- [ ] Campos: valor_total, valor_extenso, vigencia_inicio, vigencia_fim, vigencia_meses
- [ ] Dados bancarios: banco, agencia, conta_corrente, tipo_conta
- [ ] Status: rascunho, pendente_assinatura_proponente, pendente_assinatura_gestor, assinado, vigente, encerrado, rescindido
- [ ] Campos de assinatura: assinado_proponente_em, assinado_gestor_em, ip_proponente, ip_gestor
- [ ] Prazo para assinatura (default 2 dias uteis)

### 6.2 Geracao Automatica do Termo (PDF)
- [ ] Template do Termo com 14 clausulas preenchidas automaticamente
- [ ] Dados automaticos: nome proponente, CPF/CNPJ, RG, endereco, projeto, valor, banco, vigencia
- [ ] Dados do ente federativo (tenant): nome, representante, cargo
- [ ] Geracao em PDF com layout profissional
- [ ] Preview antes de assinar

### 6.3 Assinatura Eletronica Simples (MVP)
- [ ] Tela de assinatura com visualizacao do PDF
- [ ] Checkbox: "Declaro que li e concordo com todos os termos"
- [ ] Captura de dados: IP, user-agent, timestamp, hash SHA-256 do documento
- [ ] Selo visual no PDF: "Assinado eletronicamente por [NOME] em [DATA] as [HORA] - IP: [IP] - Hash: [HASH]"
- [ ] Armazenar log de assinatura na tabela `assinaturas_digitais`
- [ ] Criar tabela `assinaturas_digitais` (id, documento_tipo, documento_id, usuario_id, ip, user_agent, hash_documento, timestamp, metodo [simples/govbr])
- [ ] Fluxo: proponente assina primeiro -> gestor/secretario assina depois -> status muda para "assinado"
- [ ] Validacao de assinatura: qualquer pessoa pode verificar hash do PDF

### 6.4 Assinatura via GOV.BR (Evolucao)
- [ ] Integracao com API Assinador GOV.BR (assinador.iti.br)
- [ ] Fluxo: gerar PDF -> enviar para API -> usuario autentica GOV.BR -> PDF assinado com ICP-Brasil retorna
- [ ] Armazenar certificado digital no log
- [ ] Opcao de escolha: assinatura simples OU GOV.BR
- [ ] Configuracao por tenant: qual metodo de assinatura usar

### 6.5 Aditivos ao Termo
- [ ] Criar tabela `termos_aditivos` (id, termo_id, numero_aditivo, tipo [prorrogacao/alteracao_valor/alteracao_objeto], justificativa, valor_alterado, nova_vigencia_fim)
- [ ] Regra: alteracoes ate 20% do valor podem ser feitas pelo proponente sem autorizacao previa (apenas comunicar)
- [ ] Alteracoes > 20% precisam de aprovacao do gestor
- [ ] Prorrogacao de oficio quando atraso na liberacao de recursos
- [ ] Geracao de PDF do aditivo + assinatura

### 6.6 Pagamento
- [ ] Registrar liberacao do pagamento (data, valor, comprovante)
- [ ] Status: pendente, liberado, parcela_1, parcela_2, concluido
- [ ] Upload de comprovante de transferencia
- [ ] Notificacao ao proponente quando pagamento liberado

---

## FASE 7 — PRESTACAO DE CONTAS COMPLETA

### 7.1 Relatorio de Execucao do Objeto (ANEXO XI)
- [ ] Reformular tabela `prestacoes_contas` com campos estruturados:
  - Secao 1: dados do projeto (auto-preenchidos)
  - Secao 2: resumo da execucao + acoes_realizadas (enum: sim_conforme/sim_com_adaptacoes/parcial/nao_conforme)
  - Secao 2.3: acoes desenvolvidas (texto livre com datas e locais)
  - Secao 2.4: metas cumpridas (JSON array: [{meta, status [cumprida/parcial/nao_cumprida], observacao, justificativa}])
  - Secao 3: produtos gerados (multi-select + quantidades: publicacao, livro, catalogo, live, video, documentario, filme, pesquisa, producao_musical, jogo, artesanato, obra, espetaculo, show, site, musica, outros)
  - Secao 3.1.2: disponibilizacao dos produtos ao publico (texto)
  - Secao 3.2: resultados gerados (multi-select: criacao, pesquisa, manutencao_atividades, identidade_cultural, praticas_culturais, formacao, programacoes, preservacao)
  - Secao 4: publico alcancado (numero + mecanismo de mensuracao + justificativa se baixa frequencia)
  - Secao 5: equipe (quantidade + houve_mudancas boolean + lista profissionais)
  - Secao 6: locais de realizacao (presencial/virtual/hibrido + plataformas + links + tipo_local)
  - Secao 7: divulgacao do projeto (texto)
  - Secao 8: topicos adicionais (texto)
  - Secao 9: anexos comprobatorios

### 7.2 Equipe da Prestacao de Contas
- [ ] Criar tabela `prestacao_equipe` (id, prestacao_id, nome, funcao, cpf_cnpj, pessoa_negra_indigena boolean, pessoa_pcd boolean)
- [ ] UI para listar profissionais que participaram da execucao

### 7.3 Anexos Comprobatorios
- [ ] Upload de multiplos anexos: fotos, videos, listas de presenca, relatorio fotografico, folders, materiais de divulgacao
- [ ] Categorizar anexos por tipo
- [ ] Galeria visual dos comprovantes

### 7.4 Analise da Prestacao pelo Gestor
- [ ] Parecer tecnico com opcoes:
  - Cumprimento integral do objeto
  - Necessidade de documentacao complementar
  - Necessidade de Relatorio Financeiro
- [ ] Julgamento final:
  - Aprovada sem ressalvas
  - Aprovada com ressalvas (realizou a acao mas com inadequacoes, sem ma-fe)
  - Rejeitada parcial (devolucao proporcional)
  - Rejeitada total (devolucao + multa + suspensao 180-540 dias)
- [ ] Plano de acoes compensatorias (alternativa a devolucao)
- [ ] Parcelamento de debito

### 7.5 Relatorio Financeiro (quando exigido)
- [ ] Somente quando: objeto nao comprovado OU denuncia de irregularidade
- [ ] Relacao de pagamentos (data, descricao, valor, comprovante)
- [ ] Extrato bancario da conta especifica
- [ ] Comprovante de saldo remanescente (devolver se houver)
- [ ] Prazo: 120 dias apos notificacao

---

## FASE 8 — EXPORTACOES E RELATORIOS

### 8.1 Exportacao PNAB Federal (Planilha MinC)
- [ ] Gerar XLSX com 6 abas no formato padrao do MinC:
  - Aba Instrumentos: CNPJ tenant, titulo edital, numero, link, objeto, modalidade, valor_total, inscritos, selecionados, segmentos, cotas, acoes_afirmativas, comissao
  - Aba Pessoas Fisicas: CPF, nome, email, tel, nascimento, CEP, cidade, situacao, raca, sexo, genero, orientacao_sexual, renda, escolaridade, PCD, indigena, quilombola, segmentos, ocupacoes, acesso_previo_recursos
  - Aba Organizacoes: tipo, CNPJ, CPF representante, data fundacao, dados representante
  - Aba Acoes Culturais: identificador, CPF/CNPJ, edital, valor, modalidade, resumo, segmentos
  - Aba Categorias: listas de referencia para dropdowns
- [ ] Botao "Exportar Planilha PNAB" no dashboard do gestor
- [ ] Validacao: alertar campos faltantes antes de exportar

### 8.2 Lista de Inscritos (PDF/XLSX)
- [ ] Exportar lista formatada com numero, nome, projeto, categoria
- [ ] Versao PDF para publicacao oficial
- [ ] Versao XLSX para trabalho interno

### 8.3 Fichas de Avaliacao (PDF)
- [ ] Gerar PDF da ficha de avaliacao por projeto (modelo das FICHAS DE AVALIACAO)
- [ ] Incluir: criterios, notas, parecer, assinatura do parecerista
- [ ] Exportar todas as fichas de um edital em PDF unico (merge)

### 8.4 Resultado/Classificacao (PDF/XLSX)
- [ ] Gerar PDF do resultado por categoria com: classificacao, proponente, projeto, cotas, parecerista1, parecerista2, parecerista3, media, status, habilitacao
- [ ] Formato similar a LISTA GERAL PNAB.xlsx

### 8.5 Termo de Execucao (PDF)
- [ ] Gerar PDF do Termo com todas as 14 clausulas preenchidas
- [ ] Incluir selos de assinatura digital

### 8.6 Decisao Administrativa (PDF)
- [ ] Gerar PDF da decisao de recurso com fundamentacao completa

### 8.7 Portaria da Comissao (PDF)
- [ ] Gerar PDF da portaria de designacao dos pareceristas

---

## FASE 9 — ERRATAS E VERSIONAMENTO

### 9.1 Erratas do Edital
- [ ] Criar tabela `edital_erratas` (id, edital_id, numero_errata, descricao, campo_alterado, valor_anterior, valor_novo, publicado_em, publicado_por)
- [ ] UI para criar errata com diff do que mudou
- [ ] Historico de todas as erratas de um edital
- [ ] Publicacao automatica da errata
- [ ] Notificacao a todos os inscritos quando errata publicada

### 9.2 Versionamento do Edital
- [ ] Salvar snapshot do edital a cada alteracao significativa
- [ ] Exibir versao atual vs versoes anteriores
- [ ] Log de quem alterou o que e quando

---

## FASE 10 — CULTURA VIVA (PNCV)

### 10.1 Tipo de Edital Cultura Viva
- [ ] Adicionar tipo_edital: `cultura_viva` ao enum
- [ ] Configuracoes especificas: somente PJ, certificacao de Ponto de Cultura, TCC ao inves de Termo de Execucao

### 10.2 Avaliacao em Dois Blocos
- [ ] Bloco 1: avaliacao da entidade cultural (18 criterios, 100 pontos)
- [ ] Bloco 2: avaliacao do projeto (3 sub-blocos, 100 pontos)
- [ ] Nota final = media aritmetica dos 2 blocos
- [ ] Pontuacao minima Bloco 1 para pre-certificacao: 50 pontos

### 10.3 Certificacao como Ponto de Cultura
- [ ] Status de certificacao: nao_certificado, pre_certificado, certificado
- [ ] Entidades ja certificadas pelo MinC: verificar na Plataforma Cultura Viva
- [ ] Regra: entidade certificada nao precisa nota minima no Bloco 1

### 10.4 Metas Padronizadas Obrigatorias
- [ ] Meta 1: Formacao e Educacao Cultural
- [ ] Meta 2: Mostra Artistica/Cultural
- [ ] Meta 3: Registro e Divulgacao
- [ ] Metas adicionais opcionais

### 10.5 Comite Gestor
- [ ] Cadastro de Comite Gestor obrigatorio (min 4 entidades sociedade civil + 1 servico publico)
- [ ] Vinculacao ao projeto

---

## FASE 11 — NOTIFICACOES E COMUNICACAO

### 11.1 Notificacoes Automaticas
- [ ] Inscricao confirmada (proponente)
- [ ] Lista de inscritos publicada (todos os inscritos)
- [ ] Resultado preliminar publicado (todos os inscritos)
- [ ] Prazo de recurso iniciado (proponentes afetados)
- [ ] Decisao de recurso publicada (proponente)
- [ ] Convocacao para habilitacao (classificados + suplentes convocados)
- [ ] Resultado habilitacao publicado (convocados)
- [ ] Convocacao de suplente (suplente)
- [ ] Termo de Execucao disponivel para assinatura (contemplado)
- [ ] Prazo de assinatura vencendo (contemplado - lembrete)
- [ ] Pagamento liberado (contemplado)
- [ ] Prazo de prestacao de contas se aproximando (contemplado - 30, 15, 7 dias)
- [ ] Prestacao de contas analisada (contemplado)
- [ ] Errata publicada (todos os inscritos)

### 11.2 Notificacoes por Email
- [ ] Integrar todas as notificacoes acima com envio de email (Resend)
- [ ] Template de email padrao com branding do tenant
- [ ] Opcao de desativar email (manter apenas in-app)

### 11.3 Notificacoes por WhatsApp (futuro)
- [ ] Integracao com API WhatsApp Business (Evolution API ou similar)
- [ ] Mensagens criticas: convocacao suplente, prazo vencendo, pagamento

---

## FASE 12 — MELHORIAS DE UX/UI

### 12.1 Dashboard do Gestor
- [ ] Cards de resumo: total inscritos, em avaliacao, classificados, habilitados, termos assinados, pagos, em execucao, prestacao pendente
- [ ] Timeline visual do edital com fase atual destacada
- [ ] Alertas: prazos vencendo, recursos pendentes, habilitacoes pendentes

### 12.2 Dashboard do Proponente
- [ ] Status do projeto com timeline visual (inscrito -> em avaliacao -> classificado -> habilitado -> termo -> pagamento -> execucao -> prestacao)
- [ ] Documentos pendentes de envio
- [ ] Prazos importantes com countdown
- [ ] Historico de notificacoes

### 12.3 Pagina Publica do Edital
- [ ] Secao "Anexos para Download" com todos os templates DOCX/XLSX
- [ ] Secao "Documentos Publicados" (erratas, resultados, atas)
- [ ] Secao "Cronograma" visual com fases e datas
- [ ] Secao "Categorias e Vagas" com tabela de cotas
- [ ] Secao "Criterios de Avaliacao" com pesos

---

## RESUMO GERAL

| Fase | Descricao | Itens | Prioridade |
|------|-----------|-------|------------|
| 1 | Inscricao Completa | 43 itens | ALTA |
| 2 | Avaliacao e Selecao | 16 itens | ALTA |
| 3 | Cotas, Suplentes e Classificacao | 17 itens | ALTA |
| 4 | Recursos e Decisoes | 13 itens | ALTA |
| 5 | Habilitacao | 11 itens | ALTA |
| 6 | Termo de Execucao e Assinatura | 22 itens | ALTA |
| 7 | Prestacao de Contas Completa | 18 itens | ALTA |
| 8 | Exportacoes e Relatorios | 14 itens | MEDIA |
| 9 | Erratas e Versionamento | 7 itens | MEDIA |
| 10 | Cultura Viva (PNCV) | 11 itens | MEDIA |
| 11 | Notificacoes e Comunicacao | 17 itens | MEDIA |
| 12 | Melhorias UX/UI | 10 itens | MEDIA |
| **TOTAL** | | **~199 itens** | |
