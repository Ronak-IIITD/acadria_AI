import { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import type { User } from './types';
import AnimatedGradientBackground from './components/AnimatedGradientBackground';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('chatHistory');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const openLoginModal = useCallback(() => {
    setIsLoginOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  if (isLoading) {
    return (
      <AnimatedGradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-2 border-gray-200 dark:border-gray-700 border-t-purple-400 dark:border-t-purple-500 mx-auto"></div>
            <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
          </div>
        </div>
      </AnimatedGradientBackground>
    );
  }

  return (
    <AnimatedGradientBackground>
      <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200 isolate">
        {!user && <Header user={user} onLogout={handleLogout} onLoginClick={openLoginModal} isScrolled={isScrolled} />}
        <main className={user ? 'h-screen' : ''}>
          {user ? (
            <Dashboard />
          ) : (
            <LandingPage onGetStarted={openLoginModal} />
          )}
        </main>
        {isLoginOpen && <Login onLogin={handleLogin} onClose={closeLoginModal} />}
      </div>
    </AnimatedGradientBackground>
  );
};

export default App;