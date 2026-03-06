-- Fase 7.4: Parcelamento de débito na prestação de contas
ALTER TABLE prestacoes_contas ADD COLUMN IF NOT EXISTS parcelamento_parcelas integer DEFAULT NULL;
