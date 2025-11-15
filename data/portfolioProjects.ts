import type { Project } from '../src/lib/types/project';

export const portfolioProjects: Project[] = [
  {
    slug: 'swift-racks-cns',
    title: 'Swift Racks CNS Innovation Copilot',
    year: 2024,
    role: ['Head of Product'],
    industry: ['AI Platform', 'Enterprise Ops'],
    skills: ['AWS Bedrock', 'Claude 3.5', 'RAG', 'Experimentation'],
    summary:
      'Multi-agent AI platform that orchestrates discovery, pricing, and forecasting workflows for enterprise partners.',
    impact: [
      { metric: '$1.8M ARR via CNS pilot' },
      { metric: '85% faster decision cycles' },
      { metric: '15+ AI agents orchestrated securely' },
    ],
    updatedAt: 1730505600000,
  },
  {
    slug: 'swift-racks-autotake',
    title: 'AutoTake Computer Vision Pipeline',
    year: 2024,
    role: ['Head of Product'],
    industry: ['AI Platform', 'Computer Vision'],
    skills: ['Python', 'OpenCV', 'AWS Batch', 'Product Ops'],
    summary:
      'Computer-vision powered estimator that processes 5,200+ blueprint elevations to automate material takeoffs.',
    impact: [
      { metric: '85% reduction in processing time' },
      { metric: '95% funnel conversion improvement' },
      { metric: '5,200+ elevations processed' },
    ],
    updatedAt: 1730419200000,
  },
  {
    slug: 'swift-racks-takecost',
    title: 'TakeCost Strategy Pivot',
    year: 2023,
    role: ['Head of Product'],
    industry: ['Enterprise SaaS'],
    skills: ['Customer Discovery', 'Strategy', 'Product Marketing'],
    summary:
      'Led fifteen-contractor discovery sprint uncovering speed as core buyer outcome, reframing positioning and roadmap.',
    impact: [
      { metric: '95% conversion lift after repositioning' },
      { metric: '4.1M ARR forecast unlocked' },
      { metric: 'Contractor onboarding time halved' },
    ],
    updatedAt: 1727827200000,
  },
  {
    slug: 'racerocks-ras-simulator',
    title: 'RaceRocks Replenishment at Sea Simulator',
    year: 2022,
    role: ['Senior Product Manager'],
    industry: ['Defense', 'Simulation'],
    skills: ['Systems Engineering', 'DoD Compliance', 'Stakeholder Alignment'],
    summary:
      'World’s first integrated RAS simulator for Royal Canadian Navy delivering safer, cheaper training readiness.',
    impact: [
      { metric: '$15M+ annual operational savings' },
      { metric: '4 annual planning cycles led' },
      { metric: 'Joint Boeing/Lockheed/Royal Navy delivery' },
    ],
    updatedAt: 1672531200000,
  },
  {
    slug: 'racerocks-xr-naval-training',
    title: 'RaceRocks XR Naval Training Suite',
    year: 2021,
    role: ['Product Manager'],
    industry: ['Defense', 'XR'],
    skills: ['AR/VR', 'Azure', 'xAPI', 'User Research'],
    summary:
      'AR/VR/XR training modules for CAF Naval programs with Azure-based telemetry and classified feedback loops.',
    impact: [
      { metric: 'Classified research insights shipped quarterly' },
      { metric: 'Azure xAPI stack deployed fleet-wide' },
      { metric: 'Reduced training friction across crews' },
    ],
    updatedAt: 1659312000000,
  },
  {
    slug: 'air-canada-ipad-training',
    title: 'Air Canada Offline iPad Training Platform',
    year: 2016,
    role: ['Product Lead'],
    industry: ['Aviation', 'Learning'],
    skills: ['Mobile', 'Content Systems', 'Change Management'],
    summary:
      'First offline iPad-accessible learning platform for pilots, automating compliance and shrinking friction.',
    impact: [
      { metric: '70% reduction in workflow friction' },
      { metric: '$1.5M annual savings' },
      { metric: '75% engagement lift' },
    ],
    updatedAt: 1483228800000,
  },
  {
    slug: 'cns-ops-cockpit',
    title: 'CNS Ops Cockpit (7th use case)',
    year: 2024,
    role: ['Head of Product'],
    industry: ['AI Platform', 'Ops Center'],
    skills: ['Realtime Dashboards', 'Agent Orchestration', 'Analytics'],
    summary:
      'Executive cockpit that fuses telemetry, agent insights, and portfolio health into one command surface.',
    impact: [
      { metric: 'Single-glass visibility for 7 programs' },
      { metric: 'Exec decision time cut from weeks to hours' },
      { metric: 'Full lineage + audit of AI decisions' },
    ],
    updatedAt: 1730937600000,
  },
] as const;


