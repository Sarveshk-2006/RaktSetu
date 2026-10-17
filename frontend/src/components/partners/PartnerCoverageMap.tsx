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

    const lat = Number(partner.lat) || 18.5204
    const lng = Number(partner.lng) || 73.8567

    // Initialize map centered at partner location
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    // Standard OpenStreetMap Tiles (Zero API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map)

    // Primary Coverage Circle
    L.circle([lat, lng], {
      radius: 3500,
      color: '#B42336',
      fillColor: '#B42336',
      fillOpacity: 0.18,
      weight: 1.5,
      dashArray: '4, 4',
    }).addTo(map)

    // Secondary Coverage Circle
    L.circle([lat, lng], {
      radius: 6500,
      color: '#B7791F',
      fillColor: '#B7791F',
      fillOpacity: 0.08,
      weight: 1,
      dashArray: '6, 6',
    }).addTo(map)

    // Partner Marker
    const partnerIcon = L.divIcon({
      className: 'partner-node-marker',
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          background-color: #B42336;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          font-family: system-ui, sans-serif;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(180, 35, 54, 0.35);
        ">
          P
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    const marker = L.marker([lat, lng], { icon: partnerIcon }).addTo(map)

    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 2px;">
        <div style="font-weight: 700; color: #17212B; font-size: 12px;">${partner.name}</div>
        <div style="font-size: 11px; color: #B42336; font-weight: 600;">${partner.typeLabel || partner.type || 'Partner Node'}</div>
        <div style="font-size: 10px; color: #667085; margin-top: 4px;">Zones: ${(partner.zones || []).join(', ') || 'Pune District'}</div>
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
