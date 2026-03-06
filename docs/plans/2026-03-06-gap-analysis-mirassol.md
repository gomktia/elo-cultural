# Gap Analysis: MIRASSOL Documents vs Elo Cultural System

## Summary

After reading ALL documents in the MIRASSOL folder (editais PNAB/Cultura Viva, fichas de avaliacao, lista de inscritos, decisoes assinadas, recursos, termos de execucao, prestacao de contas, anexos I-XII), here is a comprehensive comparison of what the real-world edital workflow requires vs what the system currently supports.

---

## WHAT THE SYSTEM ALREADY HAS (Covered)

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenant architecture | OK | Each prefeitura = 1 tenant |
| Edital CRUD (criar, editar, publicar) | OK | Tipos: fomento, premiacao, etc. |
| Cronograma com fases | OK | 16 fases no enum fase_edital |
| Categorias por edital | OK | edital_categorias com vagas |
| Criterios de avaliacao configuráveis | OK | criterios com peso, nota_min, nota_max |
| Inscricao online (formulario dinamico) | OK | edital_campos_inscricao + campos_extras JSONB |
| Upload de documentos | OK | projeto_documentos com tipos |
| Avaliacao por pareceristas | OK | avaliacoes + avaliacao_criterios |
| Sistema de recursos/apelacoes | OK | recursos com tipo habilitacao/avaliacao |
| Habilitacao de projetos | OK | status_habilitacao em projetos |
| Ranking/classificacao | OK | nota_final + ranking page |
| Publicacoes oficiais | OK | publicacoes com tipos flexíveis |
| Prestacao de contas basica | OK | prestacoes_contas com status |
| Triagem IA | OK | triagem_ia_* tables |
| Notificacoes | OK | notificacoes table + bell component |
| Auditoria/logs | OK | logs_auditoria (LAI compliance) |
| LGPD (export/exclusao) | OK | API endpoints |
| Transparencia publica | OK | Public routes + API |
| Login GOV.BR | OK | OAuth integration |

---

## GAPS IDENTIFIED (Missing or Incomplete)

### PRIORITY 1 - CRITICAL (Core workflow gaps)

#### 1.1 Sistema de Cotas e Reserva de Vagas
**Documento:** Edital PNAB sections 5.4-5.7 + LISTA GERAL PNAB.xlsx
**Realidade:** Cotas para PCDs, Pessoas Negras, Indigenas + Reserva 20% Areas Perifericas
**Sistema atual:** `config_cotas` (JSONB) existe no schema mas NAO tem UI/logica de:
- Distribuicao automatica de vagas por cota dentro de cada categoria
- Remanejamento de vagas nao preenchidas (cotas -> ampla concorrencia)
- Classificacao separada por cota (ex: "CLASSIFICADO - COTA PESSOAS NEGRAS")
- Validacao se proponente declarou cota no formulario
**Impacto:** A planilha LISTA GERAL mostra classificacao complexa com 4 chamadas de suplentes, remanejamento entre categorias

#### 1.2 Sistema de Multiplos Pareceristas por Projeto
**Documento:** 3 pareceristas por projeto, media das 3 notas = nota final
**Sistema atual:** avaliacoes table suporta multiplos avaliadores, MAS falta:
- Configuracao de quantos pareceristas por edital (default 3)
- Atribuicao automatica/manual de N pareceristas por projeto
- Calculo automatico da media (LISTA GERAL mostra: Parecerista 1 | Parecerista 2 | Parecerista 3 | Media Final)
- Visualizacao comparativa das notas dos 3 pareceristas
- Deteccao de discrepancia entre notas (ex: 114 vs 55 no mesmo projeto)
**Impacto:** Fundamental para o processo de avaliacao PNAB

#### 1.3 Termo de Execucao Cultural (Contrato)
**Documento:** ANEXO X - 14 clausulas, assinatura digital, dados bancarios
**Sistema atual:** NAO existe tabela nem UI para:
- Geracao do Termo de Execucao Cultural (template preenchido automaticamente)
- Dados bancarios do agente cultural (banco, agencia, conta)
- Assinatura digital do termo
- Controle de prazo para assinatura (2 dias uteis)
- Status do termo (pendente_assinatura, assinado, vigente, encerrado)
- Vigencia do termo (7-10 meses + prorrogacao)
- Aditivos ao termo (alteracoes ate 20% sem autorizacao)
**Impacto:** Etapa obrigatoria entre aprovacao e pagamento

