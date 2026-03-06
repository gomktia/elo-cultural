-- Fase 7.5: Extrato bancário no relatório financeiro
ALTER TABLE relatorios_financeiros ADD COLUMN IF NOT EXISTS extrato_bancario_path text;
