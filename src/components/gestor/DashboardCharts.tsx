'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const COLORS = ['var(--brand-primary)', '#e32a74', '#eeb513', '#77a80b', '#6366f1', '#0ea5e9', '#f97316', '#8b5cf6']

interface DashboardChartsProps {
  categoriaData: Array<{ name: string; value: number }>
  orcamentoData: Array<{ name: string; dotacao: number; comprometido: number }>
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return value.toLocaleString('pt-BR')
}

export function DashboardCharts({ categoriaData, orcamentoData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Category Distribution */}
      <div className="border border-slate-200 shadow-sm bg-white rounded-2xl p-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Distribuição por Categoria</h3>
        {categoriaData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoriaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoriaData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value) => [`${value} projetos`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 min-w-0">
              {categoriaData.slice(0, 6).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-slate-600 truncate">{cat.name}</span>
                  <span className="text-[11px] font-bold text-slate-400 ml-auto">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">Sem dados</div>
        )}
      </div>

      {/* Budget per Edital */}
      <div className="border border-slate-200 shadow-sm bg-white rounded-2xl p-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Orçamento por Edital</h3>
        {orcamentoData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={orcamentoData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
              />
              <Bar dataKey="dotacao" fill="var(--brand-primary)" opacity={0.2} radius={[0, 4, 4, 0]} name="Dotação" />
              <Bar dataKey="comprometido" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} name="Comprometido" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-sm text-slate-400">Sem dotação definida</div>
        )}
      </div>
    </div>
  )
}
