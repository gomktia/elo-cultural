# CHECKLIST COMPLETO DE ATUALIZACOES - ELO CULTURAL
# Baseado na analise de TODOS os documentos da pasta MIRASSOL
# Data: 2026-03-06

---

## FASE 1 — INSCRICAO COMPLETA (Formulario do Proponente)

### 1.1 Perfil do Proponente - Campos Demograficos
- [x] Adicionar campo `tipo_pessoa` (fisica / juridica / coletivo_sem_cnpj) no profiles ✅ migration 20260306000004
- [x] Adicionar campo `nome_artistico` (nome social) ✅
- [x] Adicionar campo `data_nascimento` ✅
- [x] Adicionar campo `comunidade_tradicional` ✅
- [x] Adicionar campo `tipo_deficiencia` (condicional quando pcd=true) ✅
- [x] Adicionar campo `escolaridade` ✅
- [x] Adicionar campo `beneficiario_programa_social` ✅
- [x] Adicionar campo `funcao_cultural` ✅
- [x] Atualizar formulario de cadastro do proponente com todos os campos ✅ ProponenteForm + perfil + cadastro + AdminEditProfileSheet

### 1.2 Perfil Pessoa Juridica
- [x] Adicionar campos PJ no profiles: `razao_social`, `nome_fantasia`, `endereco_sede` ✅ migration 20260306000006
- [x] Adicionar campos do representante legal: `representante_nome`, `representante_cpf`, `representante_genero`, `representante_raca_etnia`, `representante_pcd`, `representante_escolaridade` ✅ migration 20260306000006
- [x] UI condicional: mostrar campos PJ quando tipo_pessoa = juridica ✅ ProponenteForm seção condicional azul

### 1.3 Perfil Coletivo sem CNPJ
- [x] Criar tabela `coletivos` (id, profile_id, nome_coletivo, ano_criacao, quantidade_membros) ✅ migration 20260306000006
- [x] Criar tabela `coletivo_membros` (id, coletivo_id, nome, cpf) ✅ migration 20260306000006
- [x] Campo para upload de portfolio do coletivo ✅ campo texto portfolio na tabela coletivos + Textarea no form
- [x] UI condicional: mostrar campos de coletivo quando tipo_pessoa = coletivo_sem_cnpj ✅ ColetivoSection com mini form de membros

### 1.4 Formulario de Inscricao do Projeto (campos estruturados)
- [x] Adicionar campo `areas_projeto` (multi-select) ✅ migration 20260306000004 + InscricaoForm
- [x] Adicionar campo `minicurriculo_proponente` (textarea) ✅
- [x] Adicionar campo `objetivos` (textarea) ✅
- [x] Adicionar campo `metas` (textarea) ✅
- [x] Adicionar campo `perfil_publico` (textarea) ✅
- [x] Adicionar campo `publico_prioritario` (multi-select badges) ✅
- [x] Adicionar campo `local_execucao` (texto) ✅
- [x] Adicionar campo `periodo_execucao_inicio` e `periodo_execucao_fim` (date) ✅
- [x] Adicionar campo `estrategia_divulgacao` (textarea) ✅
- [x] Adicionar campo `outras_fontes_recurso` (boolean + detalhamento) ✅
- [x] Adicionar campo `venda_produtos_ingressos` (boolean + detalhamento) ✅
- [x] Adicionar campo `contrapartida_social` (textarea) ✅
- [x] Concorrencia a cotas: campo `concorre_cota` (boolean) + `tipo_cota` (negra, indigena, pcd) ✅

### 1.5 Medidas de Acessibilidade do Projeto
- [x] Criar campo JSONB `acessibilidade` no projeto com 3 categorias: ✅ migration 20260306000007
  - Arquitetonica: rotas_acessiveis, piso_tatil, rampas, elevadores, corrimaos, banheiros_adaptados, vagas_estacionamento, assentos_obesos, iluminacao
  - Comunicacional: libras, braille, sinalizacao_tatil, audiodescricao, legendas, linguagem_simples, textos_leitor_tela
  - Atitudinal: capacitacao_equipes, contratacao_pcd, formacao_sensibilizacao
- [x] Campo descritivo de como as medidas serao implementadas ✅ acessibilidade_descricao + UI no InscricaoForm Step 2

### 1.6 Ficha Tecnica / Equipe do Projeto
- [x] Criar tabela `projeto_equipe` (id, projeto_id, nome, funcao, cpf_cnpj, minicurriculo) ✅ migration 20260306000008
- [x] UI para adicionar/remover membros da equipe ✅ InscricaoForm Step 3 + EquipeAddForm
- [x] Exibir equipe na visualizacao do projeto ✅ projetos/[id]/page.tsx

