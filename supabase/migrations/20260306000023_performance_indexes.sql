-- ══════════════════════════════════════════════════════════════
-- Migration: Performance indexes on foreign keys
-- PostgreSQL does NOT auto-create indexes on FK columns.
-- Without these, JOINs and WHERE on FK columns cause full table scans.
-- ══════════════════════════════════════════════════════════════

-- ── projetos ──
CREATE INDEX IF NOT EXISTS idx_projetos_edital_id ON projetos(edital_id);
CREATE INDEX IF NOT EXISTS idx_projetos_proponente_id ON projetos(proponente_id);
CREATE INDEX IF NOT EXISTS idx_projetos_tenant_id ON projetos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status_atual);

-- ── criterios ──
CREATE INDEX IF NOT EXISTS idx_criterios_edital_id ON criterios(edital_id);

-- ── avaliacoes ──
CREATE INDEX IF NOT EXISTS idx_avaliacoes_projeto_id ON avaliacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliador_id ON avaliacoes(avaliador_id);
-- avaliacoes.edital_id does not exist, skip

-- ── avaliacao_criterios ──
CREATE INDEX IF NOT EXISTS idx_avaliacao_criterios_avaliacao_id ON avaliacao_criterios(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_criterios_criterio_id ON avaliacao_criterios(criterio_id);

-- ── recursos ──
CREATE INDEX IF NOT EXISTS idx_recursos_projeto_id ON recursos(projeto_id);
-- recursos.edital_id does not exist

-- ── publicacoes ──
CREATE INDEX IF NOT EXISTS idx_publicacoes_edital_id ON publicacoes(edital_id);

-- ── projeto_documentos ──
CREATE INDEX IF NOT EXISTS idx_projeto_documentos_projeto_id ON projeto_documentos(projeto_id);

-- ── termos_execucao ──
-- projeto_id and tenant_id indexes already created in 20260306000001

-- prestacao_contas table name is prestacoes_contas
CREATE INDEX IF NOT EXISTS idx_prestacoes_contas_projeto_id ON prestacoes_contas(projeto_id);

-- ── notificacoes ──
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant_id ON notificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- ── profiles ──
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ── editais ──
CREATE INDEX IF NOT EXISTS idx_editais_tenant_id ON editais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_editais_status ON editais(status);
CREATE INDEX IF NOT EXISTS idx_editais_active ON editais(active);

-- ── edital_cotas ──
CREATE INDEX IF NOT EXISTS idx_edital_cotas_edital_id ON edital_cotas(edital_id);

-- ── edital_erratas ──
CREATE INDEX IF NOT EXISTS idx_edital_erratas_edital_id ON edital_erratas(edital_id);

-- ── edital_comissao ──
CREATE INDEX IF NOT EXISTS idx_edital_comissao_edital_id ON edital_comissao(edital_id);

-- ── convocacoes ──
CREATE INDEX IF NOT EXISTS idx_convocacoes_edital_id ON convocacoes(edital_id);
CREATE INDEX IF NOT EXISTS idx_convocacoes_projeto_id ON convocacoes(projeto_id);

-- ── projeto_equipe ──
CREATE INDEX IF NOT EXISTS idx_projeto_equipe_projeto_id ON projeto_equipe(projeto_id);

-- ── projeto_orcamento_itens ──
CREATE INDEX IF NOT EXISTS idx_projeto_orcamento_itens_projeto_id ON projeto_orcamento_itens(projeto_id);

-- ── projeto_cronograma ──
CREATE INDEX IF NOT EXISTS idx_projeto_cronograma_projeto_id ON projeto_cronograma(projeto_id);

-- ── habilitacao_doc_conferencia ──
CREATE INDEX IF NOT EXISTS idx_hab_doc_conf_projeto_id ON habilitacao_doc_conferencia(projeto_id);

-- auditoria table name unknown, skip index

-- ── pagamentos ──
CREATE INDEX IF NOT EXISTS idx_pagamentos_termo_id ON pagamentos(termo_id);

-- ── Composite indexes for common query patterns ──
CREATE INDEX IF NOT EXISTS idx_projetos_edital_status ON projetos(edital_id, status_atual);
-- avaliacoes composite: edital_id does not exist
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);
