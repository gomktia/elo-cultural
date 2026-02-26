# Mapa Cultural — Design

Data: 2026-02-26

## Contexto

Página pública com mapa interativo mostrando a distribuição geográfica dos projetos culturais aprovados, por município/estado.

## Decisões

- **Objetivo:** Mapa geográfico público dos projetos culturais
- **Local:** Nova página pública `/mapa` acessível pelo header
- **Tecnologia:** Leaflet + OpenStreetMap (gratuito, sem API key, padrão GovTech)

## Dados

Proponentes já possuem `municipio` e `estado` no perfil. Query server-side agrupa projetos por município do proponente e faz lookup de coordenadas via JSON estático com capitais/municípios BR.

## Página `/mapa`

- Hero compacto (padrão das páginas públicas)
- Mapa fullwidth com react-leaflet + tiles OpenStreetMap
- Pins por município — popup com: nome, qtd projetos, valor total
- Sidebar lateral com totais por estado (colapsável no mobile)
- Filtro por status do edital

## Stack

- react-leaflet + leaflet (npm)
- CSS do Leaflet importado globalmente
- Componente client MapaCultural (Leaflet precisa de window)
- Coordenadas: JSON estático com capitais estaduais BR

## Navegação

- Link "Mapa" no header público
- Link "Mapa Cultural" no footer