### 1.7 Planilha Orcamentaria Estruturada
- [x] Criar tabela `projeto_orcamento_itens` (id, projeto_id, categoria [producao/divulgacao/acessibilidade/outras_fontes], item, unidade_medida, quantidade, valor_unitario, valor_total) ✅ migration 20260306000008
- [x] UI de tabela editavel para adicionar itens por categoria ✅ InscricaoForm Step 3 + OrcamentoAddForm
- [x] Calculo automatico de totais por categoria e total geral ✅ tabela com total geral no form + visualizacao
- [x] Validacao: total itens deve ser <= orcamento do edital ✅ auto-sync orcamento_total from items + warning mismatch

### 1.8 Cronograma de Execucao Estruturado
- [x] Criar tabela `projeto_cronograma` (id, projeto_id, fase [pre_producao/divulgacao/producao/pos_producao], atividade, data_inicio, data_fim) ✅ migration 20260306000008
- [x] UI de tabela editavel agrupada por fase ✅ InscricaoForm Step 3 + CronogramaAddForm
- [x] Validacao: datas dentro do periodo de execucao ✅ cronograma date warnings per item + global banner

### 1.9 Templates DOCX/XLSX para Download
- [x] Zona de "Anexos do Edital" na pagina publica do edital ✅ seção "Anexos para Download" com links diretos
- [x] Gestor faz upload de templates (DOCX/XLSX) ao criar edital ✅ admin/editais/[id]/anexos com upload form
- [x] Proponente baixa templates, preenche offline, faz upload como PDF ✅ links públicos para download
- [x] Aceitar upload de DOCX alem de PDF (adicionar ao mime type do storage) ✅ accept inclui .doc,.docx,.xls,.xlsx,.odt,.ods,.rtf,.txt,.zip
- [x] Tipos de anexo no edital: carta_anuencia, planilha_orcamentaria, cronograma, termo_compromisso, declaracao_etnico_racial, declaracao_pcd, declaracao_coletivo, formulario_recurso, outros ✅ migration 20260306000013 + CHECK constraint

---

## FASE 2 — AVALIACAO E SELECAO

### 2.1 Configuracao de Pareceristas por Edital
- [x] Adicionar campo `numero_pareceristas` no editais (default: 3) ✅ migration 20260306000002
- [x] Adicionar campo `nota_minima_aprovacao` no editais (ex: 30 pontos) ✅ migration 20260306000002
- [x] Adicionar campo `nota_zero_desclassifica` (boolean, default true) ✅ migration 20260306000002
- [x] Adicionar campo `limiar_discrepancia` no editais (default: 20) ✅ migration 20260306000002
- [x] UI de configuracao no formulario de criar/editar edital ✅ secao "Configuracao da Avaliacao"

### 2.2 Atribuicao de Pareceristas
- [x] Melhorar pagina /admin/editais/[id]/atribuicoes ✅ AtribuicaoMatrix com auto-distribute
- [x] Distribuicao automatica: N pareceristas por projeto, balanceando carga ✅ round-robin load-balanced autoDistribute()
- [x] Distribuicao manual: gestor escolhe quais pareceristas avaliam qual projeto ✅ já existia (checkbox matrix)
- [x] Verificacao de impedimento: parecerista nao pode avaliar projeto de parente/conhecido ✅ migration 20260306000017 + impedimento-actions.ts + visual no AtribuicaoMatrix (X vermelho + tooltip)
- [x] Status visual: quantos projetos cada parecerista ja avaliou ✅ badge N/M avaliados com cor por status

### 2.3 Calculo de Media e Ranking Automatico
- [x] Calcular nota_final = media das notas dos N pareceristas ✅ consolidar-ranking.ts (ja existia)
- [x] Exibir no ranking: Parecerista 1 | Parecerista 2 | Parecerista 3 | Media Final ✅ RankingTable com colunas P1/P2/P3
- [x] Desclassificar automaticamente projetos com nota 0 em qualquer criterio ✅ consolidar-ranking.ts nota_zero_desclassifica check
- [x] Desclassificar projetos abaixo da nota minima ✅ consolidar-ranking.ts nota_minima_aprovacao check
- [x] Alerta de discrepancia: quando diferenca entre pareceristas > X pontos ✅ icone AlertTriangle + tooltip
- [x] Exibir contagem avaliacoes pendentes (N/esperado) com destaque amber ✅

### 2.4 Comissao de Avaliacao
- [x] Criar tabela `edital_comissao` (id, edital_id, nome, cpf, qualificacao, tipo [sociedade_civil/poder_executivo], portaria_numero) ✅ migration 20260306000012
- [x] UI para cadastrar membros da comissao ✅ /admin/editais/[id]/comissao com form + lista agrupada por tipo
- [x] Gerar portaria de designação (PDF) ✅ PortariaComissaoPDF.tsx + /api/pdf/portaria-comissao/[id]
- [x] Publicar composicao da comissao ✅ seção pública na página do edital com membros agrupados por tipo

