require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Policy = require('../models/Policy');
const { Category } = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/govsim';

// Impact curve generator
function generateImpact(month, cfg) {
  const t = month / cfg.duration;
  const easeIn = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
  const wave = Math.sin(t * Math.PI * 4) * 0.06;
  const clamp = (v) => Math.min(100, Math.max(0, Math.round(v + wave * 100)));
  return {
    month,
    economic: clamp(cfg.eco.base + cfg.eco.peak * easeIn),
    social: clamp(cfg.soc.base + cfg.soc.peak * easeIn),
    environmental: clamp(cfg.env.base + cfg.env.peak * easeIn),
    positiveEffects: cfg.positives.map(p => ({ label: p.label, value: clamp(p.base + p.peak * easeIn) })),
    negativeEffects: cfg.negatives.map(n => {
      const peakT = Math.min(1, Math.max(0, n.peakAt ? (t < n.peakAt ? t/n.peakAt : 1-(t-n.peakAt)/(1-n.peakAt)) : easeIn));
      return { label: n.label, value: clamp(n.base + n.peak * peakT) };
    })
  };
}

function makeImpactData(cfg) {
  const data = [];
  for (let m = 0; m <= cfg.duration; m += 1) data.push(generateImpact(m, cfg));
  return data;
}

const CATEGORIES = [
  { name: 'Education', slug: 'education', icon: '🎓', color: '#3b82f6', description: 'Learning, literacy and skill development policies' },
  { name: 'Healthcare', slug: 'healthcare', icon: '🏥', color: '#ef4444', description: 'Public health, medical access and prevention' },
  { name: 'Environment', slug: 'environment', icon: '🌿', color: '#22c55e', description: 'Climate, energy and ecosystem policies' },
  { name: 'Economic', slug: 'economic', icon: '📈', color: '#f59e0b', description: 'Growth, employment and fiscal policies' },
  { name: 'Infrastructure', slug: 'infrastructure', icon: '🏗️', color: '#8b5cf6', description: 'Transport, digital and utility networks' },
  { name: 'Social', slug: 'social', icon: '🤝', color: '#ec4899', description: 'Welfare, equality and community policies' },
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾', color: '#84cc16', description: 'Farming, food security and rural development' }
];

