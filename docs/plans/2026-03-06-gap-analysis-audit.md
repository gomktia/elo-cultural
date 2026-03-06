# AUDITORIA COMPLETA: Elo Cultural vs MIRASSOL + Concorrentes
# Data: 2026-03-06

## Fontes Analisadas
- **MIRASSOL**: Editais PDF (PNAB + Cultura Viva Camaqua), Google Forms (58 cols PNAB, 85 cols PNCV), Anexos I-XII, planilhas, pareceres, decisoes assinadas, listas de inscritos
- **PNAB DF** (pnabdf.org.br): Portal Moodle, FAQ, 4 editais, WhatsApp suporte, VLibras, treinamentos
- **Sistema Baru** (sistemabaru.cultura.go.gov.br): CSS/design system (conteudo nao acessivel via scraping)
- **Festival Neemias Lopes** (festivalneemiaslopes.com.br): Hostinger Horizons (conteudo nao acessivel)
- **LPGSC** (lpgsc2023.fepese.org.br): Angular, speech accessibility

---

## RESUMO: O QUE JA TEMOS (PONTOS FORTES vs Concorrentes)

### Superioridades do Elo Cultural
1. **Motor de cotas inteligente** - Nenhum concorrente tem dual-track allocation automatico
2. **Ranking automatizado** - Consolidacao com desempate, desclassificacao, cotas, suplentes
3. **PDF generation completa** - Termo, decisao, portaria, inscritos, aditivo (concorrentes usam Google Drive/manual)
4. **Assinatura digital integrada** - SHA-256 + verificacao publica (concorrentes usam assinatura manual em PDF)
5. **Triagem por IA** - Nenhum concorrente tem screening automatico
6. **Multi-tenant SaaS** - Concorrentes sao single-city (nosso e plataforma para N municipios)
7. **Prestacao de contas estruturada** - 9 secoes do ANEXO XI digitalizadas (concorrentes usam Google Forms/planilha)
8. **LGPD compliance** - Exportacao dados + solicitacao exclusao (nao visto em nenhum concorrente)
9. **Transparencia API** - Endpoints REST publicos (/api/transparencia/)
10. **Mapa Cultural + Indicadores** - Visualizacao geografica (nao visto em concorrentes)
11. **Notificacoes dual** - In-app + email com 8 templates (PNAB DF usa apenas WhatsApp manual)
12. **Versionamento/historico** - Audit trail completo (concorrentes nao tem)
13. **Exportacao PNAB Federal** - 4 abas no formato MinC (automatizado vs manual)
14. **Deferimento parcial** - Workflow revisao por criterio (nao visto em concorrentes)
15. **Formulario inscricao 4 etapas** - Equipe + orcamento + cronograma estruturados (concorrentes usam Google Forms)
16. **Gov.br OAuth** - Login federado (PNAB DF tem login simples)
17. **Recibo de inscricao PDF** - Comprovante automatico (concorrentes nao tem)

---

## GAPS IDENTIFICADOS (Melhorias Necessarias)

### PRIORIDADE ALTA (Impacto direto no usuario)

#### GAP-01: Pagina de FAQ / Perguntas Frequentes
- **O que falta**: Nao temos pagina publica de FAQ
- **Referencia**: PNAB DF tem FAQ expandivel ("O que e PNAB?", "Quem pode participar?", etc.)
- **Impacto**: Proponentes ficam sem respostas rapidas, sobrecarrega suporte
- **Sugestao**: Criar /faq com accordion de perguntas, editavel pelo gestor por edital
- **Complexidade**: Baixa

#### GAP-02: Widget VLibras (Acessibilidade em Libras)
- **O que falta**: Nao temos acessibilidade em Libras
- **Referencia**: PNAB DF integra VLibras (tradutor automatico para Libras). LPGSC tem pageSpeech
- **Impacto**: Obrigatorio por lei para sites governamentais (Decreto 5.296/2004). Nosso sistema e usado por prefeituras
- **Sugestao**: Adicionar widget VLibras (vlibras.gov.br) - e um script/iframe do governo
- **Complexidade**: Muito baixa (copy/paste de script)