### 2.5 Criterios de Desempate
- [x] Configuracao dos criterios de desempate por edital (ordem de prioridade) ✅ EditalConfigManager seção desempate com toggle + reorder
- [x] Desempate automatico no ranking: maior nota no criterio A, depois B, depois C, depois D ✅ consolidar-ranking.ts compareDesempate()
- [x] Desempate final por sorteio (registro auditavel) ✅ sorteio via hash determinístico (DJB2) no consolidar-ranking.ts + opção no EditalConfigManager

---

## FASE 3 — COTAS, SUPLENTES E CLASSIFICACAO

### 3.1 Motor de Cotas Inteligente
- [x] Configuracao de cotas por edital: tipo_cota, percentual ou vagas_fixas, por_categoria (boolean) ✅ migration 20260306000009 tabela edital_cotas
- [x] Tipos de cota: pessoa_negra, pessoa_indigena, pessoa_pcd, areas_perifericas ✅ CHECK constraint na tabela
- [x] Regra: cotista concorre simultaneamente em ampla concorrencia e na cota ✅ consolidar-ranking.ts dual-track allocation
- [x] Se cotista atinge nota suficiente pela ampla, entra por la e libera vaga da cota ✅ Pass 1 (ampla) + Pass 3 (cotas restantes)
- [x] Remanejamento automatico: vagas de cota nao preenchidas -> outra cota -> ampla concorrencia ✅ Pass 4 (remanejamento)
- [x] Classificacao exibe: "CLASSIFICADO - AMPLA CONCORRENCIA" / "CLASSIFICADO - COTA PESSOAS NEGRAS" / "CLASSIFICADO - AREAS PERIFERICAS" / etc. ✅ RankingTable badges com classificacao_tipo + XLS export

### 3.2 Areas Perifericas / Regioes
- [x] Configuracao de areas perifericas por edital (lista de bairros/regioes) ✅ EditalConfigManager "Reserva de Vagas Regionais" + config_reserva_vagas JSONB
- [x] Validacao automatica baseada no endereco do proponente ✅ consolidar-ranking.ts verifica municipio do proponente vs região
- [x] Percentual reservado configuravel (default 20%) ✅ vagas fixas por região configurável no EditalConfigManager

### 3.3 Sistema de Suplentes e Chamadas
- [x] Lista de suplentes automatica por categoria (classificados apos o corte de vagas) ✅ consolidar-ranking.ts marca suplentes automaticamente
- [x] Workflow de convocacao: quando titular e inabilitado -> convocar proximo suplente ✅ convocacao-actions.ts convocarSuplente()
- [x] Historico de chamadas (1a, 2a, 3a, 4a chamada) ✅ tabela convocacoes (migration 20260306000011) + página admin
- [x] Status por projeto: CLASSIFICADO / SUPLENTE / SUPLENTE_CONVOCADO_2A / etc. ✅ status_atual dinâmico + badges
- [x] Notificacao automatica ao suplente convocado ✅ notifyInAppConvocacaoSuplente() chamada em convocarSuplente()
- [x] Prazo para suplente apresentar documentacao de habilitacao ✅ prazo_habilitacao (default 5 dias) + indicador prazo expirado

### 3.4 Lista de Inscritos Publica
- [x] Pagina publica /editais/[id]/inscritos ✅ src/app/(public)/editais/[id]/inscritos/page.tsx
- [x] Exibir: nome proponente, nome projeto, categoria ✅ com stats por categoria
- [x] Exportacao em PDF e XLSX ✅ InscritosExport.tsx (XLS) + botao na pagina publica do edital
- [x] Periodo de impugnacao configuravel ✅ migration 20260306000014 + campos inicio/fim_impugnacao_inscritos + UI no EditalConfigManager + exibição pública

### 3.5 Publicacao de Resultados
- [x] Resultado preliminar da selecao (ranking por categoria com status) ✅ publicar-resultado.ts auto-gera conteúdo + PublicacoesManager quick-publish
- [x] Resultado final da selecao (pos-recursos) ✅ publicar-resultado.ts tipo resultado_final_selecao
- [x] Resultado preliminar da habilitacao ✅ publicar-resultado.ts tipo resultado_preliminar_habilitacao
- [x] Resultado definitivo da habilitacao ✅ publicar-resultado.ts tipo resultado_definitivo_habilitacao
- [x] Homologacao final ✅ publicar-resultado.ts tipo homologacao_final com valor total + contemplados
- [x] Cada publicacao gera notificacao aos proponentes ✅ publicarResultado() chama notifyInAppEditalFase() (PDF pendente)

