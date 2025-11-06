import React from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '../hooks/useMobile';

const PWAInstallPrompt = () => {
  const { isInstallable, installPWA } = usePWA();
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    // Show install prompt after a delay if app is installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="mobile-card animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Download className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Install CareDroid</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Install CareDroid for quick access and offline functionality
          </p>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleInstall}
              className="flex-1 touch-feedback"
              size="sm"
            >
              Install
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPrompt(false)}
              className="touch-feedback"
              size="sm"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;