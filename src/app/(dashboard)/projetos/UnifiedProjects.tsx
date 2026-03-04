import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface UnifiedProject {
  id: string
  titulo: string
  status_atual: string | null
  data_envio: string | null
  numero_protocolo: string
  edital_titulo: string
  edital_numero: string
  municipio: string
  dominio: string
  tema_cores: { primary: string } | null
}

interface Props {
  projects: UnifiedProject[]
}

export function UnifiedProjects({ projects }: Props) {
  // Group by municipality
  const grouped = projects.reduce((acc, p) => {
    if (!acc[p.municipio]) acc[p.municipio] = { dominio: p.dominio, tema_cores: p.tema_cores, projects: [] }
    acc[p.municipio].projects.push(p)
    return acc
  }, {} as Record<string, { dominio: string; tema_cores: { primary: string } | null; projects: UnifiedProject[] }>)

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eloculturas.com.br'

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([municipio, { dominio, tema_cores, projects: municipioProjects }]) => (
        <div key={municipio}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">{municipio}</h2>
            <span className="text-xs text-slate-400">
              ({municipioProjects.length} projeto{municipioProjects.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="space-y-3">
            {municipioProjects.map(project => {
              const projectUrl = `https://${dominio}.${rootDomain}/projetos/${project.id}`
              return (
                <Card key={project.id} className="border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="h-1 w-full rounded-t-xl" style={{ backgroundColor: tema_cores?.primary || '#0047AB' }} />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{project.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {project.edital_titulo} — {project.numero_protocolo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {project.status_atual || 'Enviado'}
                      </span>
                      <Link href={projectUrl} target="_blank" className="text-slate-300 hover:text-slate-500 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
