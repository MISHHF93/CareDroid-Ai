

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  Search, 
  Calculator, 
  BookOpen, 
  AlertCircle,
  User,
  Moon,
  Sun
} from "lucide-react";
import OfflineIndicator from "@/components/OfflineIndicator";
import MobileLayout from "@/components/MobileLayout";
import { useIsMobile } from "@/hooks/useMobile";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [darkMode, setDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('careDroidDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  React.useEffect(() => {
    localStorage.setItem('careDroidDarkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Home") },
    { name: "Search", icon: Search, path: createPageUrl("Search") },
    { name: "Saved", icon: BookOpen, path: createPageUrl("SavedQueries") },
    { name: "Library", icon: BookOpen, path: createPageUrl("Library") },
    { name: "Profile", icon: User, path: createPageUrl("Profile") }
  ];

  // Use mobile layout on mobile devices
  if (isMobile) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <MobileLayout>
          <OfflineIndicator />
          {children}
        </MobileLayout>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <style>{`
        :root {
          --clinical-blue: #0066CC;
          --clinical-blue-dark: #004C99;
          --clinical-green: #00A86B;
          --clinical-red: #DC3545;
          --clinical-amber: #FFA500;
          --neutral-50: #FAFAFA;
          --neutral-100: #F5F5F5;
          --neutral-200: #E5E5E5;
          --neutral-800: #262626;
          --neutral-900: #171717;
        }

        .dark {
          --neutral-50: #171717;
          --neutral-100: #262626;
          --neutral-200: #404040;
          --neutral-800: #E5E5E5;
          --neutral-900: #FAFAFA;
        }

        body {
          font-family: -apple-system, BlinkMacMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .nav-blur {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-50 transition-colors duration-200">
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-800/90 nav-blur border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 tracking-tight">
                  CareDroid
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Clinical Reference</p>
              </div>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-neutral-600" />
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-16 pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-800/95 nav-blur border-t border-neutral-200 dark:border-neutral-700 safe-area-bottom">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  <item.icon 
                    className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} 
                  />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

