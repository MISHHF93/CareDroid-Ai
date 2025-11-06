# CareDroid Clinical Companion

100% Open-Source Clinical Decision Support Application built with React + Vite.

## 🚀 Quick Start

```powershell
npm install
npm start
```

The app runs completely offline with local mock data - no API keys required!

## ✨ Features

- **Clinical Protocols** - Evidence-based treatment guidelines
- **Drug Database** - Medication information and interactions
- **Medical Calculators** - CHADS2, Wells, GFR, BMI calculators
- **Lab Interpreter** - Lab value reference ranges
- **AI Workflow Assistant** - Smart clinical recommendations
- **Audit Logging** - HIPAA compliance tracking
- **Procedures** - Step-by-step clinical procedures

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **UI**: Tailwind CSS + Radix UI components
- **State**: React Query (@tanstack/react-query)
- **Routing**: React Router v7
- **Data**: Local mock data (no backend required!)
- **Optional**: OpenAI API for real AI responses

## 📦 100% Open Source

No proprietary dependencies! Uses only standard open-source libraries:
- Native `fetch` API for HTTP requests
- React Query for data management
- Local storage for persistence
- Optional OpenAI integration (bring your own key)

## 🔧 Configuration

### Optional: Real AI Responses

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-...
   ```
3. In `src/api/apiClient.js`, set `USE_LOCAL_DATA = false`

Without an API key, the app uses intelligent mock responses.

## 📝 Scripts

```powershell
npm start      # Start dev server (alias for npm run dev)
npm run dev    # Start dev server
npm run build  # Build for production
npm run lint   # Run ESLint
npm run preview # Preview production build
```

## 🏗️ Project Structure

```
src/
├── api/
│   ├── apiClient.js       # API client (local mock data)
│   ├── mockData.js        # Clinical mock data
│   ├── entities.js        # Entity exports
│   └── integrations.js    # Integration exports
├── components/            # Reusable UI components
├── pages/                 # Route pages
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities
```

## 🎨 UI Components

Built with shadcn/ui components on top of Radix UI primitives:
- Fully accessible (WAI-ARIA)
- Customizable with Tailwind
- Dark mode support

## 🔒 Data & Privacy

- All data stored locally (localStorage)
- No external data transmission (unless using OpenAI API)
- HIPAA-compliant audit logging
- No analytics or tracking

## 🚢 Deployment

Build for production:

```powershell
npm run build
```

The `dist/` folder contains static files ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 📄 License

MIT License - Free to use and modify!

## 🆘 Support

This is a fully self-contained application with no external dependencies or support services required.