#### GAP-03: Pagina de Contato / Suporte
- **O que falta**: Sem pagina publica de contato ou link de suporte
- **Referencia**: PNAB DF tem WhatsApp, email SAC, e "Atendimento Online"
- **Impacto**: Proponentes sem canal de duvidas
- **Sugestao**: Criar /contato com form e/ou configuracao de WhatsApp/email por tenant
- **Complexidade**: Baixa

#### GAP-04: Busca e Filtros na Listagem de Editais
- **O que falta**: /editais nao tem busca, filtro por status, categoria, ou data
- **Referencia**: Todos os concorrentes organizam editais por tipo/status
- **Impacto**: Quando houver muitos editais, sera dificil encontrar o desejado
- **Sugestao**: Adicionar barra de busca + filtros (status, categoria, periodo)
- **Complexidade**: Baixa

#### GAP-05: Editais Encerrados / Historico Publico
- **O que falta**: /editais mostra apenas `publicacao` e `inscricao`. Editais encerrados somem
- **Referencia**: PNAB DF mantem todos os editais visiveis com status diferente
- **Impacto**: Transparencia - publico precisa consultar editais antigos e seus resultados
- **Sugestao**: Adicionar aba "Encerrados" ou filtro para mostrar editais em qualquer fase
- **Complexidade**: Muito baixa

#### GAP-06: Jornada do Proponente (Onboarding Visual)
- **O que falta**: "Como Funciona" tem 3 steps genericos. Falta jornada detalhada
- **Referencia**: PNAB DF tem "Jornada do Proponente": 4 etapas (Inscricao > Selecao > TCC/Plano > Execucao/Contas) com descricao de cada
- **Impacto**: Proponentes novatos nao entendem o processo completo
- **Sugestao**: Expandir "Como Funciona" com 6-8 etapas detalhadas + ilustracoes
- **Complexidade**: Baixa

### PRIORIDADE MEDIA (Funcionalidade importante)

#### GAP-07: Cultura Viva - Formulario Especifico da Entidade
- **O que falta**: O Google Forms do PNCV tem 85 colunas com 25+ perguntas de alinhamento filosofico da entidade (preservacao cultural, economia solidaria, gestao compartilhada, etc.). Nosso InscricaoForm nao tem essas perguntas
- **Referencia**: MIRASSOL PNCV Google Forms: "Exploração de espaços públicos", "Visibilidade de iniciativas culturais", "Diversidade cultural", "Inclusão de idosos/mulheres/LGBTQIA+", "Autonomia social", "Patrimônio imaterial", etc.
- **Impacto**: Para editais Cultura Viva, a avaliacao do Bloco 1 (entidade) precisa desses dados
- **Sugestao**: Quando tipo_edital = cultura_viva, mostrar secao extra no InscricaoForm com as perguntas de alinhamento, historico da entidade, publicos atendidos, eixos estruturantes
- **Complexidade**: Media

#### GAP-08: Secao "Legislacao" Publica
- **O que falta**: Nao linkamos legislacao relevante (Lei 14.903/2024, Decreto 11.453/2023)
- **Referencia**: PNAB DF tem link direto para legislacao
- **Impacto**: Proponentes e gestores precisam consultar base legal
- **Sugestao**: Adicionar secao no footer ou pagina /legislacao com links para leis federais + municipais (configuravel por tenant)
- **Complexidade**: Muito baixa

#### GAP-09: Importacao de Certificados Cultura Viva
- **O que falta**: Temos tabela certificacoes_cultura_viva mas nao temos UI de importacao em lote (upload XLSX)
- **Referencia**: MIRASSOL tem "rcv-planilha-de-importacao-editais-certificadores" com template XLSX para importar Pontos de Cultura certificados
- **Impacto**: Gestores precisam importar lista de entidades ja certificadas pelo MinC
- **Sugestao**: Admin UI para upload do XLSX de certificacoes + parser server-side
- **Complexidade**: Media

