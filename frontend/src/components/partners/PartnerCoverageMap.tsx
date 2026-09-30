// RAKTSETU — Partner Coverage Area Leaflet Map Component
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Partner } from '@/data/partnersData'

interface PartnerCoverageMapProps {
  partner: Partner
}

export function PartnerCoverageMap({ partner }: PartnerCoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up existing map instance if partner changes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Initialize map centered at partner location
    const map = L.map(mapRef.current, {
      center: [partner.lat, partner.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    // CartoDB Voyager Light Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map)

    // Add zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map)

    // Primary Coverage Circle
    L.circle([partner.lat, partner.lng], {
      radius: 3500,
      color: '#E11D48',
      fillColor: '#E11D48',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '4, 4',
    }).addTo(map)

    // Secondary Coverage Circle
    L.circle([partner.lat, partner.lng], {
      radius: 6500,
      color: '#F59E0B',
      fillColor: '#F59E0B',
      fillOpacity: 0.08,
      weight: 1,
      dashArray: '6, 6',
    }).addTo(map)

    // Partner Marker
    const partnerIcon = L.divIcon({
      className: 'partner-node-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background-color: #E11D48;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          font-family: system-ui, sans-serif;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(225, 29, 72, 0.4);
        ">
          P
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const marker = L.marker([partner.lat, partner.lng], { icon: partnerIcon }).addTo(map)

    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px;">
        <div style="font-weight: 700; color: #111827; font-size: 12px;">${partner.name}</div>
        <div style="font-size: 11px; color: #E11D48; font-weight: 600;">${partner.typeLabel}</div>
        <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">Zones: ${partner.zones.join(', ')}</div>
      </div>
    `)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [partner])

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-xl overflow-hidden border border-[#E5E7EB]">
      <div ref={mapRef} className="w-full h-full z-0 min-h-[260px]" />
    </div>
  )
}
