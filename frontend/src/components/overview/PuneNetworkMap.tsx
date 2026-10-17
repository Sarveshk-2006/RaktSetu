// RAKTSETU — Real Operational Pune Network Map Component
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { ArrowUpRight } from 'lucide-react'

// Synthetic Pune Nodes Data
const NETWORK_NODES = [
  // Blood Banks (Crimson - 5 nodes)
  { id: 'bb-1', name: 'Pune Central Blood Bank', type: 'Blood Bank', lat: 18.5308, lng: 73.8475, color: '#B42336', symbol: 'B', status: 'Operational', info: 'Stock: 420 units' },
  { id: 'bb-2', name: 'Sahyadri Blood Centre', type: 'Blood Bank', lat: 18.5018, lng: 73.9260, color: '#B42336', symbol: 'B', status: 'Operational', info: 'Stock: 280 units' },
  { id: 'bb-3', name: 'Ruby Hall Blood Bank', type: 'Blood Bank', lat: 18.5074, lng: 73.8077, color: '#B42336', symbol: 'B', status: 'Operational', info: 'Stock: 310 units' },
  { id: 'bb-4', name: 'Wagholi Regional Blood Hub', type: 'Blood Bank', lat: 18.5593, lng: 73.9826, color: '#B42336', symbol: 'B', status: 'Low Stock', info: 'O- Stock Critical' },
  { id: 'bb-5', name: 'Viman Nagar Blood Centre', type: 'Blood Bank', lat: 18.5679, lng: 73.9143, color: '#B42336', symbol: 'B', status: 'Operational', info: 'Stock: 190 units' },

  // Hospitals (Blue - 8 nodes)
  { id: 'h-1', name: 'Sahyadri Hospital', type: 'Hospital', lat: 18.5593, lng: 73.9780, color: '#3567B7', symbol: 'H', status: 'Active Incident', info: 'Req: O- 2 units' },
  { id: 'h-2', name: 'Ruby Hall Clinic', type: 'Hospital', lat: 18.5090, lng: 73.8020, color: '#3567B7', symbol: 'H', status: 'Active Incident', info: 'Req: B+ 3 units' },
  { id: 'h-3', name: 'Deenanath Mangeshkar Hospital', type: 'Hospital', lat: 18.5590, lng: 73.7868, color: '#3567B7', symbol: 'H', status: 'Active Incident', info: 'Req: A+ 1 unit' },
  { id: 'h-4', name: 'Noble Hospital', type: 'Hospital', lat: 18.5040, lng: 73.9210, color: '#3567B7', symbol: 'H', status: 'Operational', info: 'ICU Capacity: 85%' },
  { id: 'h-5', name: 'Jupiter Hospital', type: 'Hospital', lat: 18.5995, lng: 73.7636, color: '#3567B7', symbol: 'H', status: 'Operational', info: 'ICU Capacity: 72%' },
  { id: 'h-6', name: 'Manipal Hospital', type: 'Hospital', lat: 18.5515, lng: 73.9350, color: '#3567B7', symbol: 'H', status: 'Operational', info: 'Trauma Unit Ready' },
  { id: 'h-7', name: 'Sancheti Hospital', type: 'Hospital', lat: 18.5330, lng: 73.8500, color: '#3567B7', symbol: 'H', status: 'Operational', info: 'Surgical Center' },
  { id: 'h-8', name: 'Vitalife Hospital', type: 'Hospital', lat: 18.5584, lng: 73.8074, color: '#3567B7', symbol: 'H', status: 'Operational', info: 'Standby Capacity' },

  // Mobile Units (Green - 3 nodes)
  { id: 'm-1', name: 'Mobile Donor Unit 01', type: 'Mobile Unit', lat: 18.5700, lng: 73.7900, color: '#16805D', symbol: 'M', status: 'En Route', info: 'Baner Drive · 18 Donors' },
  { id: 'm-2', name: 'Mobile Donor Unit 02', type: 'Mobile Unit', lat: 18.4900, lng: 73.8200, color: '#16805D', symbol: 'M', status: 'Stationed', info: 'Kothrud Hub · 24 Donors' },
  { id: 'm-3', name: 'Mobile Donor Unit 03', type: 'Mobile Unit', lat: 18.6200, lng: 73.8100, color: '#16805D', symbol: 'M', status: 'Deploying', info: 'Pimpri Camp · 12 Donors' },

  // High Demand Hotspots (Amber - 2 nodes)
  { id: 'hd-1', name: 'Wagholi High Demand Zone', type: 'High Demand', lat: 18.5650, lng: 73.9880, color: '#B7791F', symbol: '!', status: 'Critical Gap', info: 'O- Supply Low · 11 Ready' },
  { id: 'hd-2', name: 'Hadapsar Demand Hotspot', type: 'High Demand', lat: 18.4980, lng: 73.9300, color: '#B7791F', symbol: '!', status: 'Attention', info: 'AB- Supply Low · 4 Ready' },
]

