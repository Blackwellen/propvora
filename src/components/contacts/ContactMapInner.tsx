'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '@/lib/maps/tiles'

const TILE_URL = MAP_TILE_URL
const TILE_ATTRIBUTION = MAP_TILE_ATTRIBUTION

// UK city / postcode-area → approximate centre [lat, lng]
const CITY_COORDS: Record<string, [number, number]> = {
  // Major cities
  manchester: [53.4808, -2.2426],
  birmingham: [52.4862, -1.8904],
  london: [51.5074, -0.1278],
  leeds: [53.8008, -1.5491],
  liverpool: [53.4084, -2.9916],
  sheffield: [53.3811, -1.4701],
  bristol: [51.4545, -2.5879],
  edinburgh: [55.9533, -3.1883],
  glasgow: [55.8642, -4.2518],
  newcastle: [54.9783, -1.6178],
  nottingham: [52.9548, -1.1581],
  leicester: [52.6369, -1.1398],
  coventry: [52.4068, -1.5197],
  bradford: [53.796, -1.7594],
  cardiff: [51.4816, -3.1791],
  wolverhampton: [52.587, -2.1288],
  derby: [52.9218, -1.4766],
  southampton: [50.9097, -1.4044],
  portsmouth: [50.8198, -1.088],
  oxford: [51.752, -1.2577],
  cambridge: [52.2053, 0.1218],
  reading: [51.4543, -0.9781],
  luton: [51.8787, -0.42],
  sunderland: [54.9069, -1.3838],
  preston: [53.7591, -2.7035],
  brighton: [50.8279, -0.1683],
  'stoke-on-trent': [53.0027, -2.1794],
  stoke: [53.0027, -2.1794],
  hull: [53.7676, -0.3274],
  'kingston upon hull': [53.7676, -0.3274],
  salford: [53.4875, -2.2901],
  stockport: [53.4083, -2.1494],
  bolton: [53.578, -2.4282],
  wigan: [53.5449, -2.637],
  oldham: [53.5409, -2.1114],
  rochdale: [53.6149, -2.1598],
  york: [53.959, -1.0815],
  exeter: [50.7184, -3.5339],
  plymouth: [50.3755, -4.1427],
  norwich: [52.6309, 1.2974],
  ipswich: [52.0567, 1.1482],
  peterborough: [52.5695, -0.2405],
  northampton: [52.2405, -0.9027],
  milton: [52.0406, -0.7594],
  'milton keynes': [52.0406, -0.7594],
  watford: [51.6565, -0.3903],
  swansea: [51.6214, -3.9436],
  aberdeen: [57.1497, -2.0943],
  dundee: [56.462, -2.9707],
  belfast: [54.5973, -5.9301],
  altrincham: [53.3838, -2.3527],
  wilmslow: [53.3284, -2.2343],
  didsbury: [53.4175, -2.2218],
  chorlton: [53.4451, -2.2714],
  trafford: [53.4543, -2.3396],
  'trafford park': [53.4605, -2.3396],
  'northern quarter': [53.4835, -2.2344],
  spinningfields: [53.4794, -2.2525],
  'salford quays': [53.4714, -2.2956],
  prestwich: [53.5342, -2.2861],
}

// Postcode area prefixes → approximate region centre
const POSTCODE_AREA: Record<string, [number, number]> = {
  m: [53.4808, -2.2426],   // Manchester
  b: [52.4862, -1.8904],   // Birmingham
  e: [51.5194, -0.0557],   // East London
  ec: [51.5155, -0.0922],  // Central London
  n: [51.5588, -0.1243],   // North London
  nw: [51.5436, -0.1567],  // NW London
  se: [51.5, -0.05],       // SE London
  sw: [51.4739, -0.1785],  // SW London
  w: [51.5126, -0.2048],   // West London
  wc: [51.5168, -0.1208],  // WC London
  ls: [53.8008, -1.5491],  // Leeds
  l: [53.4084, -2.9916],   // Liverpool
  s: [53.3811, -1.4701],   // Sheffield
  bs: [51.4545, -2.5879],  // Bristol
  eh: [55.9533, -3.1883],  // Edinburgh
  g: [55.8642, -4.2518],   // Glasgow
  ne: [54.9783, -1.6178],  // Newcastle
  ng: [52.9548, -1.1581],  // Nottingham
  le: [52.6369, -1.1398],  // Leicester
  cv: [52.4068, -1.5197],  // Coventry
  bd: [53.796, -1.7594],   // Bradford
  cf: [51.4816, -3.1791],  // Cardiff
  de: [52.9218, -1.4766],  // Derby
  so: [50.9097, -1.4044],  // Southampton
  po: [50.8198, -1.088],   // Portsmouth
  ox: [51.752, -1.2577],   // Oxford
  cb: [52.2053, 0.1218],   // Cambridge
  rg: [51.4543, -0.9781],  // Reading
  sr: [54.9069, -1.3838],  // Sunderland
  pr: [53.7591, -2.7035],  // Preston
  bn: [50.8279, -0.1683],  // Brighton
  st: [53.0027, -2.1794],  // Stoke
  hu: [53.7676, -0.3274],  // Hull
  yo: [53.959, -1.0815],   // York
  ex: [50.7184, -3.5339],  // Exeter
  pl: [50.3755, -4.1427],  // Plymouth
  nr: [52.6309, 1.2974],   // Norwich
  ip: [52.0567, 1.1482],   // Ipswich
  pe: [52.5695, -0.2405],  // Peterborough
  nn: [52.2405, -0.9027],  // Northampton
  mk: [52.0406, -0.7594],  // Milton Keynes
  wd: [51.6565, -0.3903],  // Watford
  sa: [51.6214, -3.9436],  // Swansea
  ab: [57.1497, -2.0943],  // Aberdeen
  dd: [56.462, -2.9707],   // Dundee
  bt: [54.5973, -5.9301],  // Belfast
}

