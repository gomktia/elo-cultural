// Coordenadas das capitais estaduais e principais municípios brasileiros
// Fonte: IBGE / Wikipedia
// Usado como fallback quando município exato não está na lista

export interface CoordenadaMunicipio {
  municipio: string
  estado: string
  lat: number
  lng: number
}

// Capitais estaduais
export const CAPITAIS: CoordenadaMunicipio[] = [
  { municipio: 'Rio Branco', estado: 'AC', lat: -9.9754, lng: -67.8249 },
  { municipio: 'Maceió', estado: 'AL', lat: -9.6658, lng: -35.7353 },
  { municipio: 'Macapá', estado: 'AP', lat: 0.0349, lng: -51.0694 },
  { municipio: 'Manaus', estado: 'AM', lat: -3.1190, lng: -60.0217 },
  { municipio: 'Salvador', estado: 'BA', lat: -12.9714, lng: -38.5124 },
  { municipio: 'Fortaleza', estado: 'CE', lat: -3.7172, lng: -38.5433 },
  { municipio: 'Brasília', estado: 'DF', lat: -15.7975, lng: -47.8919 },
  { municipio: 'Vitória', estado: 'ES', lat: -20.3155, lng: -40.3128 },
  { municipio: 'Goiânia', estado: 'GO', lat: -16.6869, lng: -49.2648 },
  { municipio: 'São Luís', estado: 'MA', lat: -2.5297, lng: -44.2825 },
  { municipio: 'Cuiabá', estado: 'MT', lat: -15.6014, lng: -56.0979 },
  { municipio: 'Campo Grande', estado: 'MS', lat: -20.4697, lng: -54.6201 },
  { municipio: 'Belo Horizonte', estado: 'MG', lat: -19.9167, lng: -43.9345 },
  { municipio: 'Belém', estado: 'PA', lat: -1.4558, lng: -48.5024 },
  { municipio: 'João Pessoa', estado: 'PB', lat: -7.1195, lng: -34.8450 },
  { municipio: 'Curitiba', estado: 'PR', lat: -25.4284, lng: -49.2733 },
  { municipio: 'Recife', estado: 'PE', lat: -8.0476, lng: -34.8770 },
  { municipio: 'Teresina', estado: 'PI', lat: -5.0892, lng: -42.8019 },
  { municipio: 'Rio de Janeiro', estado: 'RJ', lat: -22.9068, lng: -43.1729 },
  { municipio: 'Natal', estado: 'RN', lat: -5.7945, lng: -35.2110 },
  { municipio: 'Porto Alegre', estado: 'RS', lat: -30.0346, lng: -51.2177 },
  { municipio: 'Porto Velho', estado: 'RO', lat: -8.7612, lng: -63.9004 },
  { municipio: 'Boa Vista', estado: 'RR', lat: 2.8195, lng: -60.6714 },
  { municipio: 'Florianópolis', estado: 'SC', lat: -27.5954, lng: -48.5480 },
  { municipio: 'São Paulo', estado: 'SP', lat: -23.5505, lng: -46.6333 },
  { municipio: 'Aracaju', estado: 'SE', lat: -10.9091, lng: -37.0677 },
  { municipio: 'Palmas', estado: 'TO', lat: -10.1689, lng: -48.3317 },
]

// Mapa rápido: estado → coordenadas da capital (fallback)
const capitalPorEstado = new Map<string, { lat: number; lng: number }>()
for (const c of CAPITAIS) {
  capitalPorEstado.set(c.estado, { lat: c.lat, lng: c.lng })
  capitalPorEstado.set(c.municipio.toLowerCase(), { lat: c.lat, lng: c.lng })
}

// Municípios adicionais frequentes
const MUNICIPIOS_EXTRAS: Record<string, { lat: number; lng: number }> = {
  'campinas': { lat: -22.9099, lng: -47.0626 },
  'guarulhos': { lat: -23.4538, lng: -46.5333 },
  'santo andré': { lat: -23.6737, lng: -46.5432 },
  'osasco': { lat: -23.5325, lng: -46.7917 },
  'niterói': { lat: -22.8833, lng: -43.1036 },
  'nova iguaçu': { lat: -22.7556, lng: -43.4603 },
  'duque de caxias': { lat: -22.7856, lng: -43.3117 },
  'londrina': { lat: -23.3045, lng: -51.1696 },
  'maringá': { lat: -23.4205, lng: -51.9333 },
  'joinville': { lat: -26.3045, lng: -48.8487 },
  'blumenau': { lat: -26.9194, lng: -49.0661 },
  'uberlândia': { lat: -18.9186, lng: -48.2772 },
  'juiz de fora': { lat: -21.7642, lng: -43.3503 },
  'contagem': { lat: -19.9321, lng: -44.0539 },
  'feira de santana': { lat: -12.2669, lng: -38.9666 },
  'camaçari': { lat: -12.6996, lng: -38.3263 },
  'aparecida de goiânia': { lat: -16.8198, lng: -49.2469 },
  'anápolis': { lat: -16.3281, lng: -48.9530 },
  'caruaru': { lat: -8.2822, lng: -35.9761 },
  'olinda': { lat: -8.0089, lng: -34.8553 },
  'mossoró': { lat: -5.1878, lng: -37.3444 },
  'parnamirim': { lat: -5.9157, lng: -35.2627 },
  'campina grande': { lat: -7.2306, lng: -35.8811 },
  'são josé dos campos': { lat: -23.1896, lng: -45.8841 },
  'ribeirão preto': { lat: -21.1704, lng: -47.8103 },
  'sorocaba': { lat: -23.5015, lng: -47.4526 },
  'santos': { lat: -23.9608, lng: -46.3336 },
  'são josé do rio preto': { lat: -20.8113, lng: -49.3758 },
  'piracicaba': { lat: -22.7338, lng: -47.6476 },
  'bauru': { lat: -22.3246, lng: -49.0871 },
}

/**
 * Busca coordenadas para um município/estado.
 * Tenta match exato no município, depois fallback para capital do estado.
 */
export function getCoordenadas(municipio: string | null, estado: string | null): { lat: number; lng: number } | null {
  if (municipio) {
    const normalized = municipio.toLowerCase().trim()
    // Tentar match exato nas capitais
    const capitalMatch = capitalPorEstado.get(normalized)
    if (capitalMatch) return capitalMatch
    // Tentar nos extras
    const extraMatch = MUNICIPIOS_EXTRAS[normalized]
    if (extraMatch) return extraMatch
  }

  // Fallback: capital do estado
  if (estado) {
    const uf = estado.toUpperCase().trim()
    const capitalCoord = capitalPorEstado.get(uf)
    if (capitalCoord) return capitalCoord
  }

  return null
}
