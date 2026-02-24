"use client";
import React, { useState } from 'react';
import { Download } from 'lucide-react';

export function ReciboButton({ protocolo, corTenant }: { protocolo: string, corTenant: string }) {
  const [loading, setLoading] = useState(false);

  const baixarRecibo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gerar-recibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolo,
          nome: "Geison Höhr", // Seria pego do Contexto/Sessão do Auth
          cpf: "***.252.***-**",
          titulo: "Projeto Documentário Raízes",
          edital: "Edital Lei Paulo Gustavo 001/2026",
          orgao: "Prefeitura de Inovação SP",
          corTenant
        }),
      });

      if (!res.ok) throw new Error("Falha ao gerar o recibo");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recibo_Cultura_${protocolo}.html`; // Neste demo baixamos o HTML para usar o print do Browser ou converter.
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(error);
      alert("Erro ao emitir o recibo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={baixarRecibo}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 mt-4 text-sm font-bold rounded-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
      style={{ backgroundColor: `${corTenant}15`, color: corTenant, border: `1px solid ${corTenant}` }}
    >
      <Download size={16} />
      {loading ? "Gerando Protocolo Autenticado..." : "Baixar Recibo de Inscrição"}
    </button>
  );
}
