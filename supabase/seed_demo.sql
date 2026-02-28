-- =============================================
-- SEED: Dados realistas para demo ao vivo
-- Prefeitura fictícia do Paraná
-- Execute com service_role (bypassa RLS)
-- =============================================

-- 0. Limpar dados antigos do demo (idempotente)
DELETE FROM public.publicacoes WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.recursos WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.avaliacao_criterios WHERE avaliacao_id IN (SELECT a.id FROM public.avaliacoes a JOIN public.tenants t ON a.tenant_id = t.id WHERE t.dominio = 'demo.elocultura.com.br');
DELETE FROM public.avaliacoes WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.criterios WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.projetos WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.edital_fases WHERE edital_id IN (SELECT e.id FROM public.editais e JOIN public.tenants t ON e.tenant_id = t.id WHERE t.dominio = 'demo.elocultura.com.br');
DELETE FROM public.editais WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.profiles WHERE tenant_id IN (SELECT id FROM public.tenants WHERE dominio = 'demo.elocultura.com.br');
DELETE FROM public.tenants WHERE dominio = 'demo.elocultura.com.br';

-- =============================================
-- 1. TENANT: Prefeitura Municipal de Pinhais/PR
-- =============================================
INSERT INTO public.tenants (id, nome, cnpj, dominio, tema_cores, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Prefeitura Municipal de Pinhais',
  '76.105.592/0001-35',
  'demo.elocultura.com.br',
  '{"primary": "#0047AB", "secondary": "#e32a74"}',
  'ativo'
);

-- =============================================
-- 2. PROFILES (sem auth.users - serão linkados manualmente)
-- =============================================

-- Admin
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, orgao_vinculado, funcao_cargo)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Carlos Eduardo Silva',
  '012.345.678-90',
  '(41) 99876-5432',
  'admin',
  true,
  true,
  'Secretaria Municipal de Cultura',
  'Secretário de Cultura'
);

-- Gestor
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, orgao_vinculado, funcao_cargo)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Mariana Oliveira Santos',
  '123.456.789-01',
  '(41) 98765-4321',
  'gestor',
  true,
  true,
  'Fundação Cultural de Pinhais',
  'Coordenadora de Editais'
);

-- Avaliador 1
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, curriculo_descricao, areas_avaliacao)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Prof. Dr. André Luiz Fernandes',
  '234.567.890-12',
  '(41) 99123-4567',
  'avaliador',
  true,
  true,
  'Doutor em Artes Cênicas pela UNESPAR. 15 anos de experiência em avaliação de projetos culturais.',
  ARRAY['teatro', 'dança', 'circo']
);

-- Avaliador 2
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, curriculo_descricao, areas_avaliacao)
VALUES (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000001',
  'Dra. Patrícia Mendes Ribeiro',
  '345.678.901-23',
  '(41) 98234-5678',
  'avaliador',
  true,
  true,
  'Mestre em Música pela UFPR. Parecerista do MinC e FUNARTE.',
  ARRAY['música', 'audiovisual', 'artes visuais']
);

-- Avaliador 3
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, curriculo_descricao, areas_avaliacao)
VALUES (
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000001',
  'João Ricardo Costa',
  '456.789.012-34',
  '(41) 97345-6789',
  'avaliador',
  true,
  true,
  'Especialista em Patrimônio Cultural. Ex-conselheiro do Conselho Estadual de Cultura do Paraná.',
  ARRAY['patrimônio', 'literatura', 'cultura popular']
);

-- Proponente 1
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, areas_atuacao, municipio, estado, genero, raca_etnia)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000001',
  'Associação Cultural Raízes do Paraná',
  '12.345.678/0001-90',
  '(41) 3333-4444',
  'proponente',
  true,
  true,
  ARRAY['música', 'cultura popular'],
  'Pinhais',
  'PR',
  NULL,
  NULL
);

-- Proponente 2
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, areas_atuacao, municipio, estado, genero, raca_etnia)
VALUES (
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000001',
  'Fernanda Beatriz Nascimento',
  '567.890.123-45',
  '(41) 99456-7890',
  'proponente',
  true,
  true,
  ARRAY['teatro', 'dança'],
  'Curitiba',
  'PR',
  'feminino',
  'preta'
);

