import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { useAuthStore } from './store/authStore';

function App() {
  const { pathname } = useLocation();
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <AppRouter />
    </div>
  );
}

export default App;