function resolveCoords(city: string): [number, number] | null {
  const lower = city.toLowerCase().trim()
  if (CITY_COORDS[lower]) return CITY_COORDS[lower]
  // substring match
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (lower.includes(k) || k.includes(lower)) return v
  }
  // postcode area (first 1-2 alpha chars)
  const m = lower.match(/^([a-z]{1,2})\d/)
  if (m) {
    const area = m[1]
    if (POSTCODE_AREA[area]) return POSTCODE_AREA[area]
  }
  return null
}

const TYPE_COLORS: Record<string, string> = {
  tenant: '#7C3AED',
  post_tenant: '#7C3AED',
  landlord: '#2563EB',
  supplier: '#D97706',
  maintenance: '#D97706',
  cleaning: '#D97706',
  emergency_contractor: '#EF4444',
  legal: '#DC2626',
  accountant: '#0891B2',
  insurer: '#0E7490',
  agent: '#0F766E',
  applicant: '#0EA5E9',
  professional: '#4F46E5',
}

function dominantColor(types: string[]): string {
  const counts: Record<string, number> = {}
  for (const t of types) counts[t] = (counts[t] ?? 0) + 1
  const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'tenant'
  return TYPE_COLORS[dom] ?? '#64748B'
}

export interface ContactCityEntry {
  city: string
  contacts: { id: string; name: string; type: string }[]
}

interface ContactMapInnerProps {
  cityData: ContactCityEntry[]
  selectedId: string | null
  onSelectCity?: (city: string) => void
}

export default function ContactMapInner({ cityData, selectedId, onSelectCity }: ContactMapInnerProps) {
  const plotted = useMemo(() =>
    cityData
      .map(entry => ({ ...entry, coords: resolveCoords(entry.city) }))
      .filter((e): e is typeof e & { coords: [number, number] } => e.coords !== null),
    [cityData]
  )

  const maxCount = Math.max(1, ...plotted.map(p => p.contacts.length))

  const selectedCity = selectedId
    ? cityData.find(c => c.contacts.some(x => x.id === selectedId))?.city
    : null

  return (
    <MapContainer
      center={[53.2, -2.0]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abc" maxZoom={19} />

      {plotted.map(entry => {
        const isSelected = entry.city === selectedCity
        const count = entry.contacts.length
        const radius = 10 + Math.sqrt(count / maxCount) * 22
        const color = dominantColor(entry.contacts.map(c => c.type))
        const types = [...new Set(entry.contacts.map(c => c.type))]
        return (
          <CircleMarker
            key={entry.city}
            center={entry.coords}
            radius={radius}
            pathOptions={{
              color: '#fff',
              weight: isSelected ? 3 : 2,
              fillColor: color,
              fillOpacity: isSelected ? 0.92 : 0.78,
            }}
            eventHandlers={{ click: () => onSelectCity?.(entry.city) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -(radius + 4)]}
              permanent={false}
              sticky={false}
            >
              <div style={{ fontFamily: 'system-ui,sans-serif', minWidth: 140 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px' }}>{entry.city}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  {count} contact{count !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {types.slice(0, 4).map(t => (
                    <span key={t} style={{ fontSize: 10, fontWeight: 600, background: TYPE_COLORS[t] ?? 'var(--color-border)', color: 'var(--text-inverse)', padding: '1px 6px', borderRadius: 99, textTransform: 'capitalize' }}>
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