#### 1.4 Relatorio de Execucao do Objeto (Prestacao de Contas Completa)
**Documento:** ANEXO XI - 9 secoes detalhadas
**Sistema atual:** prestacoes_contas tem apenas campos basicos (resumo_atividades, valor_executado, observacoes). Falta:
- Campos estruturados: acoes_realizadas (sim/com_adaptacoes/parcial/nao)
- Metas cumpridas/parciais/nao_cumpridas com justificativas
- Produtos gerados (publicacao, video, show, etc.) com quantidades
- Publico alcancado (quantidade + mecanismo de mensuracao)
- Equipe do projeto (profissionais, funcao, CPF, pessoa_negra, PCD)
- Locais de realizacao (presencial/virtual/hibrido)
- Plataformas virtuais utilizadas
- Divulgacao do projeto
- Anexos comprobatorios (fotos, listas presenca, videos)
**Impacto:** Obrigatorio pela Lei 14.903/2024

#### 1.5 Planilha PNAB Federal (Dados para Ministerio da Cultura)
**Documento:** modelo-de-planilha-de-dados-pnab.xlsx - 6 abas
**Sistema atual:** NAO existe exportacao no formato PNAB federal. Precisa gerar:
- Aba Instrumentos: dados do edital (CNPJ, titulo, valores, segmentos, cotas)
- Aba Pessoas Fisicas: dados demograficos completos de cada contemplado
- Aba Organizacoes: dados de PJ/coletivos
- Aba Acoes Culturais: dados de cada projeto (valor, modalidade, segmentos)
**Impacto:** Obrigacao federal - municipio precisa reportar ao MinC

---

### PRIORITY 2 - IMPORTANT (Funcionalidades de gestao)

#### 2.1 Lista de Inscritos Publica
**Documento:** LISTA DE INSCRITOS PNAB CAMAQUA.xlsx/pdf
**Sistema atual:** Fase "divulgacao_inscritos" existe no enum mas falta:
- Pagina publica com lista de inscritos (nome, projeto, categoria)
- Exportacao da lista em PDF/XLSX
- Periodo de impugnacao/recurso pos-divulgacao

#### 2.2 Comissao de Avaliacao
**Documento:** COMISSAO EDITAL FOMENTO PNAB.docx - portaria de designacao
**Sistema atual:** NAO existe cadastro da comissao de avaliacao:
- Dados dos pareceristas (nome, CPF, qualificacao)
- Portaria de designacao
- Declaracao de impedimento/suspeicao
- Publicacao da composicao da comissao

#### 2.3 Decisao Administrativa de Recurso (Template)
**Documento:** PAOLA_LUCENA decisao assinada - documento juridico completo
**Sistema atual:** recursos table tem campo "decisao" (texto livre) mas falta:
- Template estruturado da decisao (fundamentacao juridica)
- Devolucao de pareceres para revisao (deferimento parcial)
- Assinatura digital da decisao
- Publicacao da decisao no diario oficial
- Workflow: recurso -> analise -> devolver parecer -> reavaliacao -> decisao final

#### 2.4 Erratas do Edital
**Documento:** ERRATA 03 - retificacao do cronograma
**Sistema atual:** NAO existe mecanismo de errata:
- Historico de alteracoes do edital
- Publicacao formal de erratas
- Versionamento do edital

#### 2.5 Chamadas Suplementares (Suplentes)
**Documento:** LISTA GERAL mostra 4 chamadas de suplentes
**Sistema atual:** NAO existe workflow de convocacao de suplentes:
- Lista de suplentes por categoria
- Convocacao automatica quando titular e inabilitado
- Historico de chamadas (1a, 2a, 3a, 4a chamada)
- Status: SUPLENTE CONVOCADO / INABILITADO / etc.

#### 2.6 Planilha Orcamentaria do Projeto
**Documento:** ANEXO II - tabela com Item, Unidade, Quantidade, Valor Unitário, Valor Total
**Sistema atual:** projetos.orcamento_total (apenas valor total). Falta:
- Itens detalhados (producao, divulgacao, acessibilidade)
- Calculo automatico por rubrica
- Validacao: soma itens = orcamento total
- Outras fontes de financiamento