const POLICIES_DATA = [

  // ───────── EDUCATION (5 policies) ─────────────────────────────────────────
  {
    title: 'Free WiFi for School Students',
    subtitle: 'Universal digital access in all government schools',
    category: 'Education', icon: '📶', color: '#3b82f6', accentColor: '#60a5fa',
    tags: ['digital', 'connectivity', 'students'],
    description: 'Government installs high-speed WiFi routers in every classroom. Students get free internet access for educational purposes, enabling digital learning, online research and e-resources.',
    targetPopulation: '250 million school students',
    budget: '₹12,000 Crore',
    duration: 60,
    sceneType: 'wifi_school',
    phases: [
      { phase: 0, name: 'Infrastructure Setup', monthStart: 0, monthEnd: 5, description: 'Routers installed, cables laid, network infrastructure built across schools', color: '#eab308', sceneDescription: 'Crane and scaffolding visible. Workers installing routers on school walls.' },
      { phase: 1, name: 'Network Goes Live', monthStart: 6, monthEnd: 18, description: 'WiFi activated. Students connect devices. Digital learning begins. Positive wave starts.', color: '#22c55e', sceneDescription: 'WiFi rings pulse from routers. Blue data packets fly to students. Windows glow.' },
      { phase: 2, name: 'Negative Effects Emerge', monthStart: 19, monthEnd: 35, description: 'Gaming and social media misuse detected. Cyberbullying rises. Distraction spikes.', color: '#ef4444', sceneDescription: 'Red packets appear. Students cluster in distracted groups. Warning nodes float.' },
      { phase: 3, name: 'Policy Equilibrium', monthStart: 36, monthEnd: 60, description: 'Content filters applied. Digital literacy added to curriculum. Balance achieved.', color: '#3b82f6', sceneDescription: 'Orderly student movement. Green packets dominant. Filter shield visible.' }
    ],
    positiveImpacts: [
      { label: 'Digital Learning Access', icon: '📖', description: 'Students access online textbooks, Khan Academy, NCERT digital resources' },
      { label: 'Academic Performance', icon: '🎓', description: 'Research skills improve; access to solved papers and tutorials boosts grades' },
      { label: 'Digital Equity (Rural)', icon: '🌐', description: 'Rural students gain same access as urban peers — closes digital divide' },
    ],
    negativeImpacts: [
      { label: 'Classroom Distraction', icon: '📱', description: 'Students use WiFi for gaming and social media during class hours' },
      { label: 'Screen Addiction Risk', icon: '😰', description: 'Prolonged screen time creates dependency patterns, affects sleep' },
      { label: 'Cyberbullying Incidents', icon: '🚨', description: 'Anonymous online access increases bullying, harassment reports' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 35 }, soc: { base: 0, peak: 70 }, env: { base: 0, peak: 8 },
      positives: [{ label: 'Digital Access', base: 0, peak: 90 }, { label: 'Academic Scores', base: 0, peak: 60 }, { label: 'Digital Equity', base: 0, peak: 80 }],
      negatives: [{ label: 'Distraction', base: 0, peak: 75, peakAt: 0.55 }, { label: 'Screen Addiction', base: 0, peak: 60, peakAt: 0.58 }, { label: 'Cyberbullying', base: 0, peak: 55, peakAt: 0.52 }]
    }
  },

  {
    title: 'Mid-Day Meal Scheme',
    subtitle: 'Free nutritious lunch for all government school children',
    category: 'Education', icon: '🍱', color: '#f59e0b', accentColor: '#fbbf24',
    tags: ['nutrition', 'attendance', 'children'],
    description: 'Government provides free cooked meals to children in all government and government-aided schools. Aims to boost enrollment, attendance, and nutritional status.',
    targetPopulation: '120 million school children',
    budget: '₹8,500 Crore',
    duration: 48,
    sceneType: 'midday_meal',
    phases: [
      { phase: 0, name: 'Kitchen Construction', monthStart: 0, monthEnd: 4, description: 'Kitchen buildings constructed in school compounds. Staff hired and trained.', color: '#eab308', sceneDescription: 'Kitchen shed being built. Cooking equipment delivered.' },
      { phase: 1, name: 'Meals Begin', monthStart: 5, monthEnd: 20, description: 'Daily meals served. Attendance spikes. Children staying in school.', color: '#22c55e', sceneDescription: 'Steam rising from kitchen. Children lined up with plates. Happy nodes appear.' },
      { phase: 2, name: 'Quality Issues', monthStart: 21, monthEnd: 33, description: 'Food poisoning incidents reported. Corruption in procurement exposed.', color: '#ef4444', sceneDescription: 'Red warning nodes. Hospital icons appear. Supply chain breaks.' },
      { phase: 3, name: 'Reforms & Stabilization', monthStart: 34, monthEnd: 48, description: 'Centralized monitoring, GPS tracking of supplies, nutrition standards enforced.', color: '#3b82f6', sceneDescription: 'Digital monitoring drones visible. Green quality checkmarks. Stable attendance.' }
    ],
    positiveImpacts: [
      { label: 'School Attendance', icon: '✅', description: 'Enrollment rises 28% as parents send children for the meal guarantee' },
      { label: 'Child Nutrition', icon: '💪', description: 'Protein, calorie and micronutrient intake improves for poor children' },
      { label: 'Gender Parity', icon: '👧', description: 'Girl child enrollment rises significantly as families see school value' }
    ],
    negativeImpacts: [
      { label: 'Food Poisoning Risk', icon: '🤢', description: 'Poorly stored or prepared food causes illness outbreaks' },
      { label: 'Procurement Corruption', icon: '💸', description: 'Local supply contracts misused; substandard ingredients supplied' },
      { label: 'Kitchen Staff Burden', icon: '😓', description: 'Underpaid cooks handle massive volumes with inadequate facilities' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 25 }, soc: { base: 5, peak: 80 }, env: { base: -2, peak: -10 },
      positives: [{ label: 'Attendance', base: 0, peak: 85 }, { label: 'Nutrition', base: 0, peak: 70 }, { label: 'Gender Parity', base: 0, peak: 60 }],
      negatives: [{ label: 'Food Safety Risk', base: 0, peak: 50, peakAt: 0.5 }, { label: 'Corruption', base: 0, peak: 45, peakAt: 0.52 }, { label: 'Staff Burnout', base: 0, peak: 40, peakAt: 0.6 }]
    }
  },

  {
    title: 'Digital Classroom Initiative',
    subtitle: 'Smart boards and tablets in every classroom',
    category: 'Education', icon: '🖥️', color: '#6366f1', accentColor: '#818cf8',
    tags: ['technology', 'teaching', 'smart-class'],
    description: 'Installation of interactive smart boards, projectors, and student tablets in government schools. Teachers trained on digital pedagogy.',
    targetPopulation: '50 million students, 2 million teachers',
    budget: '₹22,000 Crore',
    duration: 72,
    sceneType: 'digital_classroom',
    phases: [
      { phase: 0, name: 'Hardware Rollout', monthStart: 0, monthEnd: 8, description: 'Smart boards installed in classrooms. Tablets distributed to students.', color: '#eab308', sceneDescription: 'Delivery trucks at school gate. Smart boards being mounted.' },
      { phase: 1, name: 'Teacher Training', monthStart: 9, monthEnd: 20, description: 'Teachers attend digital literacy workshops. Early adopters begin using smart boards.', color: '#6366f1', sceneDescription: 'Teachers at training center. Projector beams in classroom.' },
      { phase: 2, name: 'Adoption & Resistance', monthStart: 21, monthEnd: 40, description: 'Senior teachers resist change. Technical glitches cause disruptions.', color: '#f97316', sceneDescription: 'Error icons on screens. Frustrated teacher figures. Mixed signals.' },
      { phase: 3, name: 'Full Integration', monthStart: 41, monthEnd: 72, description: 'Digital-first teaching normalized. Student outcomes measurably improve.', color: '#22c55e', sceneDescription: 'Bright glowing classrooms. Data flows between tablets. Achievement stars.' }
    ],
    positiveImpacts: [
      { label: 'Learning Engagement', icon: '✨', description: 'Interactive lessons increase student attention spans by 40%' },
      { label: 'Teacher Effectiveness', icon: '👩‍🏫', description: 'Digital tools enable personalized and multimedia teaching' },
      { label: 'Assessment Quality', icon: '📊', description: 'Real-time digital assessments give instant feedback loops' }
    ],
    negativeImpacts: [
      { label: 'Teacher Resistance', icon: '🚫', description: 'Older teachers struggle to adapt, creating classroom inequality' },
      { label: 'Technical Failures', icon: '💥', description: 'Power cuts, device malfunctions disrupt lessons unexpectedly' },
      { label: 'Device Theft/Damage', icon: '🔓', description: 'Tablets lost or damaged; replacement cost burdens schools' }
    ],
    cfg: {
      duration: 72,
      eco: { base: 0, peak: 30 }, soc: { base: 0, peak: 65 }, env: { base: -3, peak: -15 },
      positives: [{ label: 'Engagement', base: 0, peak: 85 }, { label: 'Teacher Skill', base: 0, peak: 70 }, { label: 'Assessment', base: 0, peak: 75 }],
      negatives: [{ label: 'Resistance', base: 0, peak: 60, peakAt: 0.45 }, { label: 'Tech Failures', base: 0, peak: 45, peakAt: 0.4 }, { label: 'Device Loss', base: 0, peak: 35, peakAt: 0.5 }]
    }
  },

  {
    title: 'Free Higher Education for Girls',
    subtitle: 'Full scholarship for women in state universities',
    category: 'Education', icon: '👩‍🎓', color: '#ec4899', accentColor: '#f472b6',
    tags: ['gender', 'higher-ed', 'scholarship'],
    description: 'State government waives all tuition fees for women in government colleges and universities. Includes stipend for hostels and books.',
    targetPopulation: '8 million women students',
    budget: '₹5,000 Crore/year',
    duration: 60,
    sceneType: 'girls_education',
    phases: [
      { phase: 0, name: 'Policy Announcement', monthStart: 0, monthEnd: 3, description: 'Scheme announced. Application portal opens. Awareness drives launched.', color: '#eab308', sceneDescription: 'News billboards appear. Government building with announcement banner.' },
      { phase: 1, name: 'Enrollment Surge', monthStart: 4, monthEnd: 24, description: 'Female enrollment jumps 45%. New hostels built. Faculty expanded.', color: '#22c55e', sceneDescription: 'University building grows taller. Female student figures stream in.' },
      { phase: 2, name: 'Infrastructure Strain', monthStart: 25, monthEnd: 40, description: 'Colleges overcrowded. Faculty shortage. Quality of education dips.', color: '#ef4444', sceneDescription: 'Overcrowding indicators. Classrooms bursting. Warning signs.' },
      { phase: 3, name: 'Systemic Expansion', monthStart: 41, monthEnd: 60, description: 'New colleges opened. PPP model brings private investment. Quality stabilizes.', color: '#3b82f6', sceneDescription: 'Multiple new campus buildings. Career outcome stars for graduates.' }
    ],
    positiveImpacts: [
      { label: 'Female Enrollment', icon: '📈', description: 'Women in higher education rises from 26% to 41% in 5 years' },
      { label: 'Economic Participation', icon: '💼', description: 'Educated women enter workforce, boosting family income and GDP' },
      { label: 'Social Mobility', icon: '🚀', description: 'First-generation college graduates break poverty cycles' }
    ],
    negativeImpacts: [
      { label: 'Overcrowding', icon: '🏫', description: 'Sudden surge overwhelms campus infrastructure' },
      { label: 'Quality Dilution', icon: '📉', description: 'Faculty-to-student ratio worsens, classroom quality drops' },
      { label: 'Fiscal Pressure', icon: '💰', description: 'State budget strained; other departments face fund cuts' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 45 }, soc: { base: 5, peak: 85 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Female Enrollment', base: 0, peak: 90 }, { label: 'Economic Entry', base: 0, peak: 65 }, { label: 'Social Mobility', base: 0, peak: 75 }],
      negatives: [{ label: 'Overcrowding', base: 0, peak: 65, peakAt: 0.5 }, { label: 'Quality Drop', base: 0, peak: 55, peakAt: 0.5 }, { label: 'Fiscal Strain', base: 5, peak: 50, peakAt: 0.7 }]
    }
  },

  {
    title: 'National Coding in Schools',
    subtitle: 'Mandatory programming education from Grade 6',
    category: 'Education', icon: '💻', color: '#0ea5e9', accentColor: '#38bdf8',
    tags: ['coding', 'skills', 'future-ready'],
    description: 'Introduces mandatory coding and computational thinking curriculum from Grade 6 onwards. Trains 500,000 teachers in programming fundamentals.',
    targetPopulation: '80 million students Gr.6–12',
    budget: '₹3,200 Crore',
    duration: 48,
    sceneType: 'coding_school',
    phases: [
      { phase: 0, name: 'Curriculum Design', monthStart: 0, monthEnd: 6, description: 'NCERT designs coding syllabus. Teacher training centers set up.', color: '#eab308', sceneDescription: 'Curriculum documents floating. Training center building.' },
      { phase: 1, name: 'Pilot Rollout', monthStart: 7, monthEnd: 20, description: '1000 pilot schools launch coding classes. Student excitement high.', color: '#0ea5e9', sceneDescription: 'Code symbols flying. Computer lab scene. Students at desks.' },
      { phase: 2, name: 'Scale Challenges', monthStart: 21, monthEnd: 34, description: 'Computer shortage in rural schools. Teacher quality uneven.', color: '#f97316', sceneDescription: 'Missing computer icons. Unequal distribution map.' },
      { phase: 3, name: 'National Rollout', monthStart: 35, monthEnd: 48, description: 'Cloud-based coding platforms solve hardware gap. 80% schools active.', color: '#22c55e', sceneDescription: 'Cloud servers visible. Code streams everywhere. Job placement nodes.' }
    ],
    positiveImpacts: [
      { label: 'Tech Workforce Pipeline', icon: '👨‍💻', description: 'India builds 5M+ trained coders for global tech demand' },
      { label: 'Problem-Solving Skills', icon: '🧠', description: 'Computational thinking improves maths and science performance' },
      { label: 'Startup Ecosystem', icon: '🚀', description: 'Young entrepreneurs build apps and solutions from school age' }
    ],
    negativeImpacts: [
      { label: 'Hardware Inequality', icon: '💻', description: 'Rural schools lack computers; digital divide deepens' },
      { label: 'Teacher Shortage', icon: '👨‍🏫', description: 'Qualified coding teachers unavailable in 60% of schools' },
      { label: 'Curriculum Overload', icon: '😫', description: 'Students overwhelmed with additional mandatory subject' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 50 }, soc: { base: 0, peak: 55 }, env: { base: -1, peak: -8 },
      positives: [{ label: 'Tech Pipeline', base: 0, peak: 80 }, { label: 'Problem Solving', base: 0, peak: 65 }, { label: 'Startup Culture', base: 0, peak: 55 }],
      negatives: [{ label: 'Hardware Gap', base: 5, peak: 60, peakAt: 0.5 }, { label: 'Teacher Shortage', base: 5, peak: 55, peakAt: 0.55 }, { label: 'Curriculum Load', base: 0, peak: 40, peakAt: 0.4 }]
    }
  },

  // ───────── HEALTHCARE (5 policies) ────────────────────────────────────────
  {
    title: 'Universal Health Coverage',
    subtitle: 'Free healthcare for all citizens below poverty line',
    category: 'Healthcare', icon: '🏥', color: '#ef4444', accentColor: '#f87171',
    tags: ['universal', 'BPL', 'insurance'],
    description: 'Government provides cashless treatment up to ₹5 lakh per family per year at all empanelled hospitals. Covers 500 million BPL citizens.',
    targetPopulation: '500 million BPL citizens',
    budget: '₹64,000 Crore/year',
    duration: 72,
    sceneType: 'universal_health',
    phases: [
      { phase: 0, name: 'System Registration', monthStart: 0, monthEnd: 6, description: 'Biometric enrollment of BPL families. Hospital empanelment. IT system setup.', color: '#eab308', sceneDescription: 'Registration camps. Biometric devices. Hospital signing contracts.' },
      { phase: 1, name: 'Coverage Begins', monthStart: 7, monthEnd: 24, description: 'Cashless treatment starts. Millions access hospitals previously unaffordable.', color: '#22c55e', sceneDescription: 'Hospitals lit up. Patient streams in. Health nodes rising.' },
      { phase: 2, name: 'System Abuse & Gaps', monthStart: 25, monthEnd: 45, description: 'Fake claims surge. Private hospitals over-treat for billing. Infrastructure gaps.', color: '#ef4444', sceneDescription: 'Fraud icons. Over-billing warnings. Queue congestion.' },
      { phase: 3, name: 'AI Monitoring Era', monthStart: 46, monthEnd: 72, description: 'AI fraud detection deployed. Quality standards enforced. Positive outcomes.', color: '#3b82f6', sceneDescription: 'AI scan beams on hospitals. Clean data flows. Recovery nodes.' }
    ],
    positiveImpacts: [
      { label: 'Healthcare Access', icon: '🏥', description: '500M people access surgery, cancer treatment, dialysis for first time' },
      { label: 'Mortality Reduction', icon: '❤️', description: 'Preventable deaths fall 32% in enrolled districts' },
      { label: 'Poverty Trap Break', icon: '💔➡️💚', description: 'Medical debt no longer pushes families below poverty line' }
    ],
    negativeImpacts: [
      { label: 'Insurance Fraud', icon: '🔴', description: 'Fake patients and ghost surgeries drain scheme funds' },
      { label: 'Hospital Overload', icon: '😓', description: 'Government hospitals overwhelmed; private hospitals prefer rich patients' },
      { label: 'Bureaucratic Delays', icon: '📋', description: 'Pre-authorization delays deny timely treatment in emergencies' }
    ],
    cfg: {
      duration: 72,
      eco: { base: 0, peak: 40 }, soc: { base: 5, peak: 88 }, env: { base: -2, peak: -12 },
      positives: [{ label: 'Access', base: 0, peak: 92 }, { label: 'Mortality Drop', base: 0, peak: 75 }, { label: 'Poverty Relief', base: 0, peak: 80 }],
      negatives: [{ label: 'Fraud', base: 0, peak: 70, peakAt: 0.48 }, { label: 'Overload', base: 0, peak: 65, peakAt: 0.5 }, { label: 'Delays', base: 5, peak: 50, peakAt: 0.55 }]
    }
  },

  {
    title: 'National Vaccination Drive',
    subtitle: 'Free immunization for children under 5',
    category: 'Healthcare', icon: '💉', color: '#8b5cf6', accentColor: '#a78bfa',
    tags: ['vaccination', 'children', 'immunity'],
    description: 'Nationwide door-to-door vaccination campaign covering 12 diseases. ASHA workers visit every household with cold-chain maintained vaccines.',
    targetPopulation: '150 million children under 5',
    budget: '₹9,000 Crore',
    duration: 36,
    sceneType: 'vaccination',
    phases: [
      { phase: 0, name: 'Cold Chain Setup', monthStart: 0, monthEnd: 4, description: 'Refrigeration units deployed to PHCs. ASHA worker training begins.', color: '#eab308', sceneDescription: 'Refrigeration trucks. Cold chain icons. Worker training camp.' },
      { phase: 1, name: 'Campaign Launch', monthStart: 5, monthEnd: 18, description: 'Door-to-door drives begin. Vaccination coverage climbs rapidly.', color: '#22c55e', sceneDescription: 'ASHA workers at doors. Vaccine syringes flying. Immunity shields.' },
      { phase: 2, name: 'Hesitancy Wave', monthStart: 19, monthEnd: 27, description: 'Misinformation causes vaccine hesitancy in some communities.', color: '#ef4444', sceneDescription: 'Rumor cloud nodes. Hesitant parent figures. Coverage dips.' },
      { phase: 3, name: 'Herd Immunity Zone', monthStart: 28, monthEnd: 36, description: 'Community trust rebuilt. 92% coverage achieved. Disease cases plummet.', color: '#22c55e', sceneDescription: 'Green immunity dome over community. Disease nodes vanishing.' }
    ],
    positiveImpacts: [
      { label: 'Disease Prevention', icon: '🛡️', description: 'Measles, polio, typhoid cases drop by 85-95%' },
      { label: 'Child Survival Rate', icon: '👶', description: 'Under-5 mortality drops significantly in covered areas' },
      { label: 'Herd Immunity', icon: '🤲', description: 'Community-level protection emerges above 85% coverage' }
    ],
    negativeImpacts: [
      { label: 'Vaccine Hesitancy', icon: '❌', description: 'Misinformation via social media creates pockets of refusal' },
      { label: 'Cold Chain Failures', icon: '🌡️', description: 'Power cuts spoil vaccine batches; wasted doses' },
      { label: 'ASHA Worker Burnout', icon: '😔', description: 'Underpaid frontline workers face community hostility and overwork' }
    ],
    cfg: {
      duration: 36,
      eco: { base: 0, peak: 30 }, soc: { base: 5, peak: 85 }, env: { base: -1, peak: -5 },
      positives: [{ label: 'Disease Prevention', base: 0, peak: 92 }, { label: 'Child Survival', base: 0, peak: 80 }, { label: 'Herd Immunity', base: 0, peak: 75 }],
      negatives: [{ label: 'Hesitancy', base: 0, peak: 55, peakAt: 0.55 }, { label: 'Cold Chain Fail', base: 0, peak: 35, peakAt: 0.35 }, { label: 'Worker Burnout', base: 5, peak: 45, peakAt: 0.65 }]
    }
  },

  {
    title: 'Mental Health in Schools',
    subtitle: 'Counselors in every school, helpline for students',
    category: 'Healthcare', icon: '🧠', color: '#06b6d4', accentColor: '#22d3ee',
    tags: ['mental-health', 'students', 'counseling'],
    description: 'Every government school gets a trained mental health counselor. Anonymous helpline launched. Stigma-reduction awareness campaigns run across India.',
    targetPopulation: '300 million students',
    budget: '₹2,800 Crore',
    duration: 48,
    sceneType: 'mental_health',
    phases: [
      { phase: 0, name: 'Counselor Hiring', monthStart: 0, monthEnd: 5, description: 'Psychologists hired and placed. Counseling rooms set up in schools.', color: '#eab308', sceneDescription: 'Counseling room being furnished. Therapist figures arriving.' },
      { phase: 1, name: 'Awareness Campaign', monthStart: 6, monthEnd: 18, description: 'Stigma breaks down. Students begin opening up. Helpline calls surge.', color: '#06b6d4', sceneDescription: 'Awareness posters glowing. Students walking to counselor. Calming blue aura.' },
      { phase: 2, name: 'Demand Outstrips Supply', monthStart: 19, monthEnd: 32, description: 'Too many students need help; counselors overwhelmed.', color: '#f97316', sceneDescription: 'Long queue at counselor room. Overload warning signs.' },
      { phase: 3, name: 'Digital & Peer Support', monthStart: 33, monthEnd: 48, description: 'AI chatbots and peer counselor programs launched. Demand managed.', color: '#22c55e', sceneDescription: 'AI assistant holograms. Peer support circles. Recovery stars.' }
    ],
    positiveImpacts: [
      { label: 'Stigma Reduction', icon: '💬', description: 'Open conversations about mental health become normalized' },
      { label: 'Dropout Prevention', icon: '🏫', description: 'Early intervention keeps at-risk students in school' },
      { label: 'Student Well-being', icon: '😊', description: 'Reported anxiety and depression scores improve by 35%' }
    ],
    negativeImpacts: [
      { label: 'Counselor Shortage', icon: '👩‍⚕️', description: 'Demand far exceeds supply of trained mental health professionals' },
      { label: 'Privacy Concerns', icon: '🔒', description: 'Students fear data being shared with parents or teachers' },
      { label: 'Stigma in Rural Areas', icon: '🌾', description: 'Rural communities still resist mental health services as taboo' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 20 }, soc: { base: 5, peak: 78 }, env: { base: 0, peak: 3 },
      positives: [{ label: 'Stigma Drop', base: 0, peak: 75 }, { label: 'Dropout Prevention', base: 0, peak: 65 }, { label: 'Well-being', base: 0, peak: 80 }],
      negatives: [{ label: 'Shortage', base: 5, peak: 70, peakAt: 0.5 }, { label: 'Privacy', base: 0, peak: 40, peakAt: 0.4 }, { label: 'Rural Stigma', base: 10, peak: 55, peakAt: 0.6 }]
    }
  },

  {
    title: 'Swachh Bharat Mission',
    subtitle: 'Open defecation free India — toilets for all',
    category: 'Healthcare', icon: '🚽', color: '#84cc16', accentColor: '#a3e635',
    tags: ['sanitation', 'rural', 'ODF'],
    description: 'Construction of household toilets across rural India. Behavior change communication to stop open defecation. ODF certification for villages.',
    targetPopulation: '600 million rural citizens',
    budget: '₹1.4 Lakh Crore',
    duration: 60,
    sceneType: 'sanitation',
    phases: [
      { phase: 0, name: 'Toilet Construction', monthStart: 0, monthEnd: 10, description: '100 million toilets built. Materials supplied. Masons trained.', color: '#eab308', sceneDescription: 'Construction workers. Toilet blocks rising. Supply trucks.' },
      { phase: 1, name: 'Behavior Change Drive', monthStart: 11, monthEnd: 28, description: 'ASHA workers drive behavior change. ODF villages declared.', color: '#22c55e', sceneDescription: 'Village community meetings. ODF flags raised. Toilet usage rising.' },
      { phase: 2, name: 'Maintenance Crisis', monthStart: 29, monthEnd: 42, description: 'Toilets fall into disuse. No maintenance funds. Usage drops.', color: '#ef4444', sceneDescription: 'Broken toilet icons. Disuse warnings. Back to old habits.' },
      { phase: 3, name: 'Sustained ODF', monthStart: 43, monthEnd: 60, description: 'Community-led maintenance. Water supply added. Genuine ODF achieved.', color: '#3b82f6', sceneDescription: 'Clean toilet icons. Water connection visible. Health improvement nodes.' }
    ],
    positiveImpacts: [
      { label: 'Disease Reduction', icon: '🦠', description: 'Diarrhea, cholera, typhoid fall by 60% in ODF villages' },
      { label: 'Women Safety', icon: '👩', description: 'Women no longer risk assault at night for open defecation' },
      { label: 'Child Health', icon: '👶', description: 'Child stunting and wasting reduces in ODF households' }
    ],
    negativeImpacts: [
      { label: 'Maintenance Neglect', icon: '🔧', description: 'Toilets built but not maintained; fall into disuse within 2 years' },
      { label: 'Force & Coercion', icon: '⚠️', description: 'In some areas, social pressure used to meet ODF targets' },
      { label: 'Water Scarcity', icon: '💧', description: 'Flush toilets need water supply; many villages lack this' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 25 }, soc: { base: 5, peak: 80 }, env: { base: 5, peak: 55 },
      positives: [{ label: 'Disease Fall', base: 0, peak: 85 }, { label: 'Women Safety', base: 0, peak: 70 }, { label: 'Child Health', base: 0, peak: 65 }],
      negatives: [{ label: 'Maintenance', base: 0, peak: 60, peakAt: 0.55 }, { label: 'Coercion', base: 0, peak: 35, peakAt: 0.4 }, { label: 'Water Need', base: 5, peak: 50, peakAt: 0.6 }]
    }
  },

  {
    title: 'Ayushman Bharat PM-JAY',
    subtitle: '₹5 lakh insurance for 100 million vulnerable families',
    category: 'Healthcare', icon: '🫀', color: '#f43f5e', accentColor: '#fb7185',
    tags: ['insurance', 'BPL', 'hospitalization'],
    description: 'World\'s largest government health insurance scheme. Covers secondary and tertiary hospitalization for 100 million families at government and private hospitals.',
    targetPopulation: '500 million beneficiaries',
    budget: '₹6,400 Crore/year',
    duration: 60,
    sceneType: 'health_insurance',
    phases: [
      { phase: 0, name: 'Card Enrollment', monthStart: 0, monthEnd: 6, description: 'Ayushman cards issued. Hospital empanelment. IT portal launched.', color: '#eab308', sceneDescription: 'Card distribution camps. Hospital signboards updating.' },
      { phase: 1, name: 'Cashless Surge', monthStart: 7, monthEnd: 22, description: 'Millions access hospitals. Major surgeries done for first time.', color: '#22c55e', sceneDescription: 'Hospitals lit. Patient streams. Surgery nodes. Recovery icons.' },
      { phase: 2, name: 'Fraud & Overload', monthStart: 23, monthEnd: 40, description: 'Fake surgeries billed. Hospitals cherry-pick profitable cases.', color: '#ef4444', sceneDescription: 'Fraud warning nodes. Ambulance queue. Cherry-pick icons.' },
      { phase: 3, name: 'AI Governance', monthStart: 41, monthEnd: 60, description: 'AI claims analysis. Quality metrics. Net positive health outcome.', color: '#3b82f6', sceneDescription: 'AI scanning hospitals. Clean claim flows. Positive health outcomes.' }
    ],
    positiveImpacts: [
      { label: 'Hospitalization Access', icon: '🏥', description: 'Cancer, cardiac, orthopedic surgeries accessible to poor families' },
      { label: 'Financial Protection', icon: '🛡️', description: 'Medical bankruptcy eliminated for 100M families' },
      { label: 'Private Sector Reach', icon: '🤝', description: 'Private hospitals expand to tier-2/3 cities for scheme patients' }
    ],
    negativeImpacts: [
      { label: 'Fraudulent Claims', icon: '💸', description: '20-25% claims found fraudulent in audits; massive fund drain' },
      { label: 'Exclusion Errors', icon: '❌', description: 'Genuinely poor families missing from beneficiary list' },
      { label: 'Quality Variation', icon: '📉', description: 'Some empanelled hospitals provide substandard care for scheme patients' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 38 }, soc: { base: 5, peak: 82 }, env: { base: -2, peak: -10 },
      positives: [{ label: 'Hospital Access', base: 0, peak: 88 }, { label: 'Financial Safety', base: 0, peak: 82 }, { label: 'Private Reach', base: 0, peak: 60 }],
      negatives: [{ label: 'Fraud', base: 0, peak: 72, peakAt: 0.5 }, { label: 'Exclusion', base: 5, peak: 50, peakAt: 0.45 }, { label: 'Quality Gap', base: 0, peak: 45, peakAt: 0.55 }]
    }
  },

  // ───────── ENVIRONMENT (5 policies) ───────────────────────────────────────
  {
    title: 'Solar Rooftop for Every Home',
    subtitle: 'Subsidized solar panels for 10 million households',
    category: 'Environment', icon: '☀️', color: '#f59e0b', accentColor: '#fbbf24',
    tags: ['solar', 'renewable', 'energy'],
    description: 'Government subsidizes 40% of rooftop solar installation costs. Net metering allows households to sell excess power back to grid.',
    targetPopulation: '10 million households',
    budget: '₹75,000 Crore',
    duration: 60,
    sceneType: 'solar_rooftop',
    phases: [
      { phase: 0, name: 'Subsidy Registration', monthStart: 0, monthEnd: 5, description: 'Online portal for subsidy applications. Vendor empanelment. Grid prep.', color: '#eab308', sceneDescription: 'Application portal glowing. Vendor trucks with solar panels.' },
      { phase: 1, name: 'Installation Wave', monthStart: 6, monthEnd: 22, description: 'Panels installed on rooftops citywide. Sunlight captured. Grid feeds.', color: '#f59e0b', sceneDescription: 'Solar panels gleaming on roofs. Sun rays captured. Power lines glowing.' },
      { phase: 2, name: 'Grid Instability', monthStart: 23, monthEnd: 38, description: 'Unregulated export to grid causes voltage fluctuations. Storage gap.', color: '#f97316', sceneDescription: 'Grid fluctuation warnings. Voltage spike nodes. Power cut icons.' },
      { phase: 3, name: 'Smart Grid Era', monthStart: 39, monthEnd: 60, description: 'Battery storage added. Smart inverters balance grid. Massive CO2 savings.', color: '#22c55e', sceneDescription: 'Battery nodes. Smart grid mesh. CO2 reduction counter. Green city.' }
    ],
    positiveImpacts: [
      { label: 'CO₂ Reduction', icon: '🌍', description: '28 million tons of CO2 avoided annually' },
      { label: 'Energy Bills Cut', icon: '⚡', description: 'Household electricity bills drop by 60-80%' },
      { label: 'Energy Independence', icon: '🔋', description: 'India reduces coal import dependency' }
    ],
    negativeImpacts: [
      { label: 'Grid Instability', icon: '⚡', description: 'Unmanaged solar export causes voltage and frequency issues' },
      { label: 'Upfront Cost Barrier', icon: '💰', description: 'Even with 40% subsidy, poor households cannot afford installation' },
      { label: 'Panel Waste Future', icon: '♻️', description: 'Solar panel waste management unresolved; 25-year lifecycle issue' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 42 }, soc: { base: 0, peak: 45 }, env: { base: 0, peak: 88 },
      positives: [{ label: 'CO2 Drop', base: 0, peak: 88 }, { label: 'Bill Savings', base: 0, peak: 80 }, { label: 'Energy Independence', base: 0, peak: 65 }],
      negatives: [{ label: 'Grid Issues', base: 0, peak: 55, peakAt: 0.5 }, { label: 'Cost Barrier', base: 10, peak: 60, peakAt: 0.4 }, { label: 'Panel Waste', base: 0, peak: 20, peakAt: 0.8 }]
    }
  },

  {
    title: 'Plastic Ban Policy',
    subtitle: 'Complete ban on single-use plastics',
    category: 'Environment', icon: '🚫', color: '#22c55e', accentColor: '#4ade80',
    tags: ['plastic', 'ban', 'waste'],
    description: 'Government bans manufacture, import, sale and use of identified single-use plastic items. Alternative packaging industry promoted.',
    targetPopulation: '1.4 billion citizens',
    budget: '₹1,200 Crore (enforcement)',
    duration: 48,
    sceneType: 'plastic_ban',
    phases: [
      { phase: 0, name: 'Ban Announced', monthStart: 0, monthEnd: 3, description: 'Ban notified. Awareness campaign. Grace period for industry transition.', color: '#eab308', sceneDescription: 'Ban signboards. Plastic items with X marks. Factory transition.' },
      { phase: 1, name: 'Enforcement Begins', monthStart: 4, monthEnd: 18, description: 'Raids on plastic manufacturers. Plastic waste visibly reduced.', color: '#22c55e', sceneDescription: 'Police raid icons. Plastic waste shrinking. Rivers clearing.' },
      { phase: 2, name: 'Black Market & Gaps', monthStart: 19, monthEnd: 32, description: 'Illegal plastic floods in. Alternatives too expensive for poor.', color: '#ef4444', sceneDescription: 'Smuggling truck icons. Black market nodes. Alternative cost spikes.' },
      { phase: 3, name: 'Alternative Economy', monthStart: 33, monthEnd: 48, description: 'Bamboo, jute, paper industry booms. Costs fall. Genuine reduction achieved.', color: '#22c55e', sceneDescription: 'Bamboo plants growing. Eco-market nodes. Rivers clean. Birds return.' }
    ],
    positiveImpacts: [
      { label: 'Ocean Plastic Reduction', icon: '🌊', description: 'Marine plastic pollution drops 40% in coastal areas' },
      { label: 'Soil Health', icon: '🌱', description: 'Agricultural land recovers as microplastic contamination falls' },
      { label: 'Alternative Industry', icon: '🌿', description: 'Bamboo, jute, cloth bag industry creates 2M new jobs' }
    ],
    negativeImpacts: [
      { label: 'Black Market Plastics', icon: '🚛', description: 'Illegal plastic trade thrives where enforcement is weak' },
      { label: 'Industry Job Loss', icon: '😥', description: '300,000 plastic industry workers lose livelihoods' },
      { label: 'Poor Affordability', icon: '💸', description: 'Eco-alternatives cost 3-5x more; poor families struggle' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 25 }, soc: { base: -5, peak: 30 }, env: { base: 0, peak: 82 },
      positives: [{ label: 'Ocean Health', base: 0, peak: 80 }, { label: 'Soil Health', base: 0, peak: 65 }, { label: 'Alt Industry', base: 0, peak: 55 }],
      negatives: [{ label: 'Black Market', base: 0, peak: 65, peakAt: 0.5 }, { label: 'Job Loss', base: 5, peak: 60, peakAt: 0.35 }, { label: 'Affordability', base: 5, peak: 55, peakAt: 0.45 }]
    }
  },

  {
    title: 'National Electric Vehicle Mission',
    subtitle: '30% EV adoption by 2030 — subsidies and charging network',
    category: 'Environment', icon: '⚡', color: '#16a34a', accentColor: '#4ade80',
    tags: ['EV', 'transport', 'clean-energy'],
    description: 'Government offers ₹1.5 lakh subsidy on electric vehicles. 100,000 charging stations built. Battery swap network for 2-wheelers.',
    targetPopulation: '50 million vehicle owners',
    budget: '₹57,000 Crore',
    duration: 84,
    sceneType: 'ev_mission',
    phases: [
      { phase: 0, name: 'Subsidy Launch', monthStart: 0, monthEnd: 6, description: 'EV subsidies announced. Charging station construction begins.', color: '#eab308', sceneDescription: 'Construction of charging pods. EV showrooms opening.' },
      { phase: 1, name: 'EV Adoption Wave', monthStart: 7, monthEnd: 30, description: 'EV sales surge. Petrol cars displaced. Air quality improving.', color: '#22c55e', sceneDescription: 'Electric cars on roads. Charging pods active. Clean air indicators.' },
      { phase: 2, name: 'Grid & Battery Stress', monthStart: 31, monthEnd: 55, description: 'Grid demand spikes from mass EV charging. Battery disposal crisis.', color: '#f97316', sceneDescription: 'Grid stress icons. Battery waste dumps. Power shortage warnings.' },
      { phase: 3, name: 'Green Grid Integration', monthStart: 56, monthEnd: 84, description: 'Solar-powered charging. V2G technology. Circular battery economy.', color: '#16a34a', sceneDescription: 'Solar charging canopies. V2G power flows. Circular economy nodes.' }
    ],
    positiveImpacts: [
      { label: 'Air Quality', icon: '💨', description: 'Urban PM2.5 falls by 35% in cities with 20%+ EV share' },
      { label: 'Oil Import Savings', icon: '💰', description: '₹1.2 lakh crore saved annually on crude oil imports' },
      { label: 'Green Jobs', icon: '⚡', description: '1 million jobs in EV manufacturing, charging, maintenance' }
    ],
    negativeImpacts: [
      { label: 'Grid Pressure', icon: '🔌', description: 'Simultaneous home charging peaks overload distribution networks' },
      { label: 'Battery Waste', icon: '🔋', description: 'Lithium battery disposal creates new toxic waste streams' },
      { label: 'Affordability Gap', icon: '💸', description: 'EVs still too expensive for middle/lower class buyers despite subsidy' }
    ],
    cfg: {
      duration: 84,
      eco: { base: 0, peak: 48 }, soc: { base: 0, peak: 40 }, env: { base: 0, peak: 85 },
      positives: [{ label: 'Air Quality', base: 0, peak: 85 }, { label: 'Import Savings', base: 0, peak: 70 }, { label: 'Green Jobs', base: 0, peak: 65 }],
      negatives: [{ label: 'Grid Stress', base: 0, peak: 60, peakAt: 0.52 }, { label: 'Battery Waste', base: 0, peak: 40, peakAt: 0.65 }, { label: 'Affordability', base: 10, peak: 65, peakAt: 0.4 }]
    }
  },

  {
    title: 'National Afforestation Programme',
    subtitle: 'Plant 13 billion trees — green India mission',
    category: 'Environment', icon: '🌳', color: '#15803d', accentColor: '#22c55e',
    tags: ['forests', 'carbon', 'biodiversity'],
    description: 'Large-scale tree planting across degraded forests, wasteland and urban areas. 100 days employment guarantee for plantation workers.',
    targetPopulation: '800 million citizens (ecological benefit)',
    budget: '₹47,000 Crore',
    duration: 60,
    sceneType: 'afforestation',
    phases: [
      { phase: 0, name: 'Nursery Preparation', monthStart: 0, monthEnd: 6, description: 'Saplings grown in nurseries. Land identified. Workers registered.', color: '#eab308', sceneDescription: 'Nursery rows of saplings. Land survey drones. Worker registration camps.' },
      { phase: 1, name: 'Mass Plantation', monthStart: 7, monthEnd: 24, description: 'Plantation drives on degraded land. Employment generated in rural areas.', color: '#15803d', sceneDescription: 'Workers planting saplings. Trees growing slowly. Green nodes appearing.' },
      { phase: 2, name: 'Survival Crisis', monthStart: 25, monthEnd: 38, description: 'Many saplings die from poor soil, drought and neglect.', color: '#ef4444', sceneDescription: 'Dead sapling icons. Drought cracks. Survival rate warning nodes.' },
      { phase: 3, name: 'Forest Ecosystem Emerges', monthStart: 39, monthEnd: 60, description: 'Surviving trees establish. Biodiversity returns. Carbon sequestration active.', color: '#22c55e', sceneDescription: 'Full trees growing. Birds and animals returning. Carbon counter.' }
    ],
    positiveImpacts: [
      { label: 'Carbon Sequestration', icon: '🌍', description: 'Mature forests absorb 300 million tons CO2/year' },
      { label: 'Groundwater Recharge', icon: '💧', description: 'Forest cover improves rainfall and aquifer recharge' },
      { label: 'Rural Employment', icon: '👨‍🌾', description: '2 million person-days of employment in planting and maintenance' }
    ],
    negativeImpacts: [
      { label: 'Low Survival Rate', icon: '🥀', description: 'Only 40-60% of planted saplings survive 3 years' },
      { label: 'Monoculture Risk', icon: '🌲', description: 'Single-species plantations reduce biodiversity vs native forests' },
      { label: 'Encroachment', icon: '🚧', description: 'Plantation land encroached by construction or farming' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 30 }, soc: { base: 0, peak: 45 }, env: { base: 0, peak: 90 },
      positives: [{ label: 'Carbon Sink', base: 0, peak: 90 }, { label: 'Groundwater', base: 0, peak: 70 }, { label: 'Employment', base: 0, peak: 65 }],
      negatives: [{ label: 'Survival Rate', base: 0, peak: 55, peakAt: 0.45 }, { label: 'Monoculture', base: 5, peak: 40, peakAt: 0.55 }, { label: 'Encroachment', base: 0, peak: 35, peakAt: 0.5 }]
    }
  },

  {
    title: 'Jal Jeevan Mission',
    subtitle: 'Piped drinking water to every rural household',
    category: 'Environment', icon: '💧', color: '#0284c7', accentColor: '#38bdf8',
    tags: ['water', 'rural', 'drinking-water'],
    description: 'Functional household tap connections to every rural household by 2024. 165 million connections. Clean water within 50 metres of every home.',
    targetPopulation: '700 million rural citizens',
    budget: '₹3.6 Lakh Crore',
    duration: 72,
    sceneType: 'water_mission',
    phases: [
      { phase: 0, name: 'Pipeline Construction', monthStart: 0, monthEnd: 12, description: 'Water treatment plants, pipelines and storage tanks built across villages.', color: '#eab308', sceneDescription: 'Pipeline trenches. Water tower construction. Treatment plant.' },
      { phase: 1, name: 'Water Flows', monthStart: 13, monthEnd: 30, description: 'Taps flow in homes. Women save hours from water collection walks.', color: '#0284c7', sceneDescription: 'Tap icons glowing. Water flowing in homes. Women celebrating. Time saved.' },
      { phase: 2, name: 'Quality & Quantity Issues', monthStart: 31, monthEnd: 48, description: 'Water contamination in some areas. Intermittent supply. Pipe leakages.', color: '#ef4444', sceneDescription: 'Contamination warning nodes. Broken pipe icons. Intermittent flow.' },
      { phase: 3, name: 'Smart Water Management', monthStart: 49, monthEnd: 72, description: 'IoT sensors monitor quality and flow. Community water committees manage.', color: '#22c55e', sceneDescription: 'IoT sensor network. Water quality dashboard. Community panels.' }
    ],
    positiveImpacts: [
      { label: 'Women Time Saved', icon: '⏰', description: 'Women save 2-4 hours daily previously spent collecting water' },
      { label: 'Waterborne Disease Fall', icon: '🦠', description: 'Diarrhea, cholera cases fall 55% in connected villages' },
      { label: 'School Attendance', icon: '🏫', description: 'Girl attendance rises as they no longer fetch water for family' }
    ],
    negativeImpacts: [
      { label: 'Water Contamination', icon: '☠️', description: 'Pipe network contamination from agricultural runoff and sewage' },
      { label: 'Groundwater Depletion', icon: '📉', description: 'Over-extraction for piped supply depletes local aquifers' },
      { label: 'Maintenance Gap', icon: '🔧', description: 'Village-level maintenance skill and fund shortage causes breakdowns' }
    ],
    cfg: {
      duration: 72,
      eco: { base: 0, peak: 35 }, soc: { base: 5, peak: 82 }, env: { base: -5, peak: 45 },
      positives: [{ label: 'Time Saved', base: 0, peak: 85 }, { label: 'Disease Fall', base: 0, peak: 78 }, { label: 'School Attend.', base: 0, peak: 65 }],
      negatives: [{ label: 'Contamination', base: 0, peak: 50, peakAt: 0.5 }, { label: 'GW Depletion', base: 0, peak: 45, peakAt: 0.65 }, { label: 'Maintenance', base: 0, peak: 55, peakAt: 0.55 }]
    }
  },

  // ───────── ECONOMIC (5 policies) ──────────────────────────────────────────
  {
    title: 'GST Simplified for MSMEs',
    subtitle: 'Flat 1% GST for businesses under ₹5 crore turnover',
    category: 'Economic', icon: '📊', color: '#f59e0b', accentColor: '#fbbf24',
    tags: ['GST', 'MSME', 'tax'],
    description: 'Government simplifies GST to a flat 1% composite scheme for MSMEs. Quarterly filing replaces monthly. Compliance burden drastically reduced.',
    targetPopulation: '63 million MSMEs',
    budget: '₹25,000 Crore (revenue forgone)',
    duration: 48,
    sceneType: 'gst_reform',
    phases: [
      { phase: 0, name: 'Policy Design', monthStart: 0, monthEnd: 4, description: 'GST Council consultation. System redesign. Awareness for MSMEs.', color: '#eab308', sceneDescription: 'Government meeting room. Tax documents being redesigned.' },
      { phase: 1, name: 'Compliance Relief', monthStart: 5, monthEnd: 20, description: 'MSMEs shift to simplified scheme. Accountant costs drop. Formalization rises.', color: '#22c55e', sceneDescription: 'Shop fronts registering. Tax form simplification animation. MSME growth.' },
      { phase: 2, name: 'Revenue Shortfall', monthStart: 21, monthEnd: 33, description: 'Government tax collection dips. Large firms misuse MSME threshold.', color: '#ef4444', sceneDescription: 'Revenue meter falling. Threshold abuse warning nodes.' },
      { phase: 3, name: 'Formalisation Dividend', monthStart: 34, monthEnd: 48, description: 'New MSMEs enter tax net. Net revenue neutral. Employment grows.', color: '#22c55e', sceneDescription: 'More businesses registering. Employment counter rising. GDP nodes.' }
    ],
    positiveImpacts: [
      { label: 'MSME Formalization', icon: '🏪', description: '15 million informal businesses join formal economy' },
      { label: 'Compliance Cost Drop', icon: '💰', description: 'Accounting costs for small business fall 70%' },
      { label: 'Credit Access', icon: '🏦', description: 'Formal status enables MSMEs to access bank loans' }
    ],
    negativeImpacts: [
      { label: 'Revenue Loss', icon: '📉', description: 'Short-term tax revenue dip of ₹25,000 crore' },
      { label: 'Threshold Gaming', icon: '🎯', description: 'Large firms split into artificial MSME units to exploit scheme' },
      { label: 'Competitive Disadvantage', icon: '⚖️', description: 'Large compliant firms at disadvantage vs tax-advantaged MSMEs' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 65 }, soc: { base: 0, peak: 45 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Formalization', base: 0, peak: 80 }, { label: 'Compliance Cost', base: 0, peak: 70 }, { label: 'Credit Access', base: 0, peak: 60 }],
      negatives: [{ label: 'Revenue Loss', base: 5, peak: 55, peakAt: 0.45 }, { label: 'Threshold Abuse', base: 0, peak: 50, peakAt: 0.55 }, { label: 'Unfair Comp.', base: 0, peak: 40, peakAt: 0.5 }]
    }
  },

  {
    title: 'MGNREGA Employment Guarantee',
    subtitle: '100 days guaranteed work for every rural household',
    category: 'Economic', icon: '👷', color: '#92400e', accentColor: '#d97706',
    tags: ['rural-employment', 'MGNREGA', 'wages'],
    description: 'Legal guarantee of 100 days of unskilled manual work per year to rural households. Minimum wage paid within 15 days. Creates durable rural infrastructure.',
    targetPopulation: '150 million rural workers',
    budget: '₹73,000 Crore/year',
    duration: 60,
    sceneType: 'mgnrega',
    phases: [
      { phase: 0, name: 'Registration', monthStart: 0, monthEnd: 5, description: 'Job cards issued. Gram panchayats plan works. MIS system set up.', color: '#eab308', sceneDescription: 'Gram panchayat building. Job card distribution. Biometric registration.' },
      { phase: 1, name: 'Work Creation', monthStart: 6, monthEnd: 25, description: 'Roads, ponds, check dams built. Rural wages rise. Migration slows.', color: '#92400e', sceneDescription: 'Workers building check dam. Road construction. Wage payment kiosk.' },
      { phase: 2, name: 'Corruption & Delays', monthStart: 26, monthEnd: 40, description: 'Fake muster rolls. Delayed wages. Middlemen siphon funds.', color: '#ef4444', sceneDescription: 'Ghost worker icons. Wage delay warning. Middleman extraction nodes.' },
      { phase: 3, name: 'DBT Reform', monthStart: 41, monthEnd: 60, description: 'Direct bank transfer. Aadhaar authentication. Corruption falls sharply.', color: '#22c55e', sceneDescription: 'Aadhaar authentication beam. Direct bank transfer. Clean rural landscape.' }
    ],
    positiveImpacts: [
      { label: 'Rural Income', icon: '💵', description: 'Poorest rural households earn ₹25,000+ additional income annually' },
      { label: 'Migration Reduction', icon: '🏡', description: 'Rural-to-urban distress migration falls during drought years' },
      { label: 'Durable Assets', icon: '🏗️', description: '50 million person-days create ponds, roads, wells, schools' }
    ],
    negativeImpacts: [
      { label: 'Wage Corruption', icon: '💸', description: 'Fake beneficiaries and delayed payments steal from the poor' },
      { label: 'Low Productivity', icon: '📉', description: 'Works created often of poor quality; assets not maintained' },
      { label: 'Agricultural Labour Shortage', icon: '🌾', description: 'High MGNREGA wages pull workers from farming, raising food costs' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 55 }, soc: { base: 5, peak: 75 }, env: { base: 0, peak: 20 },
      positives: [{ label: 'Rural Income', base: 0, peak: 82 }, { label: 'Migration Fall', base: 0, peak: 65 }, { label: 'Asset Creation', base: 0, peak: 70 }],
      negatives: [{ label: 'Corruption', base: 5, peak: 70, peakAt: 0.5 }, { label: 'Low Quality', base: 5, peak: 55, peakAt: 0.55 }, { label: 'Farm Labour', base: 0, peak: 45, peakAt: 0.6 }]
    }
  },

  {
    title: 'Startup India Initiative',
    subtitle: 'Tax breaks and funding for 100,000 startups',
    category: 'Economic', icon: '🚀', color: '#f97316', accentColor: '#fb923c',
    tags: ['startup', 'innovation', 'entrepreneurship'],
    description: 'DPIIT recognition gives startups 3-year tax holiday, patent fast-track, ₹10,000 crore fund of funds, and simplified compliance.',
    targetPopulation: '100,000 startups, 1M employees',
    budget: '₹10,000 Crore (Fund of Funds)',
    duration: 72,
    sceneType: 'startup_india',
    phases: [
      { phase: 0, name: 'Ecosystem Building', monthStart: 0, monthEnd: 8, description: 'Incubators set up. Recognition portal launched. Investors mobilized.', color: '#eab308', sceneDescription: 'Co-working spaces. Incubator hubs. Investor meeting nodes.' },
      { phase: 1, name: 'Startup Boom', monthStart: 9, monthEnd: 30, description: 'Registrations surge. Unicorns emerge. Fintech, edtech, agritech thrive.', color: '#f97316', sceneDescription: 'Rocket ship startups. Unicorn icons. Funding flows. Tech hubs lit.' },
      { phase: 2, name: 'Bubble Stress', monthStart: 31, monthEnd: 50, description: 'Many startups fold. Investor winter. Talent poached by foreign firms.', color: '#ef4444', sceneDescription: 'Startup burial icons. Funding dry up. Talent exodus arrows.' },
      { phase: 3, name: 'Sustainable Ecosystem', monthStart: 51, monthEnd: 72, description: 'Profitable startups scale. IPOs. India becomes 3rd largest startup hub.', color: '#22c55e', sceneDescription: 'IPO listing nodes. Global scale arrows. India startup hub badge.' }
    ],
    positiveImpacts: [
      { label: 'Innovation Output', icon: '💡', description: 'Patents filed triple; India rises in global innovation index' },
      { label: 'Quality Jobs', icon: '💼', description: '1.5 million high-skill jobs created in startup ecosystem' },
      { label: 'GDP Contribution', icon: '📈', description: 'Startup sector contributes 7.5% of GDP by 2030' }
    ],
    negativeImpacts: [
      { label: 'Startup Failures', icon: '💀', description: '90% of startups fail within 5 years; VC money wasted' },
      { label: 'Brain Drain', icon: '✈️', description: 'Skilled founders migrate to US/Singapore for better ecosystem' },
      { label: 'Tax Holiday Misuse', icon: '🔴', description: 'Fake "startups" registered only for tax benefits' }
    ],
    cfg: {
      duration: 72,
      eco: { base: 0, peak: 70 }, soc: { base: 0, peak: 50 }, env: { base: -3, peak: -15 },
      positives: [{ label: 'Innovation', base: 0, peak: 80 }, { label: 'Jobs', base: 0, peak: 75 }, { label: 'GDP', base: 0, peak: 65 }],
      negatives: [{ label: 'Failures', base: 0, peak: 70, peakAt: 0.55 }, { label: 'Brain Drain', base: 5, peak: 55, peakAt: 0.5 }, { label: 'Tax Misuse', base: 0, peak: 40, peakAt: 0.4 }]
    }
  },

  {
    title: 'Jan Dhan Financial Inclusion',
    subtitle: 'Zero-balance bank accounts for every household',
    category: 'Economic', icon: '🏦', color: '#0891b2', accentColor: '#06b6d4',
    tags: ['banking', 'financial-inclusion', 'BPL'],
    description: 'Every unbanked household gets a zero-balance savings account with RuPay debit card, ₹2 lakh accident insurance, and ₹30,000 overdraft facility.',
    targetPopulation: '480 million unbanked citizens',
    budget: '₹1,800 Crore (operational)',
    duration: 36,
    sceneType: 'jan_dhan',
    phases: [
      { phase: 0, name: 'Account Opening Drive', monthStart: 0, monthEnd: 6, description: 'Bank mitras visit villages. 300 million accounts opened in 6 months.', color: '#eab308', sceneDescription: 'Bank Mitra kiosks. Account opening queues. RuPay card distribution.' },
      { phase: 1, name: 'DBT Flows', monthStart: 7, monthEnd: 18, description: 'Subsidies, pensions, wages flow directly to accounts. Leakage plugged.', color: '#0891b2', sceneDescription: 'Money flowing into accounts. DBT arrows from government to people.' },
      { phase: 2, name: 'Dormancy & Misuse', monthStart: 19, monthEnd: 27, description: '45% accounts go dormant. Agents create fake accounts for commission.', color: '#ef4444', sceneDescription: 'Dormant account icons. Fake account warnings. Commission fraud nodes.' },
      { phase: 3, name: 'Active Financial Inclusion', monthStart: 28, monthEnd: 36, description: 'Micro-loans, insurance, SIPs through Jan Dhan accounts. Credit history built.', color: '#22c55e', sceneDescription: 'Credit score building. Insurance shield. Micro-loan nodes. Active accounts.' }
    ],
    positiveImpacts: [
      { label: 'Banking Access', icon: '🏦', description: '480 million previously unbanked gain formal financial access' },
      { label: 'DBT Leakage Plugged', icon: '🔒', description: '₹2.23 lakh crore saved by eliminating middlemen from subsidies' },
      { label: 'Women Empowerment', icon: '👩', description: 'Women have own bank accounts — financial independence' }
    ],
    negativeImpacts: [
      { label: 'Account Dormancy', icon: '😴', description: '45% accounts go dormant; people lack funds to maintain' },
      { label: 'Agent Fraud', icon: '🕵️', description: 'Bank Mitras open fake accounts for commission; data stolen' },
      { label: 'Low Literacy Barrier', icon: '📖', description: 'Financially illiterate users misuse overdraft; fall into debt' }
    ],
    cfg: {
      duration: 36,
      eco: { base: 0, peak: 60 }, soc: { base: 5, peak: 78 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Banking Access', base: 0, peak: 92 }, { label: 'Leakage Plugged', base: 0, peak: 85 }, { label: 'Women Finance', base: 0, peak: 70 }],
      negatives: [{ label: 'Dormancy', base: 0, peak: 60, peakAt: 0.55 }, { label: 'Agent Fraud', base: 0, peak: 45, peakAt: 0.5 }, { label: 'Literacy Gap', base: 5, peak: 50, peakAt: 0.45 }]
    }
  },

  {
    title: 'Production Linked Incentive',
    subtitle: 'PLI scheme to boost domestic manufacturing',
    category: 'Economic', icon: '🏭', color: '#7c3aed', accentColor: '#8b5cf6',
    tags: ['manufacturing', 'PLI', 'make-in-india'],
    description: 'Government offers 4-6% cash incentive on incremental sales from domestic manufacturing in 14 key sectors including mobiles, pharmaceuticals, and textiles.',
    targetPopulation: '5 million manufacturing workers',
    budget: '₹1.97 Lakh Crore (5-year commitment)',
    duration: 60,
    sceneType: 'pli_scheme',
    phases: [
      { phase: 0, name: 'Industry Applications', monthStart: 0, monthEnd: 6, description: 'Companies apply for PLI benefits. Factory expansion plans drawn.', color: '#eab308', sceneDescription: 'Factory blueprints. Company application nodes. Investment announcements.' },
      { phase: 1, name: 'Factory Expansion', monthStart: 7, monthEnd: 24, description: 'New plants built. FDI flows in. Export capacity rises.', color: '#7c3aed', sceneDescription: 'Factory buildings growing. FDI flow arrows. Export cargo ships.' },
      { phase: 2, name: 'Global Competition Pressure', monthStart: 25, monthEnd: 42, description: 'Chinese competitors undercut. Some sectors struggle to meet targets.', color: '#f97316', sceneDescription: 'Competition pressure nodes. Target miss warnings. Price war icons.' },
      { phase: 3, name: 'Export Champion Phase', monthStart: 43, monthEnd: 60, description: 'Mobile phone exports triple. Pharma API self-reliance achieved.', color: '#22c55e', sceneDescription: 'Export container ships. Pharma plant nodes. Mobile export charts.' }
    ],
    positiveImpacts: [
      { label: 'Manufacturing Output', icon: '🏭', description: 'India\'s manufacturing GDP share rises from 16% to 21%' },
      { label: 'Job Creation', icon: '👷', description: '6 million direct and indirect jobs in PLI sectors' },
      { label: 'Export Growth', icon: '📦', description: 'Mobile phone exports hit $66 billion; API exports rise 40%' }
    ],
    negativeImpacts: [
      { label: 'Fiscal Risk', icon: '💰', description: 'If targets missed, ₹2 lakh crore committed with no return' },
      { label: 'Sector Concentration', icon: '🎯', description: '14 sectors benefit; rest of economy relatively neglected' },
      { label: 'Quality Concerns', icon: '⚠️', description: 'Rapid production growth sometimes sacrifices product quality' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 75 }, soc: { base: 0, peak: 50 }, env: { base: -5, peak: -25 },
      positives: [{ label: 'Manufacturing', base: 0, peak: 85 }, { label: 'Jobs', base: 0, peak: 78 }, { label: 'Exports', base: 0, peak: 80 }],
      negatives: [{ label: 'Fiscal Risk', base: 5, peak: 55, peakAt: 0.55 }, { label: 'Concentration', base: 0, peak: 45, peakAt: 0.5 }, { label: 'Quality', base: 0, peak: 35, peakAt: 0.4 }]
    }
  },

  // ───────── INFRASTRUCTURE (5 policies) ────────────────────────────────────
  {
    title: 'PM Gati Shakti National Master Plan',
    subtitle: 'Integrated multi-modal infrastructure network',
    category: 'Infrastructure', icon: '🛣️', color: '#7c3aed', accentColor: '#a78bfa',
    tags: ['roads', 'railways', 'logistics'],
    description: 'GIS-based digital platform integrates 16 ministries for coordinated infrastructure planning. Eliminates duplication and delays across road, rail, port and utility projects.',
    targetPopulation: '1.4 billion citizens',
    budget: '₹100 Lakh Crore (NIP)',
    duration: 84,
    sceneType: 'infrastructure_network',
    phases: [
      { phase: 0, name: 'Digital Integration', monthStart: 0, monthEnd: 8, description: '16 ministry data mapped on GIS. Legacy projects synchronized.', color: '#eab308', sceneDescription: 'Digital map layer appearing. Ministry data nodes connecting.' },
      { phase: 1, name: 'Project Acceleration', monthStart: 9, monthEnd: 35, description: 'Road, rail, port projects fast-tracked. Right-of-way disputes resolved faster.', color: '#7c3aed', sceneDescription: 'Highway construction animation. Rail tracks extending. Port cranes active.' },
      { phase: 2, name: 'Implementation Lag', monthStart: 36, monthEnd: 55, description: 'Land acquisition delays. Cost overruns. Environmental clearance bottlenecks.', color: '#f97316', sceneDescription: 'Construction delay nodes. Cost overrun warnings. Clearance queue.' },
      { phase: 3, name: 'Logistics Revolution', monthStart: 56, monthEnd: 84, description: 'Logistics cost drops from 14% to 9% of GDP. Trade competitiveness rises.', color: '#22c55e', sceneDescription: 'Freight corridors lit. Logistics cost counter falling. Trade volume rising.' }
    ],
    positiveImpacts: [
      { label: 'Logistics Cost', icon: '🚛', description: 'India\'s logistics cost falls from 14% to 9% of GDP — competitiveness boost' },
      { label: 'Project Speed', icon: '⚡', description: 'Infrastructure projects complete 40% faster with GIS coordination' },
      { label: 'Connectivity', icon: '🔗', description: '100% village connectivity by road; all ports linked by rail' }
    ],
    negativeImpacts: [
      { label: 'Land Acquisition', icon: '🏚️', description: 'Mass land acquisition displaces farming communities and tribals' },
      { label: 'Environmental Damage', icon: '🌲', description: 'Forest and wetland clearance for infrastructure projects' },
      { label: 'Debt Financing Risk', icon: '📉', description: 'Massive borrowing for infrastructure raises public debt levels' }
    ],
    cfg: {
      duration: 84,
      eco: { base: 0, peak: 75 }, soc: { base: 0, peak: 55 }, env: { base: -8, peak: -35 },
      positives: [{ label: 'Logistics Cost', base: 0, peak: 80 }, { label: 'Project Speed', base: 0, peak: 70 }, { label: 'Connectivity', base: 0, peak: 85 }],
      negatives: [{ label: 'Land Acquisition', base: 5, peak: 65, peakAt: 0.5 }, { label: 'Env Damage', base: 5, peak: 55, peakAt: 0.5 }, { label: 'Debt', base: 0, peak: 50, peakAt: 0.65 }]
    }
  },

  {
    title: '5G Rollout National Mission',
    subtitle: '5G connectivity across 1000 cities in 5 years',
    category: 'Infrastructure', icon: '📡', color: '#0284c7', accentColor: '#38bdf8',
    tags: ['5G', 'telecom', 'digital'],
    description: 'Government allocates spectrum, mandates tower sharing, and offers ₹26,000 crore incentive for 5G rollout. Target: every city above 100,000 population by 2026.',
    targetPopulation: '800 million mobile users',
    budget: '₹26,000 Crore + spectrum revenue',
    duration: 60,
    sceneType: 'five_g',
    phases: [
      { phase: 0, name: 'Spectrum Auction', monthStart: 0, monthEnd: 6, description: 'Spectrum auctioned to Jio, Airtel, Vi. Tower infrastructure planning.', color: '#eab308', sceneDescription: 'Spectrum wave auction. Telecom towers being placed on city map.' },
      { phase: 1, name: 'Metro Rollout', monthStart: 7, monthEnd: 24, description: '5G live in top 100 cities. Speeds hit 500Mbps. Smart city pilots.', color: '#0284c7', sceneDescription: '5G signal towers. Data speed counter. Smart city lights activating.' },
      { phase: 2, name: 'Rural Exclusion', monthStart: 25, monthEnd: 40, description: '5G only in metros; rural areas stuck on 2G/3G. Digital inequality deepens.', color: '#ef4444', sceneDescription: 'Urban-rural digital divide map. Rural darkness. Inequality nodes.' },
      { phase: 3, name: 'Universal Broadband', monthStart: 41, monthEnd: 60, description: 'BharatNet integrated. Satellite 5G in remote areas. True universal coverage.', color: '#22c55e', sceneDescription: 'Satellite beam icons. Rural village 5G activation. Equality nodes.' }
    ],
    positiveImpacts: [
      { label: 'Industry 4.0 Enablement', icon: '🤖', description: 'Smart manufacturing, autonomous logistics, telemedicine enabled' },
      { label: 'Economic Productivity', icon: '📈', description: '1% 5G penetration = 0.15% GDP growth — IMF estimate' },
      { label: 'Smart City Services', icon: '🏙️', description: 'Traffic, utilities, emergency services transform in 5G cities' }
    ],
    negativeImpacts: [
      { label: 'Rural Exclusion', icon: '🌾', description: '600 million rural Indians excluded from 5G benefits initially' },
      { label: 'Health Concerns', icon: '📡', description: 'Unresolved public concerns about RF radiation from dense towers' },
      { label: 'Security Vulnerabilities', icon: '🔓', description: 'Expanded attack surface; critical infrastructure hacking risk' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 65 }, soc: { base: 0, peak: 55 }, env: { base: -3, peak: -10 },
      positives: [{ label: 'Industry 4.0', base: 0, peak: 80 }, { label: 'GDP Growth', base: 0, peak: 65 }, { label: 'Smart Cities', base: 0, peak: 75 }],
      negatives: [{ label: 'Rural Exclusion', base: 10, peak: 72, peakAt: 0.5 }, { label: 'Health Concerns', base: 5, peak: 40, peakAt: 0.4 }, { label: 'Security', base: 0, peak: 35, peakAt: 0.55 }]
    }
  },

  {
    title: 'Smart Cities Mission',
    subtitle: '100 smart cities with integrated digital infrastructure',
    category: 'Infrastructure', icon: '🏙️', color: '#0f172a', accentColor: '#334155',
    tags: ['smart-city', 'digital', 'urban'],
    description: 'Area-based development with smart roads, intelligent traffic systems, online civic services, integrated command centres, and IoT-based utilities management.',
    targetPopulation: '100 million urban residents',
    budget: '₹2.05 Lakh Crore',
    duration: 72,
    sceneType: 'smart_city',
    phases: [
      { phase: 0, name: 'City Selection & Planning', monthStart: 0, monthEnd: 8, description: '100 cities selected via competition. SPVs formed. Master plans drawn.', color: '#eab308', sceneDescription: 'City selection map. Blueprint holograms. SPV formation icons.' },
      { phase: 1, name: 'Infrastructure Build', monthStart: 9, monthEnd: 30, description: 'Smart roads, command centers, fiber, sensors installed.', color: '#334155', sceneDescription: 'Smart road network. CCTV nodes. Command center dashboard. Fiber network.' },
      { phase: 2, name: 'Governance Gaps', monthStart: 31, monthEnd: 50, description: 'Data silos between departments. Citizens unaware of smart services.', color: '#f97316', sceneDescription: 'Silo icons. Low usage warnings. Data gap nodes. Awareness failure.' },
      { phase: 3, name: 'Smart Living Realized', monthStart: 51, monthEnd: 72, description: 'Integrated services, citizen apps, zero waste projects deliver results.', color: '#22c55e', sceneDescription: 'Citizen app nodes. Integrated dashboard. Quality of life metrics rising.' }
    ],
    positiveImpacts: [
      { label: 'Civic Service Delivery', icon: '🏛️', description: 'Permits, complaints, utilities managed digitally — 80% faster' },
      { label: 'Traffic Management', icon: '🚦', description: 'AI traffic signals cut commute time by 25% in pilot areas' },
      { label: 'Energy Efficiency', icon: '💡', description: 'Smart street lights and buildings cut municipal energy use 40%' }
    ],
    negativeImpacts: [
      { label: 'Surveillance Risk', icon: '👁️', description: 'Ubiquitous CCTV and data collection raises privacy concerns' },
      { label: 'Digital Exclusion', icon: '📵', description: 'Elderly, poor, and low-literacy citizens cannot use smart services' },
      { label: 'SPV Accountability Gap', icon: '❓', description: 'SPVs bypass democratic accountability of elected municipal bodies' }
    ],
    cfg: {
      duration: 72,
      eco: { base: 0, peak: 55 }, soc: { base: -5, peak: 60 }, env: { base: 0, peak: 40 },
      positives: [{ label: 'Services', base: 0, peak: 80 }, { label: 'Traffic', base: 0, peak: 65 }, { label: 'Energy', base: 0, peak: 70 }],
      negatives: [{ label: 'Surveillance', base: 5, peak: 55, peakAt: 0.55 }, { label: 'Digital Gap', base: 10, peak: 60, peakAt: 0.5 }, { label: 'Accountability', base: 0, peak: 45, peakAt: 0.45 }]
    }
  },

  {
    title: 'Urban Metro Expansion',
    subtitle: 'Metro rail in 50 Indian cities by 2030',
    category: 'Infrastructure', icon: '🚇', color: '#b91c1c', accentColor: '#f87171',
    tags: ['metro', 'urban-transport', 'rail'],
    description: 'Government funds 60% of metro rail projects in tier-1 and tier-2 cities. Standardised 3-coach and 6-coach systems. Feeder bus integration mandated.',
    targetPopulation: '200 million urban commuters',
    budget: '₹3.5 Lakh Crore',
    duration: 96,
    sceneType: 'metro_expansion',
    phases: [
      { phase: 0, name: 'Route Planning', monthStart: 0, monthEnd: 10, description: 'DPRs prepared. Land acquisition begins. Tenders floated.', color: '#eab308', sceneDescription: 'City map with proposed routes. Land survey activity.' },
      { phase: 1, name: 'Construction', monthStart: 11, monthEnd: 45, description: 'Tunneling, elevated sections, stations under construction.', color: '#b91c1c', sceneDescription: 'Tunnel boring machine. Elevated track being placed. Station construction.' },
      { phase: 2, name: 'Cost & Time Overruns', monthStart: 46, monthEnd: 65, description: 'Projects delayed 2-3 years. Costs double. Public frustration mounts.', color: '#f97316', sceneDescription: 'Cost overrun graph. Construction stalled sections. Angry commuter icons.' },
      { phase: 3, name: 'Operations Phase', monthStart: 66, monthEnd: 96, description: 'Metros operational. Traffic decongestion. Air quality improving. Property values rise.', color: '#22c55e', sceneDescription: 'Metro train running. Decongested roads. Green air quality. Rising property values.' }
    ],
    positiveImpacts: [
      { label: 'Traffic Decongestion', icon: '🚗', description: 'Private vehicle use falls 18% in metro corridors' },
      { label: 'Air Quality', icon: '💨', description: 'Vehicular pollution reduces in dense urban areas' },
      { label: 'Property Values', icon: '🏘️', description: 'Transit-Oriented Development raises property values 30-40% near stations' }
    ],
    negativeImpacts: [
      { label: 'Massive Cost Overruns', icon: '💰', description: 'Projects routinely cost 2-3x original estimates; debt burden rises' },
      { label: 'Land Acquisition Trauma', icon: '🏚️', description: 'Thousands of families displaced from homes and businesses' },
      { label: 'Last-Mile Gap', icon: '🚶', description: 'Without feeder connectivity, metro not accessible to all citizens' }
    ],
    cfg: {
      duration: 96,
      eco: { base: 0, peak: 55 }, soc: { base: -5, peak: 65 }, env: { base: 0, peak: 50 },
      positives: [{ label: 'Decongestion', base: 0, peak: 75 }, { label: 'Air Quality', base: 0, peak: 65 }, { label: 'Property', base: 0, peak: 70 }],
      negatives: [{ label: 'Cost Overruns', base: 5, peak: 70, peakAt: 0.55 }, { label: 'Displacement', base: 5, peak: 65, peakAt: 0.4 }, { label: 'Last Mile', base: 10, peak: 55, peakAt: 0.5 }]
    }
  },

  {
    title: 'PM Awas Yojana — Housing for All',
    subtitle: 'Affordable pucca homes for 29 million families',
    category: 'Infrastructure', icon: '🏠', color: '#ea580c', accentColor: '#fb923c',
    tags: ['housing', 'rural', 'urban-slum'],
    description: 'Government provides ₹1.2–2.5 lakh subsidy per house for construction under PMAY-G (rural) and interest subsidy under PMAY-U (urban). Beneficiary-led construction.',
    targetPopulation: '150 million houseless citizens',
    budget: '₹2.95 Lakh Crore',
    duration: 60,
    sceneType: 'housing_scheme',
    phases: [
      { phase: 0, name: 'Beneficiary Selection', monthStart: 0, monthEnd: 6, description: 'SECC data used to identify beneficiaries. AwaasSoft platform launched.', color: '#eab308', sceneDescription: 'Data selection process. Beneficiary cards being issued. Digital platform.' },
      { phase: 1, name: 'Construction Wave', monthStart: 7, monthEnd: 28, description: 'Houses built by beneficiaries with linked payments. Villages transform.', color: '#ea580c', sceneDescription: 'House frames rising. Families building homes. Village transformation.' },
      { phase: 2, name: 'Quality & Exclusion Issues', monthStart: 29, monthEnd: 42, description: 'Poorest excluded due to land ownership rules. Construction quality varies.', color: '#ef4444', sceneDescription: 'Exclusion warning nodes. Cracked wall icons. Land title disputes.' },
      { phase: 3, name: 'Habitat Transformation', monthStart: 43, monthEnd: 60, description: 'Completed houses with toilet, electricity, LPG. Dignified living achieved.', color: '#22c55e', sceneDescription: 'Complete houses glowing. Electricity and LPG connections. Family wellbeing.' }
    ],
    positiveImpacts: [
      { label: 'Housing Security', icon: '🏠', description: '29 million families move from kutcha to pucca homes' },
      { label: 'Dignified Living', icon: '✨', description: 'Toilet, electricity, LPG connections bundled with house' },
      { label: 'Women Asset Rights', icon: '👩', description: 'Mandatory female co-ownership gives women property rights' }
    ],
    negativeImpacts: [
      { label: 'Land Title Barrier', icon: '📜', description: 'Landless poor excluded; only those with land patta benefit' },
      { label: 'Quality Compromise', icon: '🏗️', description: 'Cost-driven construction produces poor quality, leaking homes' },
      { label: 'Corruption in Selection', icon: '🎭', description: 'Non-poor beneficiaries included through political influence' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 40 }, soc: { base: 5, peak: 80 }, env: { base: -3, peak: -15 },
      positives: [{ label: 'Housing', base: 0, peak: 85 }, { label: 'Dignity', base: 0, peak: 78 }, { label: 'Women Rights', base: 0, peak: 65 }],
      negatives: [{ label: 'Exclusion', base: 10, peak: 60, peakAt: 0.5 }, { label: 'Quality', base: 0, peak: 50, peakAt: 0.55 }, { label: 'Corruption', base: 0, peak: 55, peakAt: 0.45 }]
    }
  },

  // ───────── SOCIAL (5 policies) ────────────────────────────────────────────
  {
    title: 'Direct Benefit Transfer Pension',
    subtitle: 'Monthly ₹3,000 pension for all elderly poor',
    category: 'Social', icon: '👴', color: '#78716c', accentColor: '#a8a29e',
    tags: ['pension', 'elderly', 'welfare'],
    description: 'Monthly pension of ₹3,000 transferred directly to bank accounts of citizens above 60 years below poverty line. Aadhaar-linked, biometric verified.',
    targetPopulation: '80 million senior citizens',
    budget: '₹28,800 Crore/year',
    duration: 48,
    sceneType: 'pension_scheme',
    phases: [
      { phase: 0, name: 'Registration Drive', monthStart: 0, monthEnd: 5, description: 'Aadhaar-based enrollment. Biometric authentication at CSCs.', color: '#eab308', sceneDescription: 'Senior citizen registration camp. Biometric scan. Bank account linking.' },
      { phase: 1, name: 'Pension Flows', monthStart: 6, monthEnd: 20, description: 'Monthly payments reach accounts. Elderly dignity and purchasing power rise.', color: '#78716c', sceneDescription: 'Money flowing to elderly homes. Dignity icons. Market spending up.' },
      { phase: 2, name: 'Ghost Beneficiary Crisis', monthStart: 21, monthEnd: 33, description: 'Dead beneficiaries still receiving pension. Identity fraud detected.', color: '#ef4444', sceneDescription: 'Ghost beneficiary warning. Fraud audit nodes. Identity mismatch alerts.' },
      { phase: 3, name: 'Real-Time Verification', monthStart: 34, monthEnd: 48, description: 'Annual life certificate via face authentication. Leakage sealed.', color: '#22c55e', sceneDescription: 'Face-auth verification. Clean payment flows. Elderly wellbeing metrics.' }
    ],
    positiveImpacts: [
      { label: 'Elder Dignity', icon: '🙏', description: 'Elderly can meet basic needs without depending on family' },
      { label: 'Consumption Boost', icon: '🛒', description: 'Local market spending increases in villages with pension recipients' },
      { label: 'Health Spend Enabled', icon: '💊', description: 'Elderly use pension to buy medicines previously unaffordable' }
    ],
    negativeImpacts: [
      { label: 'Fraud & Ghosts', icon: '👻', description: '12% of pension paid to dead people or identity fraudsters' },
      { label: 'Biometric Failure', icon: '🖐️', description: 'Elderly with worn fingerprints cannot authenticate' },
      { label: 'Inflation Erosion', icon: '📉', description: '₹3,000 not revised for years; real value falls with inflation' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 30 }, soc: { base: 5, peak: 80 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Elder Dignity', base: 0, peak: 85 }, { label: 'Consumption', base: 0, peak: 65 }, { label: 'Health Spend', base: 0, peak: 60 }],
      negatives: [{ label: 'Fraud', base: 0, peak: 55, peakAt: 0.5 }, { label: 'Biometric Fail', base: 5, peak: 40, peakAt: 0.45 }, { label: 'Inflation', base: 0, peak: 35, peakAt: 0.7 }]
    }
  },

  {
    title: 'Beti Bachao Beti Padhao',
    subtitle: 'Save the girl child — education and survival',
    category: 'Social', icon: '👧', color: '#ec4899', accentColor: '#f472b6',
    tags: ['gender', 'girl-child', 'sex-ratio'],
    description: 'Multi-ministry campaign in 640 districts to improve child sex ratio, prevent gender-biased sex selection, and ensure girl child education and survival.',
    targetPopulation: '400 million women and girls',
    budget: '₹848 Crore/year',
    duration: 60,
    sceneType: 'beti_bachao',
    phases: [
      { phase: 0, name: 'Awareness Campaign', monthStart: 0, monthEnd: 6, description: 'Media campaigns, school programs, community meetings. CSR involvement.', color: '#eab308', sceneDescription: 'Billboard campaigns. Community meetings. School awareness programs.' },
      { phase: 1, name: 'Behavior Change', monthStart: 7, monthEnd: 24, description: 'Sex ratio at birth improves in target districts. School enrollment rises.', color: '#ec4899', sceneDescription: 'Sex ratio meter improving. Girl enrollment rising. Community celebrations.' },
      { phase: 2, name: 'Implementation Gap', monthStart: 25, monthEnd: 38, description: 'Funds spent on advertising over field action. Impact overstated.', color: '#f97316', sceneDescription: 'Ad budget nodes vs field action gap. Audit findings. Shallow impact.' },
      { phase: 3, name: 'Structural Reforms', monthStart: 39, monthEnd: 60, description: 'PCPNDT enforcement strengthened. Girls\' toilets, safety measures added.', color: '#22c55e', sceneDescription: 'Legal enforcement nodes. Safe school design. Long-term ratio trend up.' }
    ],
    positiveImpacts: [
      { label: 'Sex Ratio Improvement', icon: '📊', description: 'Child sex ratio improves from 918 to 934 per 1000 boys in target districts' },
      { label: 'Girl Enrollment', icon: '🏫', description: 'Female school enrollment rises 11% in BBBP focus districts' },
      { label: 'Social Attitude Shift', icon: '🤝', description: 'Community acceptance of girl child measurably improves' }
    ],
    negativeImpacts: [
      { label: 'Advertising Over Action', icon: '📺', description: '56% of scheme funds spent on advertising, not field programs' },
      { label: 'Geographic Limitation', icon: '📍', description: 'Focus on 640 districts leaves rest of India uncovered' },
      { label: 'Root Cause Unaddressed', icon: '⚠️', description: 'Patriarchal systems and dowry demand — the causes — remain unchanged' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 20 }, soc: { base: 5, peak: 72 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Sex Ratio', base: 0, peak: 70 }, { label: 'Girl Enroll.', base: 0, peak: 65 }, { label: 'Attitudes', base: 0, peak: 60 }],
      negatives: [{ label: 'Ad Over Action', base: 10, peak: 55, peakAt: 0.45 }, { label: 'Coverage Gap', base: 5, peak: 45, peakAt: 0.5 }, { label: 'Root Cause', base: 15, peak: 60, peakAt: 0.6 }]
    }
  },

  {
    title: 'PM Ujjwala LPG Scheme',
    subtitle: 'Free LPG connections for BPL women',
    category: 'Social', icon: '🍳', color: '#f97316', accentColor: '#fb923c',
    tags: ['LPG', 'clean-cooking', 'women'],
    description: '90 million free LPG connections to BPL households. Eliminates indoor air pollution from cooking on biomass. Women are primary beneficiaries.',
    targetPopulation: '450 million BPL household members',
    budget: '₹12,800 Crore',
    duration: 48,
    sceneType: 'ujjwala',
    phases: [
      { phase: 0, name: 'Connection Distribution', monthStart: 0, monthEnd: 8, description: 'LPG connections, cylinders and stoves distributed at camps.', color: '#eab308', sceneDescription: 'Distribution camp. Cylinder delivery trucks. Connection kit handover.' },
      { phase: 1, name: 'Clean Cooking Begins', monthStart: 9, monthEnd: 22, description: 'Women switch from wood fire to LPG. Indoor air quality improves immediately.', color: '#f97316', sceneDescription: 'Clean flame on LPG stove. Wood fire dying out. Clean air nodes.' },
      { phase: 2, name: 'Refill Affordability Crisis', monthStart: 23, monthEnd: 35, description: 'Cylinder refill costs too high for BPL families. Reverting to wood.', color: '#ef4444', sceneDescription: 'Empty cylinder icons. High cost warning. Wood fire returning. Health reversal.' },
      { phase: 3, name: 'Subsidy Stabilization', monthStart: 36, monthEnd: 48, description: 'PAHAL subsidy makes refills affordable. Sustained clean cooking adoption.', color: '#22c55e', sceneDescription: 'Subsidy transfer icon. Regular refill cycle. Lung health nodes improving.' }
    ],
    positiveImpacts: [
      { label: 'Indoor Air Quality', icon: '💨', description: 'Indoor PM2.5 drops 70%; respiratory disease incidents fall' },
      { label: 'Women\'s Health', icon: '❤️', description: 'Women spared from smoke inhalation equivalent to 400 cigarettes/day' },
      { label: 'Deforestation Reduction', icon: '🌲', description: 'Firewood demand falls; pressure on forests reduces significantly' }
    ],
    negativeImpacts: [
      { label: 'Refill Cost Barrier', icon: '💸', description: 'Market-price refills unaffordable; families return to wood fires' },
      { label: 'Subsidy Exclusion', icon: '❌', description: 'Price subsidy targeting errors leave genuine poor without support' },
      { label: 'Cylinder Safety', icon: '⚠️', description: 'Poor households lack safety training; cylinder accidents reported' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 25 }, soc: { base: 5, peak: 78 }, env: { base: 5, peak: 55 },
      positives: [{ label: 'Air Quality', base: 0, peak: 85 }, { label: 'Women Health', base: 0, peak: 82 }, { label: 'Forest Saving', base: 0, peak: 60 }],
      negatives: [{ label: 'Refill Cost', base: 0, peak: 70, peakAt: 0.52 }, { label: 'Exclusion', base: 5, peak: 45, peakAt: 0.45 }, { label: 'Safety', base: 0, peak: 35, peakAt: 0.4 }]
    }
  },

  {
    title: 'National Social Security for Gig Workers',
    subtitle: 'Insurance and pension for platform economy workers',
    category: 'Social', icon: '🛵', color: '#7c3aed', accentColor: '#a78bfa',
    tags: ['gig-workers', 'platform-economy', 'social-security'],
    description: 'First-ever legislation giving gig workers (Ola, Swiggy, Zomato, etc.) access to accident insurance, health cover, and contributory pension scheme.',
    targetPopulation: '15 million gig workers',
    budget: '₹3,200 Crore',
    duration: 36,
    sceneType: 'gig_workers',
    phases: [
      { phase: 0, name: 'Registration Portal', monthStart: 0, monthEnd: 4, description: 'e-Shram portal opens. Gig workers register. Platform firms mandated to contribute.', color: '#eab308', sceneDescription: 'Delivery worker registration. e-Shram portal. Platform app integration.' },
      { phase: 1, name: 'Benefits Begin', monthStart: 5, monthEnd: 18, description: 'Accident claims processed. Healthcare coverage activated. Pension accounts opened.', color: '#7c3aed', sceneDescription: 'Delivery worker with insurance shield. Hospital access. Pension account.' },
      { phase: 2, name: 'Platform Resistance', monthStart: 19, monthEnd: 27, description: 'Platforms reclassify workers to avoid contribution. Legal battles begin.', color: '#ef4444', sceneDescription: 'Legal battle nodes. Worker reclassification icons. Platform vs state.' },
      { phase: 3, name: 'New Labor Contract', monthStart: 28, monthEnd: 36, description: 'Supreme Court ruling. Platforms comply. Global model emerges.', color: '#22c55e', sceneDescription: 'Court ruling icon. Global attention nodes. Worker dignity metrics.' }
    ],
    positiveImpacts: [
      { label: 'Worker Safety Net', icon: '🛡️', description: '15 million gig workers get first-ever accident and health protection' },
      { label: 'Pension Wealth', icon: '💰', description: 'Workers build retirement corpus through contributory scheme' },
      { label: 'Platform Accountability', icon: '⚖️', description: 'Platforms legally responsible for worker welfare — global precedent' }
    ],
    negativeImpacts: [
      { label: 'Platform Evasion', icon: '🔴', description: 'Companies reclassify workers as "partners" to avoid contributions' },
      { label: 'Registration Barrier', icon: '📱', description: 'Unregistered informal workers excluded from coverage' },
      { label: 'Gig Cost Rise', icon: '📈', description: 'Increased platform costs may raise delivery and ride prices for users' }
    ],
    cfg: {
      duration: 36,
      eco: { base: 0, peak: 30 }, soc: { base: 5, peak: 75 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Safety Net', base: 0, peak: 82 }, { label: 'Pension', base: 0, peak: 65 }, { label: 'Accountability', base: 0, peak: 60 }],
      negatives: [{ label: 'Evasion', base: 0, peak: 65, peakAt: 0.55 }, { label: 'Exclusion', base: 10, peak: 50, peakAt: 0.5 }, { label: 'Cost Rise', base: 0, peak: 40, peakAt: 0.6 }]
    }
  },

  {
    title: 'PDS Digital Ration Reform',
    subtitle: 'Biometric Aadhaar-linked ration for food security',
    category: 'Social', icon: '🌾', color: '#78350f', accentColor: '#d97706',
    tags: ['PDS', 'ration', 'food-security'],
    description: 'Aadhaar-linked biometric authentication at ration shops. One Nation One Ration Card enables portability across states. Fair price shops go digital.',
    targetPopulation: '800 million NFSA beneficiaries',
    budget: '₹2.06 Lakh Crore/year',
    duration: 48,
    sceneType: 'pds_reform',
    phases: [
      { phase: 0, name: 'Digitization', monthStart: 0, monthEnd: 6, description: 'ePoS machines at all ration shops. Biometric authentication pilot.', color: '#eab308', sceneDescription: 'ePoS machine installation. Biometric devices at ration shops.' },
      { phase: 1, name: 'Leakage Reduction', monthStart: 7, monthEnd: 22, description: 'Ghost beneficiaries deleted. Grain diversion falls. Real beneficiaries get food.', color: '#78350f', sceneDescription: 'Grain flowing to real beneficiaries. Ghost deletion. Diversion arrows cut.' },
      { phase: 2, name: 'Exclusion Errors', monthStart: 23, monthEnd: 35, description: 'Biometric failures deny ration to real beneficiaries. Starvation incidents.', color: '#ef4444', sceneDescription: 'Authentication failure icons. Denied ration warning. Hunger nodes.' },
      { phase: 3, name: 'Portable & Inclusive', monthStart: 36, monthEnd: 48, description: 'One Nation One Ration Card fully operational. Migrant workers covered.', color: '#22c55e', sceneDescription: 'Migrant worker using ration in new city. Portability map. Food security.' }
    ],
    positiveImpacts: [
      { label: 'Leakage Reduction', icon: '🔒', description: '₹17,000 crore annual saving from elimination of fake beneficiaries' },
      { label: 'Migrant Portability', icon: '🗺️', description: 'Migrant workers access ration anywhere in India — life-changing' },
      { label: 'Food Security', icon: '🍚', description: '800 million people reliably receive subsidized food grain' }
    ],
    negativeImpacts: [
      { label: 'Biometric Exclusion', icon: '✋', description: 'Manual laborers with worn fingerprints denied food — exclusion error' },
      { label: 'Connectivity Dependency', icon: '📶', description: 'Rural areas with poor internet face authentication failures' },
      { label: 'Privacy Risk', icon: '🔓', description: 'Centralized biometric data of 800M people — massive privacy risk' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 30 }, soc: { base: 5, peak: 82 }, env: { base: 0, peak: 8 },
      positives: [{ label: 'Leakage Cut', base: 0, peak: 85 }, { label: 'Portability', base: 0, peak: 70 }, { label: 'Food Security', base: 5, peak: 88 }],
      negatives: [{ label: 'Bio Exclusion', base: 0, peak: 60, peakAt: 0.5 }, { label: 'Connectivity', base: 5, peak: 50, peakAt: 0.45 }, { label: 'Privacy', base: 0, peak: 40, peakAt: 0.55 }]
    }
  },

  // ───────── AGRICULTURE (5 policies) ───────────────────────────────────────
  {
    title: 'PM-KISAN Direct Income Support',
    subtitle: '₹6,000/year direct transfer to all farmers',
    category: 'Agriculture', icon: '🌾', color: '#65a30d', accentColor: '#a3e635',
    tags: ['farmers', 'income-support', 'DBT'],
    description: 'All land-holding farmer families receive ₹2,000 every 4 months directly into bank accounts. 110 million beneficiaries. No conditionality.',
    targetPopulation: '110 million farmer families',
    budget: '₹65,000 Crore/year',
    duration: 48,
    sceneType: 'pm_kisan',
    phases: [
      { phase: 0, name: 'Land Record Verification', monthStart: 0, monthEnd: 5, description: 'State land records digitized. Farmer authentication. Exclusions defined.', color: '#eab308', sceneDescription: 'Land record digitization. Farmer verification camps. Exclusion list processing.' },
      { phase: 1, name: 'Payments Begin', monthStart: 6, monthEnd: 20, description: 'First installments released. Farm input purchasing power rises.', color: '#65a30d', sceneDescription: 'Money flowing to farmer accounts. Seeds and tools being bought. Farm flourishing.' },
      { phase: 2, name: 'Exclusion & Leakage', monthStart: 21, monthEnd: 33, description: 'Ineligible beneficiaries included. Tenant farmers excluded. Fragmentation issues.', color: '#ef4444', sceneDescription: 'Ineligible recipient icons. Tenant farmer exclusion. Audit warning nodes.' },
      { phase: 3, name: 'Consolidated Support', monthStart: 34, monthEnd: 48, description: 'e-KYC clean-up. Tenant farmers included via state supplementation.', color: '#22c55e', sceneDescription: 'Clean beneficiary list. Tenant inclusion icons. Sustained farm productivity.' }
    ],
    positiveImpacts: [
      { label: 'Farm Income Supplement', icon: '💵', description: '₹6,000/year is meaningful for small farmers with ₹50,000 annual income' },
      { label: 'Input Purchase Power', icon: '🌱', description: 'Farmers can buy seeds, fertilizers, and tools ahead of season' },
      { label: 'Rural Consumption', icon: '🛒', description: 'PM-KISAN funds boost village economy through consumption spending' }
    ],
    negativeImpacts: [
      { label: 'Tenant Farmer Exclusion', icon: '🚫', description: '60% of actual cultivators are tenants — excluded from scheme' },
      { label: 'Inadequate Amount', icon: '📉', description: '₹6,000 covers only 10% of average farm input costs — inadequate' },
      { label: 'Inclusion of Ineligibles', icon: '🎭', description: 'Income tax payers and government employees found in beneficiary list' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 40 }, soc: { base: 5, peak: 65 }, env: { base: 0, peak: 5 },
      positives: [{ label: 'Income Support', base: 0, peak: 75 }, { label: 'Input Power', base: 0, peak: 65 }, { label: 'Rural Spend', base: 0, peak: 70 }],
      negatives: [{ label: 'Tenant Exclusion', base: 15, peak: 65, peakAt: 0.5 }, { label: 'Inadequate', base: 10, peak: 55, peakAt: 0.55 }, { label: 'Ineligibles', base: 0, peak: 50, peakAt: 0.45 }]
    }
  },

  {
    title: 'Fasal Bima Crop Insurance',
    subtitle: 'Weather-indexed crop insurance for all farmers',
    category: 'Agriculture', icon: '🌦️', color: '#0284c7', accentColor: '#38bdf8',
    tags: ['insurance', 'crops', 'weather'],
    description: 'PMFBY insures farmers against crop loss from weather, pests and disease. Premium capped at 2% for kharif and 1.5% for rabi crops. Satellite assessment.',
    targetPopulation: '55 million enrolled farmers',
    budget: '₹15,000 Crore/year',
    duration: 48,
    sceneType: 'crop_insurance',
    phases: [
      { phase: 0, name: 'Enrollment Season', monthStart: 0, monthEnd: 4, description: 'Bank-linked enrollment. Premium deducted. Satellite baseline captured.', color: '#eab308', sceneDescription: 'Bank enrollment camp. Satellite mapping farm areas. Premium deduction.' },
      { phase: 1, name: 'Normal Season Claims', monthStart: 5, monthEnd: 20, description: 'Floods/drought trigger claims. Quick payouts via DBT. Farmer relief.', color: '#0284c7', sceneDescription: 'Flood damage scene. Satellite assessing crops. Payout flowing to farmer.' },
      { phase: 2, name: 'Claim Delay & Insurer Profit', monthStart: 21, monthEnd: 33, description: 'Insurance companies delay claims. Low-loss years yield huge profits for insurers.', color: '#ef4444', sceneDescription: 'Claim delay warning nodes. Insurance company profit. Farmer protest.' },
      { phase: 3, name: 'Parametric Reform', monthStart: 34, monthEnd: 48, description: 'Automatic weather-index triggers. No delay. Farmer trust rebuilt.', color: '#22c55e', sceneDescription: 'Weather sensor automatic trigger. Instant payment. Farmer confidence restored.' }
    ],
    positiveImpacts: [
      { label: 'Disaster Relief', icon: '🌊', description: 'Crop loss compensation reaches farmers within 2 months of disaster' },
      { label: 'Credit Access', icon: '🏦', description: 'Banks lend more confidently to insured farmers' },
      { label: 'Farming Continuity', icon: '🌱', description: 'Insured farmers replant after disaster; uninsured often quit farming' }
    ],
    negativeImpacts: [
      { label: 'Claim Delays', icon: '⏳', description: 'Average claim settlement takes 8-12 months — too late to help' },
      { label: 'Insurer Windfall', icon: '💰', description: 'In good years, insurers keep massive premium without paying claims' },
      { label: 'Small Farmer Exclusion', icon: '🚜', description: 'Unbanked or leasehold farmers cannot enroll for coverage' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 40 }, soc: { base: 0, peak: 65 }, env: { base: 0, peak: 10 },
      positives: [{ label: 'Disaster Relief', base: 0, peak: 75 }, { label: 'Credit Access', base: 0, peak: 60 }, { label: 'Continuity', base: 0, peak: 65 }],
      negatives: [{ label: 'Claim Delay', base: 5, peak: 65, peakAt: 0.5 }, { label: 'Insurer Profit', base: 0, peak: 55, peakAt: 0.55 }, { label: 'Exclusion', base: 10, peak: 50, peakAt: 0.45 }]
    }
  },

  {
    title: 'Drip Irrigation Mission',
    subtitle: 'Micro-irrigation to save 50% water in agriculture',
    category: 'Agriculture', icon: '💧', color: '#0891b2', accentColor: '#22d3ee',
    tags: ['irrigation', 'water', 'efficiency'],
    description: 'Government subsidizes 55-75% of drip and sprinkler irrigation system costs. Per Drop More Crop component of PMKSY. Target: 10 million hectares.',
    targetPopulation: '20 million farmer families',
    budget: '₹50,000 Crore',
    duration: 60,
    sceneType: 'drip_irrigation',
    phases: [
      { phase: 0, name: 'System Installation', monthStart: 0, monthEnd: 8, description: 'Subsidy applications. Vendor empanelment. Drip pipes installed on farms.', color: '#eab308', sceneDescription: 'Drip pipes being laid. Subsidy forms. Field technician installation.' },
      { phase: 1, name: 'Water Efficiency Gains', monthStart: 9, monthEnd: 25, description: 'Water use drops 50%. Same yield. Farmers save on electricity.', color: '#0891b2', sceneDescription: 'Drip pipes watering crops precisely. Water meter saving. Groundwater recovering.' },
      { phase: 2, name: 'Maintenance Gaps', monthStart: 26, monthEnd: 40, description: 'Drip pipes clog or break. Maintenance costs unaffordable for small farmers.', color: '#ef4444', sceneDescription: 'Clogged pipe icons. System failure. Small farmer struggling. Repair cost warning.' },
      { phase: 3, name: 'Precision Agriculture Era', monthStart: 41, monthEnd: 60, description: 'IoT soil sensors + drip systems. Data-driven irrigation. Yield and income rise.', color: '#22c55e', sceneDescription: 'Soil sensors. Smart irrigation dashboard. Yield counter rising. Water table stable.' }
    ],
    positiveImpacts: [
      { label: 'Water Saved', icon: '💧', description: '40-60% reduction in irrigation water use per hectare' },
      { label: 'Yield Increase', icon: '📈', description: 'Consistent moisture availability increases crop yield by 20-25%' },
      { label: 'Groundwater Recovery', icon: '🏞️', description: 'Aquifer levels stabilize as flood irrigation replaced by drip' }
    ],
    negativeImpacts: [
      { label: 'Maintenance Burden', icon: '🔧', description: 'Smallholder farmers cannot afford maintenance of complex systems' },
      { label: 'Capital Intensive', icon: '💰', description: 'Even 55% subsidy leaves ₹40,000-60,000 cost per hectare' },
      { label: 'Crop Suitability', icon: '🌿', description: 'Drip irrigation most efficient for horticulture; less effective for paddy' }
    ],
    cfg: {
      duration: 60,
      eco: { base: 0, peak: 45 }, soc: { base: 0, peak: 55 }, env: { base: 5, peak: 75 },
      positives: [{ label: 'Water Saved', base: 0, peak: 80 }, { label: 'Yield Up', base: 0, peak: 65 }, { label: 'GW Recovery', base: 0, peak: 70 }],
      negatives: [{ label: 'Maintenance', base: 0, peak: 55, peakAt: 0.5 }, { label: 'Capital Cost', base: 5, peak: 50, peakAt: 0.4 }, { label: 'Crop Fit', base: 5, peak: 35, peakAt: 0.45 }]
    }
  },

  {
    title: 'Organic Farming Mission',
    subtitle: 'Chemical-free farming for 10 million hectares',
    category: 'Agriculture', icon: '🌱', color: '#16a34a', accentColor: '#4ade80',
    tags: ['organic', 'chemicals', 'health'],
    description: 'Subsidy for organic certification, bio-inputs and market access. Paramparagat Krishi Vikas Yojana clusters 50 farmers per group.',
    targetPopulation: '10 million farmers',
    budget: '₹7,500 Crore',
    duration: 60,
    sceneType: 'organic_farming',
    phases: [
      { phase: 0, name: 'Cluster Formation', monthStart: 0, monthEnd: 6, description: 'Farmer clusters formed. Training in compost, bio-pesticides. Baseline soil testing.', color: '#eab308', sceneDescription: 'Farmer group meeting. Compost pits. Bio-input training. Soil testing.' },
      { phase: 1, name: 'Transition Phase', monthStart: 7, monthEnd: 24, description: 'Farmers stop chemicals. Yield temporarily drops 20-30%. Trust tested.', color: '#f97316', sceneDescription: 'Reduced yield charts. Farmer anxiety. Soil recovering. Organic input use.' },
      { phase: 2, name: 'Certification & Market', monthStart: 25, monthEnd: 40, description: 'PGS-India certified. Premium market access. Export opportunities open.', color: '#16a34a', sceneDescription: 'Certification badge appearing. Premium market stall. Export node. Soil thriving.' },
      { phase: 3, name: 'Ecosystem Recovery', monthStart: 41, monthEnd: 60, description: 'Soil carbon up. Groundwater cleaner. Biodiversity returns. Premium incomes sustained.', color: '#22c55e', sceneDescription: 'Rich soil animation. Birds and insects. Carbon sequestration nodes. Farmer income.' }
    ],
    positiveImpacts: [
      { label: 'Soil Health', icon: '🌍', description: 'Soil organic matter increases 30% over 5 years in converted farms' },
      { label: 'Premium Income', icon: '💰', description: 'Organic produce commands 25-40% price premium in domestic and export markets' },
      { label: 'Environmental Health', icon: '🌿', description: 'Reduced pesticide runoff improves river and groundwater quality' }
    ],
    negativeImpacts: [
      { label: 'Transition Yield Drop', icon: '📉', description: 'Yield falls 20-30% in first 2-3 years as soil microbiome recovers' },
      { label: 'Market Access Gap', icon: '🏪', description: 'Rural organic farmers struggle to reach premium urban consumers' },
      { label: 'Certification Cost', icon: '📋', description: 'Certification process expensive and bureaucratic for small farmers' }
    ],
    cfg: {
      duration: 60,
      eco: { base: -5, peak: 45 }, soc: { base: 0, peak: 55 }, env: { base: 5, peak: 85 },
      positives: [{ label: 'Soil Health', base: 0, peak: 85 }, { label: 'Premium Income', base: 0, peak: 65 }, { label: 'Env Health', base: 0, peak: 80 }],
      negatives: [{ label: 'Yield Drop', base: 25, peak: 50, peakAt: 0.3 }, { label: 'Market Gap', base: 5, peak: 55, peakAt: 0.5 }, { label: 'Cert Cost', base: 5, peak: 40, peakAt: 0.45 }]
    }
  },

  {
    title: 'e-NAM Agricultural Markets',
    subtitle: 'Online trading platform linking 1000 mandis',
    category: 'Agriculture', icon: '📲', color: '#059669', accentColor: '#34d399',
    tags: ['market', 'mandi', 'digital-trade'],
    description: 'National Agriculture Market (e-NAM) links all regulated mandis digitally. Farmers can sell produce online to buyers across India. Price discovery democratized.',
    targetPopulation: '58 million farmer sellers',
    budget: '₹415 Crore (platform)',
    duration: 48,
    sceneType: 'e_nam',
    phases: [
      { phase: 0, name: 'Mandi Digitization', monthStart: 0, monthEnd: 6, description: 'ePoS and weighing machines integrated. Assaying labs set up. App trained.', color: '#eab308', sceneDescription: 'Mandi digital setup. Weighing machine integration. Assay lab building.' },
      { phase: 1, name: 'Online Trading Begins', monthStart: 7, monthEnd: 22, description: 'Farmers list produce. Competitive bidding. Price discovery improving.', color: '#059669', sceneDescription: 'Digital auction screen. Multiple buyers bidding. Farmer watching price rise.' },
      { phase: 2, name: 'Local Cartel Resistance', monthStart: 23, monthEnd: 33, description: 'Local traders resist e-NAM. APMC laws allow exclusion. Adoption stalls.', color: '#ef4444', sceneDescription: 'Trader protest icons. APMC barrier nodes. Low adoption in many states.' },
      { phase: 3, name: 'National Market Emerges', monthStart: 34, monthEnd: 48, description: 'Agriculture Market Reform Act passed. Interstate trade free. Farmer income up.', color: '#22c55e', sceneDescription: 'National market map. Free interstate arrows. Price disparity closing. Farm income.' }
    ],
    positiveImpacts: [
      { label: 'Price Discovery', icon: '📊', description: 'Farmers get 15-20% higher price through competitive online bidding' },
      { label: 'Market Reach', icon: '🗺️', description: 'Farmers access buyers from across India without leaving their village' },
      { label: 'Mandi Efficiency', icon: '⚡', description: 'Transaction costs fall; weighing and payment disputes eliminated' }
    ],
    negativeImpacts: [
      { label: 'Trader Cartel Resistance', icon: '🚫', description: 'Entrenched local traders block adoption; violence in some mandis' },
      { label: 'Digital Literacy Gap', icon: '📱', description: 'Elderly farmers cannot use the app; rely on middlemen again' },
      { label: 'Logistics Not Resolved', icon: '🚛', description: 'Even with price discovery, post-harvest logistics remain a barrier' }
    ],
    cfg: {
      duration: 48,
      eco: { base: 0, peak: 50 }, soc: { base: 0, peak: 60 }, env: { base: 0, peak: 8 },
      positives: [{ label: 'Price Discovery', base: 0, peak: 80 }, { label: 'Market Reach', base: 0, peak: 70 }, { label: 'Efficiency', base: 0, peak: 65 }],
      negatives: [{ label: 'Cartel', base: 5, peak: 65, peakAt: 0.5 }, { label: 'Digital Gap', base: 10, peak: 55, peakAt: 0.5 }, { label: 'Logistics', base: 10, peak: 50, peakAt: 0.55 }]
    }
  }

];

// ensure each seeded policy has an _id for fallback usage
POLICIES_DATA.forEach((p, i) => {
  if (!p._id) p._id = `seed-${i}`;
});

async function seed({ connect = false, exitOnComplete = false } = {}) {
  if (connect) {
    await mongoose.connect(MONGO_URI);
  }
  console.log('Connected to MongoDB');

  // Clear existing seeded data
  await Policy.deleteMany({ isSeeded: true });
  await Category.deleteMany({});

  // Insert categories
  const catDocs = await Category.insertMany(CATEGORIES);
  console.log(`✅ Inserted ${catDocs.length} categories`);

  // Build policies with full impact data
  const policiesToInsert = POLICIES_DATA.map(p => {
    const { cfg, ...rest } = p;
    const impactData = makeImpactData(cfg);
    const combined = impactData.map(d => d.economic + d.social + d.environmental);
    const peakMonth = combined.indexOf(Math.max(...combined));
    const netScore = Math.round(Math.max(...combined) / 3);
    const cat = catDocs.find(c => c.name === p.category);
    return {
      ...rest,
      impactData,
      peakMonth,
      netScore,
      categoryId: cat?._id,
      isSeeded: true
    };
  });

  const inserted = await Policy.insertMany(policiesToInsert);
  console.log(`✅ Inserted ${inserted.length} policies`);

  // Update category counts
  for (const cat of catDocs) {
    const count = await Policy.countDocuments({ category: cat.name, isSeeded: true });
    await Category.findByIdAndUpdate(cat._id, { policyCount: count });
  }

  console.log('🎉 Seeding complete!');

  if (exitOnComplete) {
    process.exit(0);
  }
}

async function ensureSeeded() {
  const [policyCount, categoryCount] = await Promise.all([
    Policy.countDocuments({ isSeeded: true }),
    Category.countDocuments({}),
  ]);

  if (policyCount > 0 && categoryCount > 0) {
    return false;
  }

  await seed({ connect: false, exitOnComplete: false });
  return true;
}

if (require.main === module) {
  seed({ connect: true, exitOnComplete: true }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { seed, ensureSeeded, POLICIES_DATA, CATEGORIES };
