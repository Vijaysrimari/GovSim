# GovSim — Government Policy 3D Simulation Platform

A beautiful MERN stack application with **35 real Indian government policies**, each with a **story-driven 3D Three.js scene** that shows how the policy works, deploys, and what positive AND negative effects emerge over time.

---

## 🎯 What This Does

- **35 policies** across 7 categories (Education, Healthcare, Environment, Economic, Infrastructure, Social, Agriculture)
- **Story-driven 3D scenes** — not generic models. Each policy gets its own world:
  - Free WiFi for Schools → school building, WiFi rings pulsing from routers, data packets flying to students, distraction nodes emerging
  - Solar Rooftop → neighborhood with panels on rooftops, turbines spinning, EV cars, CO2 bubbles fading
  - Mid-Day Meal → school kitchen, steam rising, students in queue with plates
  - MGNREGA → workers building check dams, roads, wage payment kiosk
  - ... and 31 more
- **4-phase lifecycle** per policy: Setup → Positive wave → Negative emergence → Equilibrium
- **Live impact meters**: economic, social, environmental + per-effect bars
- **Playable timeline**: drag to any month or press Simulate to auto-play
- JWT authentication, MongoDB storage, REST API

---

## 🚀 Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd govsim
npm run install-all
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Seed the Database (35 policies + 7 categories)

```bash
npm run seed
```

### 4. Run Development

```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

---

## 📁 Project Structure

```
govsim/
├── server/
│   ├── index.js              # Express entry point
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── models/
│   │   ├── Policy.js         # Policy schema (phases, impactData, effects)
│   │   └── User.js           # User + Category schemas
│   ├── routes/
│   │   ├── auth.js           # Register, login, me
│   │   ├── policies.js       # CRUD + simulation data
│   │   ├── simulations.js
│   │   └── categories.js
│   └── data/
│       └── seed.js           # 35 policies with full impact curves
│
└── client/
    └── src/
        ├── App.js            # Router + AuthContext
        ├── pages/
        │   ├── Landing.js    # Public landing page
        │   ├── Login.js      # Auth
        │   ├── Register.js
        │   ├── Dashboard.js  # Stats + categories + recent policies
        │   ├── PolicyLibrary.js  # Browse + filter + detail panel
        │   └── SimulationView.js # Full 3D simulation page
        ├── components/
        │   ├── layout/
        │   │   └── Layout.js # Sidebar navigation
        │   └── 3d/
        │       └── PolicyScene3D.js  # THREE.js engine + all scene builders
        └── services/
            └── api.js        # Axios instance
```

---

## 🎨 The 35 Policies

### Education (5)
1. Free WiFi for School Students
2. Mid-Day Meal Scheme
3. Digital Classroom Initiative
4. Free Higher Education for Girls
5. National Coding in Schools

### Healthcare (5)
6. Universal Health Coverage
7. National Vaccination Drive
8. Mental Health in Schools
9. Swachh Bharat Mission
10. Ayushman Bharat PM-JAY

### Environment (5)
11. Solar Rooftop for Every Home
12. Plastic Ban Policy
13. National Electric Vehicle Mission
14. National Afforestation Programme
15. Jal Jeevan Mission

### Economic (5)
16. GST Simplified for MSMEs
17. MGNREGA Employment Guarantee
18. Startup India Initiative
19. Jan Dhan Financial Inclusion
20. Production Linked Incentive (PLI)

### Infrastructure (5)
21. PM Gati Shakti National Master Plan
22. 5G Rollout National Mission
23. Smart Cities Mission
24. Urban Metro Expansion
25. PM Awas Yojana — Housing for All

### Social (5)
26. Direct Benefit Transfer Pension
27. Beti Bachao Beti Padhao
28. PM Ujjwala LPG Scheme
29. National Social Security for Gig Workers
30. PDS Digital Ration Reform

### Agriculture (5)
31. PM-KISAN Direct Income Support
32. Fasal Bima Crop Insurance
33. Drip Irrigation Mission
34. Organic Farming Mission
35. e-NAM Agricultural Markets

---

## 🔧 Tech Stack

- **Frontend**: React 18, React Router v6, Three.js r155
- **Backend**: Node.js, Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Styling**: Custom CSS with CSS variables (dark theme)
- **Fonts**: Syne + IBM Plex Mono + Instrument Serif (Google Fonts)

---

## 🔑 Demo Login

After seeding, create an account at `/register` or use the seed script to add a demo user:

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const {User} = require('./server/models/User');
mongoose.connect(process.env.MONGODB_URI).then(async()=>{
  await User.create({name:'Demo Analyst',email:'admin@govsim.in',password:'password123',role:'admin'});
  console.log('Demo user created'); process.exit(0);
})
"
```

---

## 🎮 How to Use

1. **Landing** → Click "Get Started" → Register account
2. **Dashboard** → See all 7 categories with policy counts
3. **Policy Library** → Browse all 35 policies, filter by category, search by name
4. Click any policy → **Detail panel** opens with phases, positive/negative impacts
5. Click **"Simulate in 3D"** → Full simulation view opens
6. **Drag timeline** or click **▶ Simulate** → Watch the 3D scene evolve
7. Click **phase cards** to jump to any policy lifecycle phase
8. Watch **impact meters** update in real-time as the scene changes

---

## License

MIT