-- Proponente 3
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, areas_atuacao, municipio, estado, genero, raca_etnia)
VALUES (
  '00000000-0000-0000-0000-000000000032',
  '00000000-0000-0000-0000-000000000001',
  'Coletivo Audiovisual Olho Vivo',
  '23.456.789/0001-01',
  '(41) 98567-8901',
  'proponente',
  true,
  true,
  ARRAY['audiovisual', 'fotografia'],
  'São José dos Pinhais',
  'PR',
  NULL,
  NULL
);

-- Proponente 4
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, areas_atuacao, municipio, estado, genero, raca_etnia)
VALUES (
  '00000000-0000-0000-0000-000000000033',
  '00000000-0000-0000-0000-000000000001',
  'Ricardo Almeida dos Santos',
  '678.901.234-56',
  '(41) 97678-9012',
  'proponente',
  true,
  true,
  ARRAY['literatura', 'artes visuais'],
  'Pinhais',
  'PR',
  'masculino',
  'parda'
);

-- Proponente 5
INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, role, consentimento_lgpd, active, areas_atuacao, municipio, estado, genero, raca_etnia)
VALUES (
  '00000000-0000-0000-0000-000000000034',
  '00000000-0000-0000-0000-000000000001',
  'Instituto Pé de Moleque',
  '34.567.890/0001-12',
  '(41) 3444-5555',
  'proponente',
  true,
  true,
  ARRAY['circo', 'teatro', 'educação'],
  'Colombo',
  'PR',
  NULL,
  NULL
);

-- =============================================
-- 3. EDITAL 1: Em fase de avaliação (avaliacao_tecnica)
-- =============================================
INSERT INTO public.editais (id, tenant_id, numero_edital, titulo, descricao, status, inicio_inscricao, fim_inscricao, active, versao)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  '001/2026',
  'Edital de Fomento à Cultura - Lei Paulo Gustavo',
  'Seleção pública de projetos culturais para fomento com recursos da Lei Complementar nº 195/2022 (Lei Paulo Gustavo), voltada ao fortalecimento da cadeia produtiva cultural do município de Pinhais/PR. O presente edital contempla as áreas de audiovisual, música, teatro, dança, circo, artes visuais, literatura e patrimônio cultural, com ações de formação, difusão, produção e preservação da memória cultural.',
  'avaliacao_tecnica',
  '2026-01-15T00:00:00Z',
  '2026-02-15T23:59:59Z',
  true,
  1
);

-- Fases do Edital 1
INSERT INTO public.edital_fases (edital_id, fase, data_inicio, data_fim, bloqueada) VALUES
  ('00000000-0000-0000-0000-000000000100', 'criacao', '2026-01-01', '2026-01-10', false),
  ('00000000-0000-0000-0000-000000000100', 'publicacao', '2026-01-10', '2026-01-14', false),
  ('00000000-0000-0000-0000-000000000100', 'inscricao', '2026-01-15', '2026-02-15', false),
  ('00000000-0000-0000-0000-000000000100', 'inscricao_encerrada', '2026-02-16', '2026-02-16', false),
  ('00000000-0000-0000-0000-000000000100', 'divulgacao_inscritos', '2026-02-17', '2026-02-17', false),
  ('00000000-0000-0000-0000-000000000100', 'recurso_divulgacao_inscritos', '2026-02-18', '2026-02-22', false),
  ('00000000-0000-0000-0000-000000000100', 'avaliacao_tecnica', '2026-02-23', NULL, false);

-- Critérios do Edital 1
INSERT INTO public.criterios (id, edital_id, tenant_id, descricao, nota_minima, nota_maxima, peso, ordem) VALUES
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Qualidade artística e relevância cultural', 0, 10, 3, 1),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Viabilidade técnica e financeira do projeto', 0, 10, 2, 2),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Impacto social e democratização do acesso', 0, 10, 2, 3),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Contrapartida social e acessibilidade', 0, 10, 1.5, 4),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Ações afirmativas e diversidade cultural', 0, 10, 1.5, 5);

-- =============================================
-- 4. PROJETOS para Edital 1 (6 projetos)
-- =============================================

