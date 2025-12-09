# UniCash Web - Customer Frontend

Customer-facing website for UniCash prize draw platform built with Next.js 14, TypeScript, and TailwindCSS.

## 🚀 Features

- **Homepage**: Hero section, How it Works, Membership Plans, Featured Draws, Recent Winners
- **Giveaways**: Browse all prize draws with filtering (All, Bonus Only, Open)
- **Draw Detail**: Full draw information with countdown, entry options, and related draws
- **Boost Packs**: Purchase additional credits with three tier options
- **Winners**: Public list of verified winners with proof
- **About**: Company information, mission, vision, and principles
- **FAQ**: Comprehensive frequently asked questions

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **API Client**: Axios
- **Backend API**: unicash-api (NestJS)

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.env.local` (blocked by .gitignore but you can view content):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:3002
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Server runs on: **http://localhost:3002**

## 📁 Project Structure

```
unicash-web/
├── app/
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── giveaways/
│   │   ├── page.tsx            # Giveaways list
│   │   └── [id]/page.tsx       # Draw detail
│   ├── boost-packs/page.tsx    # Boost packs
│   ├── winners/page.tsx         # Winners list
│   ├── about/page.tsx           # About page
│   └── faq/page.tsx             # FAQ page
├── components/
│   ├── Header.tsx               # Navigation header
│   ├── Footer.tsx               # Footer
│   ├── DrawCard.tsx             # Draw card component
│   ├── MembershipCard.tsx       # Membership plan card
│   └── BoostPackCard.tsx        # Boost pack card
├── lib/
│   └── api.ts                   # API client
└── layout/                      # Design mockups (images)
```

## 🎨 Components

### Header
- Logo and navigation
- User credits display
- Login/Signup buttons

### Footer
- Quick links
- Legal links
- Social media icons

### DrawCard
- Draw image and title
- Credits per entry
- Progress bar
- Entry button with states (open, entered, sold out, closed)

### MembershipCard
- Plan tiers (Basic, Premium, Elite)
- Monthly price and credits
- Feature list
- CTA button

### BoostPackCard
- Pack name and price
- Credit amount
- Feature highlights
- Purchase button

## 🔌 API Integration

The website connects to `unicash-api` running on port 3000:

### Available Endpoints

**Draws:**
- `GET /draws` - List all draws
- `GET /draws/:id` - Get draw details
- `POST /draws/:id/enter` - Enter a draw

**Membership:**
- `GET /membership/plans` - List membership plans
- `GET /membership/boost-packs` - List boost packs
- `POST /membership/subscribe` - Subscribe to a plan

**Users:**
- `GET /users/profile` - Get user profile
- `GET /users/credits` - Get credit balance

**Auth:**
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /auth/me` - Get current user

## 🎯 Pages Overview

### Homepage (/)
- Hero section with main CTA
- How it Works (3 steps)
- Membership Plans (3 tiers)
- Featured Draws (grid of 6)
- Recent Winners
- Newsletter signup

### Giveaways (/giveaways)
- Featured draw spotlight
- Filter tabs (All, Bonus Only, Open)
- Draw grid
- Major reward section
- How it Works
- FAQ

### Draw Detail (/giveaways/[id])
- Countdown timer
- Image gallery
- Entry card with progress
- Tabs: Overview, Prize Details, Rules, FAQs
- Related draws

### Boost Packs (/boost-packs)
- Hero section
- 3 tier pricing cards
- How it Works
- FAQ section

### Winners (/winners)
- Verified winners list
- Ranking with user info
- Prize details and dates
- Verification information

### About (/about)
- Company overview
- Mission statement
- Vision
- Core principles

### FAQ (/faq)
- Categorized questions
- Expandable details
- Contact support CTA

## 🚦 Running All Services

To run the complete UniCash platform:

1. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

2. **Start API (port 3000):**
   ```bash
   cd unicash-api
   npm run dev
   ```

3. **Start Admin (port 3001):**
   ```bash
   cd unicash-admin
   npm run dev
   ```

4. **Start Web (port 3002):**
   ```bash
   cd unicash-web
   npm run dev
   ```

## 🎨 Design System

### Colors
- **Primary**: Purple shades (#8b5cf6, #7c3aed, #6d28d9)
- **Accent**: Indigo (#6366f1)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#fbbf24)

### Typography
- **Headings**: Bold, large sizes
- **Body**: System fonts with good readability

### Components
- Rounded corners (lg: 0.5rem, xl: 0.75rem)
- Shadows for depth
- Hover effects and transitions
- Gradient backgrounds for hero sections

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Responsive grid layouts
- Mobile navigation menu (to be implemented)

## 🔐 Security Notes

- API calls use Bearer token authentication
- Tokens stored in localStorage
- CORS enabled for localhost:3002
- All payments through Stripe

## 📝 Next Steps

- [ ] Implement authentication flow
- [ ] Add user dashboard
- [ ] Integrate Stripe checkout
- [ ] Add real-time countdown timers
- [ ] Implement WebSocket for live draw updates
- [ ] Add image upload for draw images
- [ ] Mobile menu implementation
- [ ] Add loading states and error handling
- [ ] Implement notification system
- [ ] Add user entry history

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

## 📄 License

See LICENSE file in the repository root.
