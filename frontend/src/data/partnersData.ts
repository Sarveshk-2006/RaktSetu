// RAKTSETU — Synthetic Partner Network Data & Helper Logic
export interface Partner {
  id: string
  slug: string
  name: string
  type: 'NGO' | 'University' | 'Community' | 'BloodBank' | 'Civic'
  typeLabel: string
  subtitle: string
  description: string
  status: 'Active' | 'Inactive'
  active_donors: number
  total_registered: number
  zones: string[]
  lat: number
  lng: number
  response_rate: string
  avg_response_time: string
  last_sync: string
  established: string
  joined: string
  primary_contact: string
  contact_role: string
  coordination_model: string
  donor_capacity: {
    ready_now: number
    maybe_available: number
    temporarily_unavailable: number
    status_unknown: number
  }
  recent_activities: {
    time: string
    title: string
    category: string
    location?: string
    badgeColor?: string
  }[]
}

export const PARTNERS_DATA: Partner[] = [
  {
    id: 'ORG-001',
    slug: 'upay-pune',
    name: 'UPAY Pune',
    type: 'NGO',
    typeLabel: 'NGO · Coordination Partner',
    subtitle: 'Supporting voluntary blood donation across Pune through community outreach.',
    description: 'UPAY Pune mobilises youth and community volunteers across West Pune to maintain emergency donor readiness.',
    status: 'Active',
    active_donors: 1240,
    total_registered: 4850,
    zones: ['Baner', 'Aundh', 'Wakad'],
    lat: 18.5590,
    lng: 73.7868,
    response_rate: '92%',
    avg_response_time: '14 min',
    last_sync: '10 mins ago',
    established: '2018',
    joined: 'Jan 2024',
    primary_contact: 'Coordination Team',
    contact_role: 'Nodal Officer',
    coordination_model: 'Volunteer Network',
    donor_capacity: {
      ready_now: 612,
      maybe_available: 318,
      temporarily_unavailable: 210,
      status_unknown: 100
    },
    recent_activities: [
      { time: '2 hours ago', title: '48 donors marked as available', category: 'Baner zone', badgeColor: 'bg-[#EFF6FF] text-[#2563EB]' },
      { time: '1 day ago', title: 'Supported incident INC-PN-48291', category: 'Provided 2 units', badgeColor: 'bg-[#FFF1F2] text-[#E11D48]' },
      { time: '2 days ago', title: '32 donors re-engaged', category: 'Aundh zone', badgeColor: 'bg-[#D1FAE5] text-[#059669]' },
      { time: '3 days ago', title: 'Community outreach event completed', category: 'Baner', badgeColor: 'bg-[#FEF3C7] text-[#D97706]' },
      { time: '5 days ago', title: 'Donor readiness updated', category: 'Wakad zone', badgeColor: 'bg-[#F3F4F6] text-[#4B5563]' }
    ]
  },
  {
    id: 'ORG-004',
    slug: 'blood-bank-network',
    name: 'Blood Bank Network',
    type: 'BloodBank',
    typeLabel: 'Blood Bank · Regional Hub',
    subtitle: 'Centralized blood storage, screening and emergency distribution hub for East Pune.',
    description: 'Coordinates blood bank stock levels, rare blood group reserves and hospital supply dispatches.',
    status: 'Active',
    active_donors: 890,
    total_registered: 3200,
    zones: ['Yerawada', 'Viman Nagar', 'Wagholi'],
    lat: 18.5679,
    lng: 73.9143,
    response_rate: '96%',
    avg_response_time: '8 min',
    last_sync: '4 mins ago',
    established: '2015',
    joined: 'Nov 2023',
    primary_contact: 'Dispatch Desk',
    contact_role: 'Storage Lead',
    coordination_model: 'Institutional Sync',
    donor_capacity: {
      ready_now: 480,
      maybe_available: 210,
      temporarily_unavailable: 130,
      status_unknown: 70
    },
    recent_activities: [
      { time: '1 hour ago', title: '12 units O- dispatched to Sahyadri Hospital', category: 'Emergency Dispatch', badgeColor: 'bg-[#FFF1F2] text-[#E11D48]' },
      { time: '4 hours ago', title: '65 donors registered in Wagholi drive', category: 'Wagholi Hub', badgeColor: 'bg-[#D1FAE5] text-[#059669]' },
      { time: '1 day ago', title: 'Stock alert issued for O- negative blood', category: 'Critical Alert', badgeColor: 'bg-[#FEF3C7] text-[#D97706]' },
      { time: '3 days ago', title: 'Cold chain inventory audit verified', category: 'Audit Complete', badgeColor: 'bg-[#EFF6FF] text-[#2563EB]' }
    ]
  },
  {
    id: 'ORG-002',
    slug: 'campus-network',
    name: 'Campus Network',
    type: 'University',
    typeLabel: 'University · Youth Network',
    subtitle: 'Student volunteer network coordinating blood drives across Pune universities.',
    description: 'Engages university campus students for high-likelihood emergency donor activation during critical shortages.',
    status: 'Active',
    active_donors: 684,
    total_registered: 2150,
    zones: ['Shivajinagar', 'Deccan', 'Kothrud'],
    lat: 18.5308,
    lng: 73.8475,
    response_rate: '88%',
    avg_response_time: '18 min',
    last_sync: '15 mins ago',
    established: '2020',
    joined: 'Mar 2024',
    primary_contact: 'Student Representative',
    contact_role: 'Campus Lead',
    coordination_model: 'Peer Activation',
    donor_capacity: {
      ready_now: 310,
      maybe_available: 220,
      temporarily_unavailable: 104,
      status_unknown: 50
    },
    recent_activities: [
      { time: '3 hours ago', title: 'Campus drive registered 110 new student donors', category: 'Deccan Zone', badgeColor: 'bg-[#D1FAE5] text-[#059669]' },
      { time: '1 day ago', title: '25 student donors activated for INC-PN-48287', category: 'Kothrud Request', badgeColor: 'bg-[#FFF1F2] text-[#E11D48]' },
      { time: '4 days ago', title: 'Awareness webinar completed for rare blood types', category: 'Shivajinagar', badgeColor: 'bg-[#EFF6FF] text-[#2563EB]' }
    ]
  },
  {
    id: 'ORG-003',
    slug: 'pune-community-group',
    name: 'Pune Community Group',
    type: 'Community',
    typeLabel: 'Community · Local Network',
    subtitle: 'Grassroots neighbourhood response team for Hadapsar and East Pune.',
    description: 'Local neighborhood volunteers trained in rapid blood incident reporting and donor mobilization.',
    status: 'Active',
    active_donors: 412,
    total_registered: 1600,
    zones: ['Hadapsar', 'Magarpatta'],
    lat: 18.4918,
    lng: 73.9260,
    response_rate: '85%',
    avg_response_time: '22 min',
    last_sync: '25 mins ago',
    established: '2021',
    joined: 'Feb 2024',
    primary_contact: 'Zone Representative',
    contact_role: 'Community Officer',
    coordination_model: 'Local Ward Sync',
    donor_capacity: {
      ready_now: 185,
      maybe_available: 120,
      temporarily_unavailable: 72,
      status_unknown: 35
    },
    recent_activities: [
      { time: '5 hours ago', title: 'Magarpatta donor registry synced with node', category: 'Magarpatta', badgeColor: 'bg-[#EFF6FF] text-[#2563EB]' },
      { time: '2 days ago', title: 'Emergency response drive organized in Hadapsar', category: 'Hadapsar', badgeColor: 'bg-[#D1FAE5] text-[#059669]' },
      { time: '6 days ago', title: 'Community ward liaison meeting held', category: 'Ward Ops', badgeColor: 'bg-[#F3F4F6] text-[#4B5563]' }
    ]
  },
  {
    id: 'ORG-005',
    slug: 'rotary-pune-east',
    name: 'Rotary Pune East',
    type: 'Civic',
    typeLabel: 'Civic · Service Club',
    subtitle: 'Civic service organization managing emergency blood supply initiatives.',
    description: 'Provides mobile donor collection logistics and sponsors emergency blood drives in suburban Pune.',
    status: 'Active',
    active_donors: 320,
    total_registered: 1100,
    zones: ['Hadapsar', 'Wagholi', 'Kondhwa'],
    lat: 18.5018,
    lng: 73.9260,
    response_rate: '91%',
    avg_response_time: '16 min',
    last_sync: '18 mins ago',
    established: '2012',
    joined: 'Oct 2023',
    primary_contact: 'Rotary Director',
    contact_role: 'Civic Coordinator',
    coordination_model: 'Sponsorship & Drive',
    donor_capacity: {
      ready_now: 155,
      maybe_available: 85,
      temporarily_unavailable: 50,
      status_unknown: 30
    },
    recent_activities: [
      { time: '1 hour ago', title: '18 donors verified for Wagholi emergency pool', category: 'Wagholi Hub', badgeColor: 'bg-[#D1FAE5] text-[#059669]' },
      { time: '2 days ago', title: 'Sponsored mobile blood collection van deployment', category: 'Kondhwa', badgeColor: 'bg-[#EFF6FF] text-[#2563EB]' },
      { time: '4 days ago', title: 'Rotary donor appreciation drive hosted', category: 'Civic Event', badgeColor: 'bg-[#FEF3C7] text-[#D97706]' }
    ]
  }
]

export function getPartnerByIdOrSlug(idOrSlug: string): Partner {
  const found = PARTNERS_DATA.find(
    (p) => p.id.toLowerCase() === idOrSlug.toLowerCase() || p.slug.toLowerCase() === idOrSlug.toLowerCase()
  )
  return found || PARTNERS_DATA[0]
}