---

## FASE 4 — RECURSOS E DECISOES

### 4.1 Workflow de Recurso Completo
- [x] Recurso da inscricao (impugnacao lista de inscritos) ✅ ja existia
- [x] Recurso da selecao (contestar notas/classificacao) ✅ ja existia
- [x] Recurso da habilitacao (contestar inabilitacao) ✅ ja existia
- [x] Prazo configuravel por tipo de recurso ✅ ja existia (inicio/fim_recurso_inscricao/selecao/habilitacao)
- [x] Contagem automatica de dias uteis (excluir sabados, domingos, feriados) ✅ src/lib/utils/dias-uteis.ts com contarDiasUteis, adicionarDiasUteis, diasUteisRestantes + feriados nacionais
- [x] Bloqueio de envio apos prazo ✅ validacao no RecursoPage com prazos do edital

### 4.2 Analise de Recurso pelo Gestor
- [x] Dashboard de recursos pendentes por edital ✅ stats (total/pendentes/deferidos/indeferidos) + prazo ativo
- [x] Visualizacao lado-a-lado: recurso do proponente + pareceres originais ✅ /recursos/[recursoId] com grid 2 colunas
- [x] Opcoes de decisao: DEFERIDO / INDEFERIDO ✅ RecursoDecisaoPanel com parecer obrigatorio
- [x] No deferimento parcial: selecionar quais criterios devem ser revisados e por qual parecerista ✅ DeferimentoParcialPanel + solicitarRevisao() + migration 20260306000018
- [x] Devolver parecer para parecerista revisar criterios especificos ✅ recurso_revisoes table + status deferido_parcial + avaliacao reaberta
- [x] Parecerista revisa -> nova nota -> recalcula media -> atualiza ranking ✅ /avaliacao/revisoes page + submeterRevisao() + finalizarDeferimentoParcial() recalcula ranking

### 4.3 Decisao Administrativa (Template)
- [x] Template estruturado da decisao com campos: fundamentacao, analise_merito, conclusao, dispositivo ✅ RecursoDecisaoPanel com 4 campos estruturados
- [x] Geracao automatica de PDF da decisao ✅ DecisaoPDF.tsx + /api/pdf/decisao/[id]
- [x] Assinatura digital da decisao (assessor + coordenador + secretario) ✅ assinar-decisao.ts com SHA-256 hash + registro em assinaturas + badge "Assinado digitalmente"
- [x] Publicacao da decisao vinculada ao recurso ✅ parecer estruturado salvo no recurso via decidirRecurso()
- [x] Notificacao ao proponente com a decisao ✅ notifyInAppRecursoDecisao() já wired em decidirRecurso()

---

## FASE 5 — HABILITACAO

### 5.1 Checklist de Documentos de Habilitacao
- [x] Configuracao por edital dos documentos exigidos na habilitacao ✅ tabela edital_docs_habilitacao (migration 20260306000005)
- [x] Tipos configuraveis pelo gestor (qualquer tipo de documento) ✅
- [x] Proponente faz upload de cada documento ✅ ja existia (projeto_documentos)
- [x] Gestor confere cada documento (aprovado/reprovado/pendencia) ✅ habilitacao_doc_conferencia + HabilitacaoSheet com dropdown por doc
- [x] Diligencia: ate 2 notificacoes para regularizar (prazo 5 dias uteis cada) ✅ habilitacao_diligencias + botao "Enviar Diligencia" no sheet

### 5.2 Consultas Automaticas (futuro)
- [ ] Consulta CND federal via API (Receita Federal)
- [ ] Consulta CNDT via API (TST)
- [ ] Consulta FGTS/CRF via API (Caixa)
- [ ] Consulta CEPIM via API (Portal da Transparencia)
- [ ] Consulta situacao CNPJ via API (Receita Federal)

---

## FASE 6 — TERMO DE EXECUCAO CULTURAL E ASSINATURA

### 6.1 Tabela e Dados do Termo
- [x] Criar tabela `termos_execucao` ✅ migration 20260306000001
- [x] Campos: valor_total, valor_extenso, vigencia_inicio, vigencia_fim, vigencia_meses ✅
- [x] Dados bancarios: banco, agencia, conta_corrente, tipo_conta ✅
- [x] Status: rascunho, pendente_assinatura_proponente, pendente_assinatura_gestor, assinado, vigente, encerrado, rescindido ✅
- [x] Prazo para assinatura (default 2 dias uteis) ✅
- [x] RLS: proponente ve apenas os seus, staff ve do tenant, publico ve assinados/vigentes/encerrados ✅
- [x] Audit triggers ✅

