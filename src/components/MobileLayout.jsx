import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import NavMobile from './NavMobile';

const MobileLayout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if app is installed as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${isStandalone ? 'pt-safe-top' : ''}`}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-primary/80 transition-colors min-h-touch min-w-touch"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1 className="text-lg font-semibold">CareDroid</h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="fixed top-0 left-0 h-full w-64 bg-background shadow-lg transform animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Menu</h2>
            </div>
            
            <nav className="p-4 space-y-2">
              {[
                { label: 'Home', path: '/Home' },
                { label: 'Drug Database', path: '/DrugDatabase' },
                { label: 'Drug Interactions', path: '/DrugInteractions' },
                { label: 'Calculators', path: '/Calculators' },
                { label: 'Protocols', path: '/Protocols' },
                { label: 'Emergency', path: '/Emergency' },
                { label: 'Lab Values', path: '/LabValues' },
                { label: 'Lab Interpreter', path: '/LabInterpreter' },
                { label: 'Procedures', path: '/Procedures' },
                { label: 'Algorithms', path: '/Algorithms' },
                { label: 'Differential Dx', path: '/DifferentialDx' },
                { label: 'Clinical Pearls', path: '/ClinicalPearls' },
                { label: 'Quick Reference', path: '/QuickReference' },
                { label: 'Library', path: '/Library' },
                { label: 'Profile', path: '/Profile' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block p-3 rounded-lg hover:bg-accent transition-colors touch-feedback"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Enhanced Bottom Navigation */}
      <NavMobile />
    </div>
  );
};

MobileLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MobileLayout;