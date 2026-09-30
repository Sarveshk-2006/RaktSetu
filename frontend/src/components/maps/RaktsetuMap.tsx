// RAKTSETU — Unified Open-Source Map Component (OpenStreetMap based, zero API key required)
import { useEffect, useRef } from 'react'
import L from 'leaflet'

export interface MapMarker {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  color: string
  symbol: string
  status: string
  info?: string
}

export interface MapZone {
  zone: string
  lat: number
  lng: number
  donorCount: number
  readyNow: number
  severity: 'Critical' | 'High Risk' | 'Stable' | 'Strong' | 'Moderate' | string
  radius?: number
}

interface RaktsetuMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  zones?: MapZone[]
  height?: string
  showLegend?: boolean
  showControls?: boolean
  interactive?: boolean
  onZoneClick?: (zone: MapZone) => void
  onMarkerClick?: (marker: MapMarker) => void
}

const severityColorMap: Record<string, string> = {
  Critical: '#E11D48',
  'High Risk': '#F59E0B',
  Moderate: '#F59E0B',
  'Moderate Capacity': '#F59E0B',
  'Low Capacity': '#E11D48',
  Stable: '#2563EB',
  Strong: '#10B981',
  'High Capacity': '#10B981',
}

export function RaktsetuMap({
  center = [18.545, 73.875],
  zoom = 11,
  markers = [],
  zones = [],
  height = '380px',
  showLegend = false,
  showControls = true,
  interactive = true,
  onZoneClick,
  onMarkerClick,
}: RaktsetuMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Initialize Leaflet Map centered on Pune
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    })

    mapInstanceRef.current = map

    // OpenStreetMap standard tiles (Zero API key required, reliable worldwide)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add minimal zoom controls in top-left
    if (showControls) {
      L.control.zoom({ position: 'topleft' }).addTo(map)
    }

    // Render Zones as soft translucent coverage halos / circles
    zones.forEach((zone) => {
      const color = severityColorMap[zone.severity] || '#3B82F6'
      const circleRadius = zone.radius || (zone.severity === 'Critical' || zone.severity === 'Low Capacity' ? 2400 : 2000)

      const circle = L.circle([zone.lat, zone.lng], {
        radius: circleRadius,
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2,
      }).addTo(map)

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 140px;">
          <div style="font-weight: 700; color: #111827; font-size: 13px;">${zone.zone}</div>
          <div style="font-size: 11px; color: ${color}; font-weight: 600; margin-top: 2px;">
            ${zone.severity}
          </div>
          <div style="font-size: 11px; color: #4B5563; margin-top: 4px; border-top: 1px solid #E5E7EB; padding-top: 4px;">
            <strong>${zone.readyNow.toLocaleString()}</strong> ready donors
            ${zone.donorCount ? `<br/><span style="color:#6B7280; font-size:10px;">${zone.donorCount.toLocaleString()} total in zone</span>` : ''}
          </div>
        </div>
      `
      circle.bindPopup(popupContent)

      if (onZoneClick) {
        circle.on('click', () => onZoneClick(zone))
      }
    })

    // Render Markers
    markers.forEach((node) => {
      const customIcon = L.divIcon({
        className: 'custom-map-node-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background-color: ${node.color};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 11px;
            font-family: system-ui, sans-serif;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            transition: transform 0.15s ease;
            cursor: pointer;
          " onmouseover="this.style.transform='scale(1.18)'" onmouseout="this.style.transform='scale(1)'">
            ${node.symbol}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map)

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 2px; text-align: left; min-width: 140px;">
          <div style="font-size: 12px; font-weight: 700; color: #111827;">${node.name}</div>
          <div style="font-size: 10px; color: ${node.color}; font-weight: 600; margin-top: 1px;">${node.type} · ${node.status}</div>
          ${node.info ? `<div style="font-size: 10px; color: #6B7280; margin-top: 4px; border-top: 1px solid #E5E7EB; padding-top: 4px;">${node.info}</div>` : ''}
        </div>
      `
      marker.bindPopup(popupHtml)

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(node))
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, markers, zones, showControls, interactive, onZoneClick, onMarkerClick])

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#E5E7EB]" style={{ height }}>
      <div ref={mapRef} className="w-full h-full z-0" />
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#E5E7EB] shadow-xs text-xs space-y-1">
          <span className="font-bold text-[#111827] block text-[11px]">Coverage States</span>
          <div className="flex items-center gap-3 text-[11px] text-[#4B5563]">
            <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> High</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Moderate</span>
            <span className="flex items-center gap-1 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> Low</span>
          </div>
        </div>
      )}
    </div>
  )
}