#### GAP-10: Planilha Multi-Sheet de Resultados
- **O que falta**: Nosso export de resultado e single-sheet. MIRASSOL usa 14 sheets (classificacao preliminar, resultado etapa, habilitacao, suplentes 1a-4a chamada)
- **Referencia**: "LISTA DE INSCRITOS PNAB CAMAQUA.xlsx" com 14 abas rastreando diferentes etapas
- **Impacto**: Gestores querem ter tudo em um unico arquivo
- **Sugestao**: Expandir exportar-resultado.ts para gerar multi-sheet: Ranking, Habilitacao, Suplentes por chamada, Resumo
- **Complexidade**: Media

#### GAP-11: Notificacao por WhatsApp (Config Simplificada)
- **O que falta**: WhatsApp esta listado como "futuro" mas PNAB DF ja usa extensivamente para suporte
- **Referencia**: PNAB DF: WhatsApp para SAC + grupo comunitario + notificacoes criticas
- **Impacto**: WhatsApp e o canal preferido no Brasil. Email tem baixa taxa de abertura
- **Sugestao**: Pelo menos adicionar campo "whatsapp_suporte" no tenant para exibir no footer/contato. Integracao completa fica para depois
- **Complexidade**: Muito baixa (campo config) / Alta (integracao Evolution API)

#### GAP-12: Treinamentos / Materiais de Apoio
- **O que falta**: Nao temos secao de treinamento ou tutoriais
- **Referencia**: PNAB DF tem videos YouTube, plantao tira-duvidas, PDFs de capacitacao
- **Impacto**: Proponentes e gestores novatos precisam de orientacao
- **Sugestao**: Secao /treinamentos com links para videos + docs, editavel pelo tenant. Ou seção "Materiais de Apoio" na pagina do edital
- **Complexidade**: Baixa

### PRIORIDADE BAIXA (Nice to have)

#### GAP-13: Dark Mode / Tema Claro-Escuro
- **O que falta**: Sem toggle de tema
- **Impacto**: Acessibilidade + preferencia do usuario
- **Complexidade**: Media

#### GAP-14: PWA / App-like Experience
- **O que falta**: Sem manifest.json ou service worker
- **Impacto**: Usuarios mobile poderiam "instalar" o app
- **Complexidade**: Baixa

#### GAP-15: Notificacoes Push (Browser)
- **O que falta**: Sem Web Push notifications
- **Impacto**: Proponentes nao recebem alertas em tempo real
- **Complexidade**: Media

#### GAP-16: Multi-idioma
- **O que falta**: Apenas portugues
- **Impacto**: Baixo para mercado brasileiro, mas bom para acessibilidade (imigrantes)
- **Complexidade**: Alta

---

## VERIFICACAO DOS CAMPOS MIRASSOL vs SISTEMA

### Campos do Google Forms PNAB (58 colunas) - Status no Elo Cultural