INSERT INTO public.projetos (id, tenant_id, edital_id, proponente_id, numero_protocolo, titulo, resumo, orcamento_total, status_habilitacao, nota_final, status_atual, data_envio) VALUES
  ('00000000-0000-0000-0000-000000000300',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000030',
   'LPG-2026-0001',
   'Festival Raízes Vivas: Música Popular do Paraná',
   'Realização de festival de música popular paranaense com 12 apresentações ao longo de 3 meses, incluindo shows, oficinas de instrumentos tradicionais e roda de conversa com mestres da cultura popular. O evento será itinerante, passando por 4 bairros periféricos de Pinhais.',
   85000.00,
   'habilitado',
   8.45,
   'em_avaliacao',
   '2026-02-01T14:30:00Z'),

  ('00000000-0000-0000-0000-000000000301',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000031',
   'LPG-2026-0002',
   'Mulheres em Cena: Teatro Periférico Feminino',
   'Montagem e circulação de espetáculo teatral protagonizado por mulheres negras da periferia de Curitiba e região metropolitana. Inclui 20 oficinas de dramaturgia feminina negra e 8 apresentações em espaços comunitários.',
   65000.00,
   'habilitado',
   9.12,
   'em_avaliacao',
   '2026-02-03T10:15:00Z'),

  ('00000000-0000-0000-0000-000000000302',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000032',
   'LPG-2026-0003',
   'Pinhais em Movimento: Documentário Urbano',
   'Produção de documentário de média-metragem sobre a transformação cultural de Pinhais nas últimas duas décadas, com depoimentos de artistas locais, registros de arquivo e mapeamento dos espaços culturais do município.',
   120000.00,
   'habilitado',
   7.83,
   'em_avaliacao',
   '2026-02-05T16:45:00Z'),

  ('00000000-0000-0000-0000-000000000303',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000033',
   'LPG-2026-0004',
   'Palavras ao Vento: Sarau Literário Itinerante',
   'Série de 15 saraus literários em praças e parques de Pinhais, com publicação de antologia com textos de 30 autores locais. Inclui oficinas de escrita criativa para jovens de 14 a 24 anos.',
   42000.00,
   'habilitado',
   8.67,
   'em_avaliacao',
   '2026-02-08T09:20:00Z'),

  ('00000000-0000-0000-0000-000000000304',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000034',
   'LPG-2026-0005',
   'Circo Social: Arte e Educação nas Escolas',
   'Programa de formação em artes circenses para 200 crianças e adolescentes de escolas públicas municipais, com apresentação final aberta à comunidade no Parque das Águas.',
   95000.00,
   'habilitado',
   7.25,
   'em_avaliacao',
   '2026-02-10T11:00:00Z'),

  ('00000000-0000-0000-0000-000000000305',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000030',
   'LPG-2026-0006',
   'Memória Viva: Acervo Digital do Patrimônio Cultural',
   'Digitalização e catalogação de 500 itens do acervo histórico-cultural de Pinhais, criação de plataforma web de acesso público e série de 6 vídeos curtos sobre patrimônio imaterial.',
   78000.00,
   'inabilitado',
   NULL,
   'inabilitado',
   '2026-02-12T15:30:00Z');

-- =============================================
-- 5. AVALIAÇÕES (2 avaliadores, 5 projetos habilitados)
-- =============================================

-- Avaliador 1 (André) - 5 projetos
INSERT INTO public.avaliacoes (id, tenant_id, projeto_id, avaliador_id, pontuacao_total, justificativa, status, versao, active) VALUES
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000020', 8.20, 'Projeto sólido com excelente proposta de itinerância pelos bairros periféricos. Boa articulação com mestres da cultura popular.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000020', 9.30, 'Projeto excepcional. A proposta de protagonismo feminino negro é extremamente relevante e a viabilidade técnica está bem detalhada.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000020', 7.60, 'Documentário com potencial, mas orçamento elevado para o escopo. A contrapartida social poderia ser mais robusta.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000020', 8.50, 'Excelente iniciativa literária com bom potencial de formação de público jovem. Antologia é um diferencial.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000020', 7.10, 'Proposta educacional válida, mas falta detalhamento do cronograma de oficinas e plano pedagógico.', 'finalizada', 1, true);

-- Avaliador 2 (Patrícia) - 5 projetos
INSERT INTO public.avaliacoes (id, tenant_id, projeto_id, avaliador_id, pontuacao_total, justificativa, status, versao, active) VALUES
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000021', 8.70, 'Festival com proposta artística forte e boa adesão comunitária. A itinerância valoriza o acesso democrático.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000021', 8.95, 'Proposta potente e necessária. Excelente articulação entre formação e difusão. Orçamento coerente.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000021', 8.05, 'Documentário relevante para a memória do município. Equipe técnica qualificada. Orçamento justificado.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000021', 8.85, 'Proposta literária bem estruturada. A publicação da antologia agrega valor permanente ao projeto.', 'finalizada', 1, true),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000021', 7.40, 'Circo social é relevante, mas a proposta precisa de mais clareza nas métricas de impacto.', 'finalizada', 1, true);