#### 2.7 Cronograma de Execucao do Projeto
**Documento:** ANEXO III - Pre-producao, Divulgacao, Producao, Pos-producao
**Sistema atual:** projetos.cronograma_execucao (campo texto). Falta:
- Estrutura: etapa + atividade + data_inicio + data_fim
- Categorias: pre-producao, divulgacao, producao, pos-producao
- Visualizacao tipo Gantt ou timeline

---

### PRIORITY 3 - NICE TO HAVE (Melhorias de UX)

#### 3.1 Campos Demograficos Completos no Cadastro
**Documento:** ANEXO I - formulario com 30+ campos demograficos
**Sistema atual:** profiles tem alguns (genero, raca_etnia, pcd, renda) mas falta:
- Comunidade tradicional (Extrativistas, Ribeirinhas, Quilombolas, etc.)
- Tipo de deficiencia (Auditiva, Fisica, Intelectual, Multipla, Visual)
- Beneficiario de programa social (Bolsa Familia, BPC, etc.)
- Principal funcao cultural (Artista, Produtor, Gestor, Tecnico, etc.)
- Orientacao sexual (ja existe no schema)

#### 3.2 Dados de Pessoa Juridica
**Documento:** ANEXO I secao PJ - Razao Social, Nome Fantasia, CNPJ sede, representante legal
**Sistema atual:** profiles.cpf_cnpj (campo unico). Falta para PJ:
- razao_social, nome_fantasia
- endereco_sede
- dados do representante legal (nome, CPF, genero, raca, PCD, escolaridade)
- numero de representantes legais

#### 3.3 Dados de Coletivo sem CNPJ
**Documento:** ANEXO I - Nome coletivo, ano criacao, quantidade membros, lista CPFs
**Sistema atual:** NAO existe cadastro de coletivo:
- nome_coletivo, ano_criacao
- quantidade_membros
- lista de membros (nome + CPF)
- portfolio do coletivo

#### 3.4 Medidas de Acessibilidade
**Documento:** ANEXO I - 3 categorias com checkboxes
**Sistema atual:** NAO existe no formulario de projeto:
- Acessibilidade arquitetonica (rampas, piso tatil, banheiros adaptados, etc.)
- Acessibilidade comunicacional (Libras, Braille, audiodescricao, legendas)
- Acessibilidade atitudinal (capacitacao, contratacao PCD)

#### 3.5 Ficha Tecnica do Projeto
**Documento:** Quadro com Nome, Funcao, CPF, Minicurriculo
**Sistema atual:** NAO existe tabela de equipe do projeto:
- membros da equipe (nome, funcao, CPF/CNPJ, minicurriculo)

#### 3.6 Contrapartida Social
**Documento:** Edital PNAB - contrapartida obrigatoria
**Sistema atual:** NAO existe campo para contrapartida no projeto

#### 3.7 Cultura Viva - Certificacao como Ponto de Cultura
**Documento:** Edital Cultura Viva - pontuacao minima 50 no Bloco 1
**Sistema atual:** NAO existe mecanismo para editais tipo Cultura Viva com:
- Criterios especificos PNCV (18 criterios no Bloco 1)
- Certificacao de Ponto de Cultura
- 3 Metas padronizadas obrigatorias

---

## RESUMO DE PRIORIDADES

### Sprint 1 - Fundacao (Essencial para operacao)
1. Termo de Execucao Cultural (tabela + geracao + assinatura)
2. Sistema de cotas completo (distribuicao + remanejamento)
3. Multiplos pareceristas (configuracao + media + comparativo)
4. Relatorio de Execucao estruturado (ANEXO XI completo)

### Sprint 2 - Gestao (Importante para gestores)
5. Exportacao PNAB federal (planilha MinC)
6. Lista de inscritos publica
7. Comissao de avaliacao (cadastro + portaria)
8. Suplentes e chamadas suplementares
9. Decisao administrativa de recurso (template)

### Sprint 3 - Formularios (Melhoria de dados)
10. Planilha orcamentaria detalhada
11. Cronograma de execucao estruturado
12. Ficha tecnica do projeto (equipe)
13. Medidas de acessibilidade
14. Dados completos PJ/Coletivo

### Sprint 4 - Compliance Federal
15. Erratas de edital
16. Campos demograficos completos
17. Contrapartida social
18. Suporte Cultura Viva (PNCV)
