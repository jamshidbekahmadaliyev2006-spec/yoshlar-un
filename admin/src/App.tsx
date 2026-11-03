import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AppRouter } from './router';
import { Toast } from './components/ui/Toast';

export const App: React.FC = () => {
  const [route, setRoute] = useState<string>(() => {
    return window.location.hash.slice(1) || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = window.location.hash.slice(1) || 'dashboard';
      setRoute(newRoute);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newRoute: string) => {
    window.location.hash = newRoute;
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('dashboard');
    }
  };

  return (
    <>
      {/* Orqa fon auralari */}
      <div className="aur" aria-hidden="true">
        <i />
        <i />
      </div>

      <div className="shell">
        <Sidebar currentRoute={route} onNavigate={navigate} />

        <main className="main">
          <Topbar currentRoute={route} onNavigate={navigate} onBack={handleBack} />
          <div id="pg">
            <AppRouter currentRoute={route} onNavigate={navigate} />
          </div>
        </main>
      </div>

      <Toast />
    </>
  );
};

export default App;