| Campo | Status | Onde |
|-------|--------|------|
| Nome Completo | OK | profiles.nome |
| Nome Artistico | OK | profiles.nome_artistico |
| CPF | OK | profiles.cpf_cnpj |
| RG | OK | profiles.rg |
| CNPJ (MEI) | OK | profiles.cpf_cnpj |
| Data Nascimento | OK | profiles.data_nascimento |
| Email | OK | auth.users.email |
| Telefone | OK | profiles.telefone |
| Endereco completo | OK | profiles.endereco + municipio + estado + cep |
| Comunidade Tradicional | OK | profiles.comunidade_tradicional |
| Genero | OK | profiles.genero |
| Raca/Cor/Etnia | OK | profiles.raca_etnia |
| PCD + tipo deficiencia | OK | profiles.pcd + tipo_deficiencia |
| Concorrencia cota | OK | projetos.concorre_cota + tipo_cota |
| Escolaridade | OK | profiles.escolaridade |
| Renda mensal | OK | profiles.renda |
| Beneficiario programa social | OK | profiles.beneficiario_programa_social |
| Funcao cultural | OK | profiles.funcao_cultural |
| Orientacao sexual | OK | profiles.orientacao_sexual |
| Tipo pessoa (PF/PJ/Coletivo) | OK | profiles.tipo_pessoa |
| Dados PJ (razao social, etc.) | OK | profiles.razao_social, nome_fantasia, etc. |
| Dados coletivo (membros) | OK | coletivos + coletivo_membros |
| Nome do projeto | OK | projetos.titulo |
| Areas culturais | OK | projetos.areas_projeto |
| Minicurriculo | OK | projetos.minicurriculo_proponente |
| Categoria | OK | projetos.categoria_id |
| Descricao projeto | OK | projetos.descricao |
| Objetivos | OK | projetos.objetivos |
| Metas | OK | projetos.metas |
| Perfil publico | OK | projetos.perfil_publico |
| Publico prioritario | OK | projetos.publico_prioritario |
| Acessibilidade | OK | projetos.acessibilidade (JSONB) |
| Local execucao | OK | projetos.local_execucao |
| Periodo execucao | OK | projetos.periodo_execucao_inicio/fim |
| Equipe | OK | projeto_equipe |
| Estrategia divulgacao | OK | projetos.estrategia_divulgacao |
| Outras fontes recurso | OK | projetos.outras_fontes_recurso |
| Venda produtos/ingressos | OK | projetos.venda_produtos_ingressos |
| Contrapartida social | OK | projetos.contrapartida_social |
| Planilha orcamentaria | OK | projeto_orcamento_itens |
| Cronograma | OK | projeto_cronograma |
| Upload documentos | OK | projeto_documentos |

**Resultado: 100% dos campos PNAB estao cobertos**

### Campos Extras do Google Forms Cultura Viva (85 colunas)

| Campo | Status | Observacao |
|-------|--------|------------|
| Razao Social (obrigatorio PJ) | OK | profiles.razao_social |
| Pagina internet/redes sociais | FALTA | Nao temos campo para URL de site/redes sociais |
| Ja certificado pelo MinC? | OK | certificacoes_cultura_viva.certificado_minc |
| Inscricao na plataforma Cultura Viva? | PARCIAL | Temos tabela mas nao campo especifico "inscrito_plataforma" |
| Representante legal (18 campos) | OK | profiles.representante_* |
| Tempo de atuacao no setor | FALTA | Nao temos campo especifico |
| Espacos/recursos suficientes? | FALTA | Perguntas qualitativas da entidade |
| Principais desafios | FALTA | Pergunta qualitativa |
| 25+ perguntas de alinhamento | FALTA | Ver GAP-07 |
| Historico de editais | FALTA | Nao rastreamos editais anteriores da entidade |
| Capacidade de gestao | FALTA | Pergunta qualitativa |

**Resultado: ~70% coberto. Faltam campos qualitativos especificos de Cultura Viva**

---

## PLANO DE ACAO RECOMENDADO

### Sprint 1 (Impacto Alto, Esforco Baixo) — ~2-3 dias
- [ ] GAP-02: Widget VLibras (1 linha de script no layout)
- [ ] GAP-04: Busca/filtros na listagem de editais
- [ ] GAP-05: Mostrar editais encerrados (filtro simples)
- [ ] GAP-08: Links de legislacao no footer
- [ ] GAP-11: Campo whatsapp_suporte no tenant + exibir no footer

### Sprint 2 (Impacto Alto, Esforco Medio) — ~3-4 dias
- [ ] GAP-01: Pagina FAQ com accordion (configuravel por tenant/edital)
- [ ] GAP-03: Pagina de contato
- [ ] GAP-06: Jornada do proponente expandida
- [ ] GAP-12: Secao materiais de apoio

### Sprint 3 (Funcionalidade Especifica) — ~3-4 dias
- [ ] GAP-07: Formulario Cultura Viva (secao alinhamento + historico entidade)
- [ ] GAP-09: Importacao certificados XLSX
- [ ] GAP-10: Export resultado multi-sheet

### Futuro
- [ ] GAP-13: Dark mode
- [ ] GAP-14: PWA
- [ ] GAP-15: Push notifications
- [ ] GAP-16: Multi-idioma