-- =============================================
-- 6. NOTAS POR CRITÉRIO (amostra - Avaliador 1, Projeto 1)
-- =============================================

INSERT INTO public.avaliacao_criterios (avaliacao_id, criterio_id, nota, comentario) VALUES
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000200', 9, 'Repertório autêntico e de alta qualidade artística.'),
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000201', 8, 'Orçamento bem detalhado, equipe experiente.'),
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000202', 8, 'Boa cobertura territorial com foco em periferias.'),
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000203', 7, 'Contrapartida adequada mas sem detalhamento de acessibilidade PCD.'),
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000204', 9, 'Valorização de mestres da cultura popular e diversidade regional.');

-- Avaliador 1, Projeto 2
INSERT INTO public.avaliacao_criterios (avaliacao_id, criterio_id, nota, comentario) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000200', 10, 'Proposta artística excepcional, dramaturgia original e potente.'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 9, 'Equipe sólida, orçamento coerente e cronograma realista.'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000202', 9, 'Impacto social significativo nas comunidades periféricas.'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000203', 9, 'Oficinas como contrapartida social direta. Libras prevista.'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000204', 10, 'Protagonismo de mulheres negras é ação afirmativa central.');

-- Avaliador 2, Projeto 1
INSERT INTO public.avaliacao_criterios (avaliacao_id, criterio_id, nota, comentario) VALUES
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000200', 9, 'Excelente curadoria musical com foco em raízes paranaenses.'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000201', 8, 'Logística de itinerância bem planejada.'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000202', 9, 'Acesso gratuito e descentralizado.'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000203', 8, 'Boas contrapartidas com oficinas abertas.'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000204', 9, 'Valoriza diversidade da cultura popular paranaense.');

-- Avaliador 2, Projeto 2
INSERT INTO public.avaliacao_criterios (avaliacao_id, criterio_id, nota, comentario) VALUES
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000200', 9, 'Dramaturgia feminina negra com potência artística.'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000201', 9, 'Bem estruturado financeiramente.'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000202', 9, 'Espaços comunitários ampliam o acesso.'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000203', 8, 'Oficinas como contrapartida significativa.'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000204', 10, 'Máxima relevância em ações afirmativas.');

-- =============================================
-- 7. RECURSOS (2 recursos para demonstrar a funcionalidade)
-- =============================================

INSERT INTO public.recursos (id, tenant_id, projeto_id, proponente_id, tipo, numero_protocolo, fundamentacao, status, created_at) VALUES
  ('00000000-0000-0000-0000-000000000500',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000305',
   '00000000-0000-0000-0000-000000000030',
   'habilitacao',
   'REC-2026-0001',
   'Solicitamos a revisão da decisão de inabilitação do projeto "Memória Viva". Os documentos exigidos no item 5.2 do edital (certidão negativa de débitos e comprovante de endereço) foram enviados dentro do prazo via protocolo digital, conforme recibo em anexo. A certidão CND/FGTS estava válida na data de envio (15/02/2026), conforme documento anexo.',
   'pendente',
   '2026-02-20T10:00:00Z'),

  ('00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000304',
   '00000000-0000-0000-0000-000000000034',
   'avaliacao',
   'REC-2026-0002',
   'Contestamos a nota atribuída ao critério "Viabilidade técnica e financeira" (nota 6.5). O plano pedagógico detalhado consta nas páginas 12-18 da proposta, incluindo cronograma semanal, metodologias por faixa etária e indicadores de acompanhamento. Solicitamos reanálise.',
   'em_analise',
   '2026-02-22T14:30:00Z');

-- =============================================
-- 8. PUBLICAÇÕES (atas e resultados)
-- =============================================

