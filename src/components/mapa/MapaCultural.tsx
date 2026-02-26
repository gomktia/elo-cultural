'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

interface PontoMapa {
  municipio: string
  estado: string
  lat: number
  lng: number
  total_projetos: number
  valor_total: number
}

interface MapaCulturalProps {
  pontos: PontoMapa[]
}

export function MapaCultural({ pontos }: MapaCulturalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[500px] md:h-[600px] rounded-2xl bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-400">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return <MapaLeaflet pontos={pontos} />
}

// Componente separado que importa Leaflet apenas no client
function MapaLeaflet({ pontos }: MapaCulturalProps) {
  const [L, setL] = useState<any>(null)
  const [components, setComponents] = useState<any>(null)

  useEffect(() => {
    // Dynamic import do Leaflet e react-leaflet (SSR-safe)
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([leaflet, rl]) => {
      // Fix para ícones do Leaflet
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      setL(leaflet.default)
      setComponents(rl)
    })
  }, [])

  if (!L || !components) {
    return (
      <div className="w-full h-[500px] md:h-[600px] rounded-2xl bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Carregando mapa...</p>
      </div>
    )
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = components

  // Centro do Brasil
  const center: [number, number] = [-14.235, -51.9253]
  const maxProjetos = Math.max(...pontos.map(p => p.total_projetos), 1)

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={true}
      className="w-full h-[500px] md:h-[600px] rounded-2xl z-0"
      style={{ background: '#f1f5f9' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pontos.map((ponto, i) => {
        const radius = Math.max(8, Math.min(30, (ponto.total_projetos / maxProjetos) * 30))
        return (
          <CircleMarker
            key={i}
            center={[ponto.lat, ponto.lng]}
            radius={radius}
            pathOptions={{
              color: '#0047AB',
              fillColor: '#0047AB',
              fillOpacity: 0.5,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-center min-w-[160px]">
                <p className="font-semibold text-sm text-slate-900">{ponto.municipio}</p>
                <p className="text-xs text-slate-500">{ponto.estado}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs">
                    <span className="font-semibold text-[#0047AB]">{ponto.total_projetos}</span> projeto{ponto.total_projetos !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs">
                    <span className="font-semibold text-[#77a80b]">
                      {ponto.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span> investidos
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
