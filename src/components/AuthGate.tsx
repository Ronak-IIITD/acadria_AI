import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import LandingPage from './LandingPage';
import Login from './Login';
import AdminLogin from './AdminLogin';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import Header from './Header';
import type { User } from '../types';

interface AuthGateProps {
  children?: React.ReactNode;
}

const AuthGate = ({ children }: AuthGateProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminSession, setAdminSession] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'admin' | 'onboarding' | 'dashboard'>('landing');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    // Check for admin session in localStorage
    const storedAdminSession = localStorage.getItem('admin_session');
    if (storedAdminSession) {
      verifyAdminSession(storedAdminSession);
    }

    // Firebase auth listener
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          
          // Check if user needs onboarding (no display name = new user)
          const isNewUser = !firebaseUser.displayName;
          setNeedsOnboarding(isNewUser);
          
          const user: User = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined,
            uid: firebaseUser.uid,
            isAdmin: false,
            plan: 'free'
          };
          
          setUser(user);
          
          if (isNewUser) {
            setCurrentView('onboarding');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
          setNeedsOnboarding(false);
          // Keep showing landing page if no user
          if (currentView !== 'admin') {
            setCurrentView('landing');
          }
        }
        
        setAuthLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Firebase not available - should not happen in production
      console.error('❌ Firebase Auth not available');
      setAuthLoading(false);
    }
  }, []);

  const verifyAdminSession = async (sessionToken: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.is_admin) {
          setAdminSession(sessionToken);
          setUser({
            name: 'Administrator',
            email: data.email,
            photoURL: undefined,
            uid: 'admin',
            isAdmin: true,
            plan: 'admin',
            privileges: data.privileges
          });
          setCurrentView('dashboard');
          setAuthLoading(false);
        }
      } else {
        // Invalid session, clear it
        localStorage.removeItem('admin_session');
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
      localStorage.removeItem('admin_session');
    }
  };

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('admin_session', data.session_token);
        setAdminSession(data.session_token);
        setUser({
          name: 'Administrator',
          email: data.admin.email,
          photoURL: undefined,
          uid: 'admin',
          isAdmin: true,
          plan: 'admin',
          privileges: data.admin.privileges
        });
        setShowAdminLogin(false);
        setCurrentView('dashboard');
        return true;
      }
    } catch (error) {
      console.error('Admin login failed:', error);
    }
    return false;
  };

  const handleAdminLogout = async () => {
    if (adminSession) {
      try {
        await fetch(`${BACKEND_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminSession}`
          }
        });
      } catch (error) {
        console.error('Admin logout error:', error);
      }
    }
    localStorage.removeItem('admin_session');
    setAdminSession(null);
    setUser(null);
    setCurrentView('landing');
  };

  const handleGetStarted = () => {
    setShowLogin(true);
    setCurrentView('login');
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      if (auth && typeof auth.signOut === 'function') {
        await auth.signOut();
      }
      setUser(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Acadira AI...</p>
        </div>
      </div>
    );
  }

  // Show Admin Login
  if (showAdminLogin) {
    return (
      <AdminLogin 
        onLogin={handleAdminLogin}
        onCancel={() => {
          setShowAdminLogin(false);
          setCurrentView('landing');
        }}
      />
    );
  }

  // Show Regular Login Modal
  if (showLogin) {
    return (
      <div className="min-h-screen bg-white">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => {
              setShowLogin(false);
              setCurrentView('landing');
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
        <Login 
          onClose={() => {
            setShowLogin(false);
            setCurrentView('landing');
          }}
        />
      </div>
    );
  }

  // Show Landing Page (no forced login)
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={handleGetStarted}
        onAdminLogin={() => {
          setShowAdminLogin(true);
          setCurrentView('admin');
        }}
      />
    );
  }

  // Show Onboarding for new users
  if (currentView === 'onboarding' && firebaseUser) {
    return (
      <Onboarding 
        user={firebaseUser}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show Dashboard for authenticated users (regular or admin)
  if (currentView === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={user} 
          onLogout={handleLogout}
          onAdminLogout={user.isAdmin ? handleAdminLogout : undefined}
        />
        <Dashboard 
          user={user}
        />
      </div>
    );
  }

  // Fallback to landing
  return (
    <LandingPage 
      onGetStarted={handleGetStarted}
      onAdminLogin={() => setShowAdminLogin(true)}
    />
  );
};

export default AuthGate;
