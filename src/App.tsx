import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Header from './components/Header';
import AnimatedGradientBackground from './components/AnimatedGradientBackground';
import ErrorBoundary from './components/ErrorBoundary';
import type { User } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // Add loading state

  // Listen to Firebase auth state changes
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener...');

    // Check if Firebase auth is available
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.warn('⚠️  Firebase auth not available, skipping auth listener');
      setAuthLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
      if (firebaseUser) {
        console.log('✅ User is signed in:', firebaseUser.email);

        // Create user object from Firebase user
        const user: User = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
        };

        setUser(user);

        // Check if we should navigate to dashboard
        const storedView = localStorage.getItem('studysync_last_view');
        if (storedView === 'dashboard') {
          setCurrentView('dashboard');
        }
      } else {
        console.log('❌ No user signed in');
        setUser(null);
        setCurrentView('landing');
      }

      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  // Save user to localStorage when it changes (legacy support)
  useEffect(() => {
    if (user) {
      localStorage.setItem('studysync_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studysync_user');
    }
  }, [user]);

  // Save current view to localStorage
  useEffect(() => {
    localStorage.setItem('studysync_last_view', currentView);
  }, [currentView]);

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      console.log('📊 User already logged in, navigating to dashboard');
      setCurrentView('dashboard');
    } else {
      console.log('🔑 No user, showing login modal');
      setShowLogin(true);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    console.log('✅ Login successful, navigating to dashboard:', loggedInUser.email);
    setUser(loggedInUser);
    setShowLogin(false);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    console.log('👋 Logging out user...');
    try {
      await auth.signOut();
      console.log('✅ User signed out successfully');
      setUser(null);
      setCurrentView('landing');
      localStorage.removeItem('studysync_user');
      localStorage.removeItem('studysync_last_view');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <AnimatedGradientBackground>
        <div className="app-container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-t-2" 
                 style={{ borderColor: '#35d0c3' }}></div>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Loading...
            </p>
          </div>
        </div>
      </AnimatedGradientBackground>
    );
  }

  return (
    <ErrorBoundary>
      <AnimatedGradientBackground>
        <div className="app-container">
          {/* Header - shown on all views */}
          {currentView === 'landing' && (
            <Header
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => setShowLogin(true)}
              isScrolled={isScrolled}
            />
          )}

          {/* Main Content */}
          <ErrorBoundary>
            {currentView === 'landing' ? (
              <LandingPage onGetStarted={handleGetStarted} />
            ) : (
              <Dashboard />
            )}
          </ErrorBoundary>

          {/* Login Modal */}
          {showLogin && (
            <Login
              onLogin={handleLogin}
              onClose={() => setShowLogin(false)}
            />
          )}
        </div>
      </AnimatedGradientBackground>
    </ErrorBoundary>
  );
}

export default App;