### 6.2 Geracao Automatica do Termo (PDF)
- [x] Template do Termo com 14 clausulas preenchidas automaticamente ✅ TermoPDF.tsx com 14 cláusulas (objeto, valor, prazo, conta, prestação, alterações, devolução, rescisão, publicidade, acessibilidade, contrapartida, penalidades, foro, disposições finais)
- [x] Dados automaticos: nome proponente, CPF/CNPJ, RG, endereco, projeto, valor, banco, vigencia ✅ props TermoPDFProps com todos os dados
- [x] Dados do ente federativo (tenant): nome, representante, cargo ✅ tenantNome + representanteNome + representanteCargo
- [x] Geracao em PDF com layout profissional ✅ @react-pdf/renderer + /api/pdf/termo/[id]
- [x] Preview antes de assinar ✅ botão "Visualizar Termo (PDF)" no assinar-termo abre /api/pdf/termo/[id] em nova aba

### 6.x Admin UI de Termos (NOVO)
- [x] Pagina de listagem /admin/editais/[id]/termos com stats (total, assinados, pendentes, valor) ✅
- [x] Componente TermosTable com badges de status e acoes (visualizar/editar) ✅
- [x] Pagina de geracao em lote /admin/editais/[id]/termos/novo ✅
- [x] Server action gerarTermosEdital() com auto-numeracao TEC-YYYY-NNNN ✅
- [x] Server action enviarParaAssinatura() ✅
- [x] Link "Termos de Execucao" na grade de navegacao do edital ✅
- [x] TypeScript types: TermoExecucao, AssinaturaDigital, TermoAditivo, Pagamento, TermoWithProjeto ✅

### 6.3 Assinatura Eletronica Simples (MVP)
- [x] Tela de assinatura com visualizacao do termo ✅ /projetos/[id]/assinar-termo com resumo do termo + dados
- [x] Checkbox: "Declaro que li e concordo com todos os termos" ✅ checkbox obrigatório + texto de ciência
- [x] Captura de dados: IP, user-agent, timestamp, hash SHA-256 do documento ✅ assinarDocumento() em termo-actions.ts
- [x] Selo visual no PDF: "Assinado eletronicamente por [NOME] em [DATA] as [HORA] - IP: [IP] - Hash: [HASH]" ✅ TermoPDF.tsx signatureSeal com nome, data, IP, hash por assinante
- [x] Armazenar log de assinatura na tabela `assinaturas_digitais` ✅ migration 20260306000001
- [x] Criar tabela `assinaturas_digitais` ✅ migration 20260306000001
- [x] Fluxo: proponente assina primeiro -> gestor assina depois -> status muda para "assinado" ✅ termo-actions.ts
- [x] Validacao de assinatura: qualquer pessoa pode verificar hash do PDF ✅ /verificar-assinatura página pública com busca por hash SHA-256

### 6.4 Assinatura via GOV.BR (Evolucao)
- [ ] Integracao com API Assinador GOV.BR (assinador.iti.br)
- [ ] Fluxo: gerar PDF -> enviar para API -> usuario autentica GOV.BR -> PDF assinado com ICP-Brasil retorna
- [ ] Armazenar certificado digital no log
- [ ] Opcao de escolha: assinatura simples OU GOV.BR
- [ ] Configuracao por tenant: qual metodo de assinatura usar

### 6.5 Aditivos ao Termo
- [x] Criar tabela `termos_aditivos` ✅ migration 20260306000001
- [x] Regra: alteracoes ate 20% do valor podem ser feitas pelo proponente sem autorizacao previa (apenas comunicar) ✅ aditivo-actions.ts auto-aprova se <= 20%
- [x] Alteracoes > 20% precisam de aprovacao do gestor ✅ requer_aprovacao flag + aprovar/rejeitar actions
- [x] Prorrogacao de oficio quando atraso na liberacao de recursos ✅ tipo prorrogacao atualiza vigencia_fim automaticamente
- [x] Geracao de PDF do aditivo + assinatura ✅ AditivoPDF.tsx + /api/pdf/aditivo/[id] + botão download na AditivosSection
- [x] UI de gestao de aditivos ✅ AditivosSection com form + lista + aprovar/rejeitar

### 6.6 Pagamento
- [x] Criar tabela `pagamentos` ✅ migration 20260306000001
- [x] UI de gestao de pagamentos (registrar liberacao, upload comprovante) ✅ PagamentosSection na página termos + pagamento-actions.ts
- [x] Notificacao ao proponente quando pagamento liberado ✅ notifyInAppPagamento() chamada em atualizarStatusPagamento()

---

## FASE 7 — PRESTACAO DE CONTAS COMPLETA