INSERT INTO public.publicacoes (id, tenant_id, edital_id, tipo, numero_publicacao, titulo, conteudo, data_publicacao) VALUES
  ('00000000-0000-0000-0000-000000000600',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   'ata',
   1,
   'Ata de Abertura do Processo Seletivo',
   'Aos quinze dias do mês de janeiro de dois mil e vinte e seis, reuniu-se a Comissão de Seleção designada pela Portaria nº 045/2026, para dar início ao processo seletivo referente ao Edital 001/2026 - Lei Paulo Gustavo. Presentes os membros: Prof. Dr. André Luiz Fernandes, Dra. Patrícia Mendes Ribeiro e João Ricardo Costa. Foi deliberada a aprovação do cronograma de avaliação e definidos os critérios de pontuação conforme Anexo I do Edital.',
   '2026-01-15T10:00:00Z'),

  ('00000000-0000-0000-0000-000000000601',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000100',
   'resultado_preliminar',
   2,
   'Resultado Preliminar - Habilitação Documental',
   'A Comissão de Seleção torna público o resultado preliminar da análise de habilitação documental dos projetos inscritos no Edital 001/2026. Dos 6 projetos inscritos, 5 foram considerados HABILITADOS e 1 foi considerado INABILITADO (LPG-2026-0006 - Memória Viva: Acervo Digital) por ausência da Certidão Negativa de Débitos Trabalhistas atualizada, conforme exigido no item 5.2.c do Edital. O prazo para interposição de recursos é de 5 dias úteis a partir desta publicação.',
   '2026-02-17T16:00:00Z');

-- =============================================
-- 9. EDITAL 2: Em fase de inscrição (mais recente)
-- =============================================
INSERT INTO public.editais (id, tenant_id, numero_edital, titulo, descricao, status, inicio_inscricao, fim_inscricao, active, versao)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '002/2026',
  'Edital de Premiação - Mestres da Cultura Popular',
  'Premiação de reconhecimento a mestres e mestras da cultura popular do município de Pinhais, como forma de valorização de saberes tradicionais, em consonância com a Política Nacional Aldir Blanc de Fomento à Cultura. Serão concedidos 10 prêmios no valor de R$ 5.000,00 cada.',
  'inscricao',
  '2026-02-20T00:00:00Z',
  '2026-03-20T23:59:59Z',
  true,
  1
);

-- Fases do Edital 2
INSERT INTO public.edital_fases (edital_id, fase, data_inicio, data_fim, bloqueada) VALUES
  ('00000000-0000-0000-0000-000000000101', 'criacao', '2026-02-10', '2026-02-15', false),
  ('00000000-0000-0000-0000-000000000101', 'publicacao', '2026-02-15', '2026-02-19', false),
  ('00000000-0000-0000-0000-000000000101', 'inscricao', '2026-02-20', '2026-03-20', false);

-- Critérios do Edital 2
INSERT INTO public.criterios (id, edital_id, tenant_id, descricao, nota_minima, nota_maxima, peso, ordem) VALUES
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Reconhecimento comunitário e trajetória cultural', 0, 10, 3, 1),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Contribuição para a preservação de saberes tradicionais', 0, 10, 3, 2),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Multiplicação de saberes e formação de novos praticantes', 0, 10, 2, 3);

-- 2 projetos já inscritos no Edital 2
INSERT INTO public.projetos (id, tenant_id, edital_id, proponente_id, numero_protocolo, titulo, resumo, orcamento_total, status_habilitacao, status_atual, data_envio) VALUES
  ('00000000-0000-0000-0000-000000000310',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000033',
   'MCP-2026-0001',
   'Mestre Zé do Pife - 50 Anos de Pífano Paranaense',
   'Indicação do Mestre José Amaro da Silva, conhecido como Zé do Pife, para premiação como mestre da cultura popular. Com 50 anos de atuação ininterrupta, é responsável pela formação de mais de 200 tocadores de pífano na região metropolitana de Curitiba.',
   5000.00,
   'pendente',
   'inscrito',
   '2026-02-25T09:00:00Z'),

  ('00000000-0000-0000-0000-000000000311',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000101',
   '00000000-0000-0000-0000-000000000031',
   'MCP-2026-0002',
   'Dona Maria do Boi - Guardiã do Boi de Mamão',
   'Indicação de Maria Aparecida Ferreira, Dona Maria do Boi, guardiã e mestra do Boi de Mamão de Pinhais. Há 35 anos mantém viva a tradição do Boi de Mamão, realizando apresentações em escolas e eventos comunitários.',
   5000.00,
   'pendente',
   'inscrito',
   '2026-02-26T14:15:00Z');

-- =============================================
-- PRONTO! Dados de demo inseridos com sucesso.
-- =============================================