export function PuneNetworkMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize Leaflet Map centered on Pune
    const map = L.map(mapRef.current, {
      center: [18.545, 73.875],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    // Standard OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    // Add minimal zoom controls in top-left
    L.control.zoom({ position: 'topleft' }).addTo(map)

    // Add Wagholi Critical Demand Translucent Halo
    L.circle([18.5593, 73.9826], {
      radius: 2600,
      color: '#B42336',
      fillColor: '#B42336',
      fillOpacity: 0.14,
      weight: 1.5,
      dashArray: '4, 4',
    }).addTo(map)

    // Add Hadapsar Attention Halo
    L.circle([18.5018, 73.9260], {
      radius: 2000,
      color: '#B7791F',
      fillColor: '#B7791F',
      fillOpacity: 0.12,
      weight: 1.5,
    }).addTo(map)

    // Render Markers with Custom Crisp HTML divIcons
    NETWORK_NODES.forEach((node) => {
      const customIcon = L.divIcon({
        className: 'custom-map-node-marker',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 8px;
            background-color: ${node.color};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 11px;
            font-family: system-ui, sans-serif;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.22);
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
            ${node.symbol}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map)

      // Popup content
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 2px; text-align: left; min-width: 140px;">
          <div style="font-size: 12px; font-weight: 700; color: #17212B;">${node.name}</div>
          <div style="font-size: 10px; color: ${node.color}; font-weight: 600; margin-top: 1px;">${node.type} · ${node.status}</div>
          <div style="font-size: 10px; color: #667085; margin-top: 4px; border-top: 1px solid #E6E8EC; padding-top: 4px;">${node.info}</div>
        </div>
      `
      marker.bindPopup(popupHtml)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="card-command p-5 flex flex-col justify-between space-y-4">
      {/* Header with Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#17212B] font-display">Pune Network Topology</h3>
          <p className="text-xs text-[#667085]">Live cluster facilities, blood centres & mobile units</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#475467] font-medium flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#B42336]" /> Blood Bank</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#3567B7]" /> Hospital</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#16805D]" /> Mobile Unit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#B7791F]" /> High Demand</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-[#E6E8EC]">
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* Floating Active Nodes Panel (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#E6E8EC] shadow-xs text-xs space-y-1">
          <span className="font-bold text-[#17212B] block text-[11px]">Active Grid Nodes</span>
          <div className="flex items-center gap-3 text-[11px] text-[#475467]">
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-sm bg-[#B42336]" /> 5 Blood Banks</span>
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-sm bg-[#3567B7]" /> 8 Hospitals</span>
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-sm bg-[#16805D]" /> 3 Mobile Units</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-1">
        <button
          onClick={() => navigate('/intelligence')}
          className="text-xs font-semibold text-[#17212B] hover:text-[#B42336] flex items-center gap-1 border border-[#E6E8EC] px-3.5 py-1.5 rounded-lg hover:border-[#B42336] hover:bg-[#FDF2F4] transition-colors"
        >
          <span>Open Full Interactive Map</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  )
}