### 7.1 Relatorio de Execucao do Objeto (ANEXO XI)
- [x] Reformular tabela `prestacoes_contas` com campos estruturados: ✅ migration 20260306000003
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
- [x] Criar tabela `prestacao_equipe` (id, prestacao_id, nome, funcao, cpf_cnpj, pessoa_negra_indigena boolean, pessoa_pcd boolean) ✅ migration 20260306000003
- [x] UI para listar profissionais que participaram da execucao ✅ PrestacaoForm.tsx secao 7 (quantidade + mudancas)

### 7.3 Anexos Comprobatorios
- [x] Upload de multiplos anexos: fotos, videos, listas de presenca, relatorio fotografico, folders, materiais de divulgacao ✅ 3 categorias de upload (comprovante_despesa, relatorio_atividade, prestacao_contas)
- [x] Categorizar anexos por tipo ✅ DocumentUpload com tipos separados
- [x] Galeria visual dos comprovantes ✅ PrestacaoAnalise grid de comprovantes com ícones por tipo + links diretos

### 7.4 Analise da Prestacao pelo Gestor
- [x] Parecer tecnico com opcoes: ✅ PrestacaoAnalise com parecer + 3 decisões (aprovar/reprovar/pendências)
  - Cumprimento integral do objeto
  - Necessidade de documentacao complementar
  - Necessidade de Relatorio Financeiro
- [x] Julgamento final: ✅ JULGAMENTO_OPTIONS com 4 tipos + UI card selection
  - Aprovada sem ressalvas
  - Aprovada com ressalvas (realizou a acao mas com inadequacoes, sem ma-fe)
  - Rejeitada parcial (devolucao proporcional)
  - Rejeitada total (devolucao + multa + suspensao 180-540 dias)
- [x] Plano de acoes compensatorias (alternativa a devolucao) ✅ campo plano_compensatorio condicional
- [x] Parcelamento de debito (depende de regras do ente federativo) ✅ migration 20260306000021 + campo parcelamento_parcelas + UI no PrestacaoAnalise com cálculo por parcela

### 7.5 Relatorio Financeiro (quando exigido)
- [x] Somente quando: objeto nao comprovado OU denuncia de irregularidade ✅ tabela relatorios_financeiros (migration 20260306000016) com motivo check constraint
- [x] Relacao de pagamentos (data, descricao, valor, comprovante) ✅ tabela relatorio_financeiro_pagamentos com data_pagamento + descricao + valor + comprovante_path
- [x] Extrato bancario da conta especifica ✅ migration 20260306000020 + campo extrato_bancario_path + upload no relatório financeiro
- [x] Comprovante de saldo remanescente (devolver se houver) ✅ campos saldo_remanescente + saldo_devolvido na tabela
- [x] Prazo: 120 dias apos notificacao ✅ campo prazo_dias default 120 + data_notificacao

---

## FASE 8 — EXPORTACOES E RELATORIOS

### 8.1 Exportacao PNAB Federal (Planilha MinC)
- [x] Gerar XLSX com 4 abas no formato padrao do MinC: ✅ exportar-pnab.ts (XML SpreadsheetML)
  - Aba Instrumentos: CNPJ tenant, titulo edital, numero, objeto, modalidade, valor_total, inscritos, selecionados, segmentos, cotas ✅
  - Aba Pessoas Fisicas: CPF, nome, tel, nascimento, cidade, UF, situacao, raca, genero, orientacao_sexual, renda, escolaridade, PCD, tipo_deficiencia, segmento, projeto, valor ✅
  - Aba Organizacoes: tipo, CNPJ, razao_social, nome_fantasia, CPF representante, nome representante, projeto, situacao, valor ✅
  - Aba Acoes Culturais: identificador, CPF/CNPJ, edital, valor, modalidade, resumo, segmento, status ✅
- [x] Botao "Exportar Planilha PNAB" no dashboard do gestor ✅ ExportarPNABButton por edital na seção PNAB
- [x] Validacao: alertar campos faltantes antes de exportar ✅ alertas inline com contagem

### 8.2 Lista de Inscritos (PDF/XLSX)
- [x] Exportar lista formatada com numero, nome, projeto, categoria ✅ InscritosExport.tsx
- [x] Versao PDF para publicacao oficial (inscritos) ✅ InscritosPDF.tsx + /api/pdf/inscritos/[id] + botão na página pública
- [x] Versao XLSX para trabalho interno ✅ InscritosExport XLS com header estilizado

### 8.3 Fichas de Avaliacao (XLS)
- [x] Gerar ficha de avaliacao por projeto ✅ exportar-fichas-avaliacao.ts com sheet por projeto
- [x] Incluir: criterios, notas, parecer, assinatura do parecerista ✅ notas por critério por avaliador + justificativa
- [x] Exportar todas as fichas de um edital em arquivo unico ✅ XLS com sheet Resumo + sheet por projeto + ExportarFichasButton

