import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to extend session on user activity
 */
export const useSessionActivity = () => {
  const { extendSession, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      extendSession();
    };

    // Attach listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [extendSession, isAuthenticated]);
};

export default useSessionActivity;