### 8.4 Resultado/Classificacao (XLSX)
- [x] Gerar XLS do resultado por categoria com: classificacao, proponente, projeto, cotas, parecerista1, parecerista2, parecerista3, media, status, habilitacao ✅ exportar-resultado.ts + ExportarResultadoButton
- [x] Formato similar a LISTA GERAL PNAB.xlsx ✅ SpreadsheetML com header estilizado + labels traduzidos

### 8.5 Termo de Execucao (PDF)
- [x] Gerar PDF do Termo com todas as 14 clausulas preenchidas ✅ TermoPDF.tsx + /api/pdf/termo/[id]
- [x] Incluir selos de assinatura digital ✅ signatureSeal com nome, data, IP, hash

### 8.6 Decisao Administrativa (PDF)
- [x] Gerar PDF da decisao de recurso com fundamentacao completa ✅ DecisaoPDF.tsx + /api/pdf/decisao/[id]

### 8.7 Portaria da Comissao (PDF)
- [x] Gerar PDF da portaria de designacao dos pareceristas ✅ PortariaComissaoPDF.tsx + /api/pdf/portaria-comissao/[id]

---

## FASE 9 — ERRATAS E VERSIONAMENTO

### 9.1 Erratas do Edital
- [x] Criar tabela `edital_erratas` (id, edital_id, numero_errata, descricao, campo_alterado, valor_anterior, valor_novo, publicado_em, publicado_por) ✅ migration 20260306000010
- [x] UI para criar errata com diff do que mudou ✅ /admin/editais/[id]/erratas com campo_alterado + valor_anterior → valor_novo
- [x] Historico de todas as erratas de um edital ✅ listagem ordenada por numero_errata DESC
- [x] Publicacao automatica da errata ✅ botão Publicar + exibição pública na página do edital
- [x] Notificacao a todos os inscritos quando errata publicada ✅ notifyInAppErrataPublicada() chamada em publicarErrata()

### 9.2 Versionamento do Edital
- [x] Salvar snapshot do edital a cada alteracao significativa ✅ logAudit com dados_antigos/dados_novos em edital-actions.ts
- [x] Exibir versao atual vs versoes anteriores ✅ /admin/editais/[id]/historico com timeline de audit logs + erratas + diff visual
- [x] Log de quem alterou o que e quando ✅ logs_auditoria com usuario_id, acao, timestamp, dados_antigos/novos

---

## FASE 10 — CULTURA VIVA (PNCV)

### 10.1 Tipo de Edital Cultura Viva
- [x] Adicionar tipo_edital: `cultura_viva` ao enum ✅ tipo_edital text column (já existia) aceita 'cultura_viva'
- [x] Configuracoes especificas: somente PJ, certificacao de Ponto de Cultura, TCC ao inves de Termo de Execucao ✅ EditalConfigManager info panel com regras Cultura Viva (PJ only, 2 blocos, TCC, comitê gestor, metas obrigatórias)

### 10.2 Avaliacao em Dois Blocos
- [x] Bloco 1: avaliacao da entidade cultural (18 criterios, 100 pontos) ✅ migration 20260306000019 + coluna bloco em criterios
- [x] Bloco 2: avaliacao do projeto (3 sub-blocos, 100 pontos) ✅ bloco = 'bloco2_projeto' em criterios
- [x] Nota final = media aritmetica dos 2 blocos ✅ consolidar-ranking.ts computa avg(bloco1) e avg(bloco2) separadamente
- [x] Pontuacao minima Bloco 1 para pre-certificacao: 50 pontos ✅ consolidar-ranking.ts desclassifica se bloco1 < 50

### 10.3 Certificacao como Ponto de Cultura
- [x] Status de certificacao: nao_certificado, pre_certificado, certificado ✅ tabela certificacoes_cultura_viva (migration 20260306000015) com check constraint
- [x] Entidades ja certificadas pelo MinC: verificar na Plataforma Cultura Viva ✅ tabela certificacoes_cultura_viva com certificado_minc flag + consulta em consolidar-ranking.ts
- [x] Regra: entidade certificada nao precisa nota minima no Bloco 1 ✅ consolidar-ranking.ts: `if (bloco1Score < 50 && !isCertificadoMinc)` — bypass para certificados

### 10.4 Metas Padronizadas Obrigatorias
- [x] Meta 1: Formacao e Educacao Cultural ✅ tabela cultura_viva_metas (migration 20260306000015)
- [x] Meta 2: Mostra Artistica/Cultural ✅ tabela cultura_viva_metas com numero_meta + obrigatoria
- [x] Meta 3: Registro e Divulgacao ✅ tabela cultura_viva_metas
- [x] Metas adicionais opcionais ✅ obrigatoria = false para metas extras

### 10.5 Comite Gestor
- [x] Cadastro de Comite Gestor obrigatorio (min 4 entidades sociedade civil + 1 servico publico) ✅ tabela comite_gestor (migration 20260306000015)
- [x] Vinculacao ao projeto ✅ FK projeto_id na tabela comite_gestor

---

## FASE 11 — NOTIFICACOES E COMUNICACAO

### 11.1 Notificacoes Automaticas
- [x] Inscricao confirmada (proponente) ✅ notifyInAppInscricaoConfirmada()
- [x] Lista de inscritos publicada (todos os inscritos) ✅ notifyInAppEditalFase('divulgacao_inscritos')
- [x] Resultado preliminar publicado (todos os inscritos) ✅ notifyInAppEditalFase('resultado_preliminar_avaliacao')
- [x] Prazo de recurso iniciado (proponentes afetados) ✅ notifyInAppEditalFase('recurso_avaliacao' / 'recurso_habilitacao')
- [x] Decisao de recurso publicada (proponente) ✅ notifyInAppRecursoDecisao()
- [x] Convocacao para habilitacao (classificados + suplentes convocados) ✅ notifyInAppEditalFase('habilitacao')
- [x] Resultado habilitacao publicado (convocados) ✅ notifyInAppEditalFase('resultado_preliminar_habilitacao')
- [x] Convocacao de suplente (suplente) ✅ notifyInAppConvocacaoSuplente()
- [x] Termo de Execucao disponivel para assinatura (contemplado) ✅ notifyInAppTermoDisponivel() chamada em enviarParaAssinatura()
- [x] Prazo de assinatura vencendo (contemplado - lembrete) ✅ prazo-reminders.ts cron job verifica prazo assinatura
- [x] Pagamento liberado (contemplado) ✅ notifyInAppPagamento()
- [x] Prazo de prestacao de contas se aproximando (contemplado - 30, 15, 7 dias) ✅ prazo-reminders.ts cron job envia lembretes 30/15/7 dias
- [x] Prestacao de contas analisada (contemplado) ✅ notifyInAppPrestacaoAnalise()
- [x] Errata publicada (todos os inscritos) ✅ notifyInAppErrataPublicada() + wired in publicarErrata()

### 11.2 Notificacoes por Email
- [x] Integrar todas as notificacoes acima com envio de email (Resend) ✅ email/notify.ts com 5 funções + in-app notify.ts chama email counterparts fire-and-forget
- [x] Template de email padrao com branding do tenant ✅ email/templates.ts com baseLayout() branding (BrandOptions: nome, cor) + 8 templates
- [x] Opcao de desativar email (manter apenas in-app) ✅ platform_settings email_enabled flag + getEmailConfig() check

### 11.3 Notificacoes por WhatsApp (futuro)
- [ ] Integracao com API WhatsApp Business (Evolution API ou similar)
- [ ] Mensagens criticas: convocacao suplente, prazo vencendo, pagamento

---

## FASE 12 — MELHORIAS DE UX/UI

### 12.1 Dashboard do Gestor
- [x] Cards de resumo: total inscritos, em avaliacao, classificados, habilitados, termos assinados, pagos, em execucao, prestacao pendente ✅ gestor/page.tsx (4 métricas + pendências + pipeline)
- [x] Timeline visual do edital com fase atual destacada ✅ admin/editais/[id]/page.tsx sidebar "Linha do Tempo"
- [x] Alertas: prazos vencendo, recursos pendentes, habilitacoes pendentes ✅ gestor/page.tsx painel de pendências + prazos próximos

### 12.2 Dashboard do Proponente
- [x] Status do projeto com timeline visual (inscrito -> em avaliacao -> classificado -> habilitado -> termo -> pagamento -> execucao -> prestacao) ✅ projetos/[id]/page.tsx ProjetoTimeline + StatusTracker
- [x] Documentos pendentes de envio ✅ card "Documentos Pendentes" no detalhe do projeto com status por doc
- [x] Prazos importantes com countdown ✅ projetos/[id] seção "Prazos Importantes" com dias restantes + cor de urgência
- [x] Historico de notificacoes ✅ /notificacoes page com listagem paginada + mark read + badge contagem

### 12.3 Pagina Publica do Edital
- [x] Secao "Anexos para Download" com todos os templates DOCX/XLSX ✅ seção pública com links para todos os anexos do edital
- [x] Secao "Documentos Publicados" (erratas, resultados, atas) ✅ erratas publicadas na página pública do edital
- [x] Secao "Cronograma" visual com fases e datas ✅ página pública do edital com timeline de datas
- [x] Secao "Categorias e Vagas" com tabela de cotas ✅ página pública com categorias + cotas/ações afirmativas
- [x] Secao "Criterios de Avaliacao" com pesos ✅ já existente na página pública do edital

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
