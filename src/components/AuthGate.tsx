import { useState, useEffect } from 'react';
import firebase from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import LandingPage from './LandingPage';
import Login from './Login';
import AdminLogin from './AdminLogin';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import type { User as AppUser } from '../types';

interface AuthGateProps {
  children?: React.ReactNode;
}

type AuthProvider = 'supabase' | 'firebase' | null;

const AuthGate = ({ children }: AuthGateProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminSession, setAdminSession] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'admin' | 'onboarding' | 'dashboard'>('landing');
  const [authProvider, setAuthProvider] = useState<AuthProvider>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const getSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (currentView === 'landing' || showLogin) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      const savedTheme = localStorage.getItem('theme') || 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(savedTheme);
    }
  }, [currentView, showLogin]);

  useEffect(() => {
    const initAuth = async () => {
      const storedAdminSession = localStorage.getItem('admin_session');
      if (storedAdminSession) {
        verifyAdminSession(storedAdminSession);
      }

      const supabaseConfigured = isSupabaseConfigured();
      
      if (supabaseConfigured) {
        console.log('🔐 Using Supabase Auth');
        setAuthProvider('supabase');
        
        const session = await getSupabaseSession();
        
        if (session) {
          setSupabaseUser(session.user);
          const appUser: AppUser = {
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            photoURL: session.user.user_metadata?.avatar_url || undefined,
            uid: session.user.id,
            isAdmin: false,
            plan: 'free'
          };
          setUser(appUser);
          setCurrentView('dashboard');
        } else {
          setCurrentView('landing');
        }
        setAuthLoading(false);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          if (session) {
            setSupabaseUser(session.user);
            const appUser: AppUser = {
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              photoURL: session.user.user_metadata?.avatar_url || undefined,
              uid: session.user.id,
              isAdmin: false,
              plan: 'free'
            };
            setUser(appUser);
            setCurrentView('dashboard');
          } else {
            setSupabaseUser(null);
            setUser(null);
            setCurrentView('landing');
          }
          setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
      } else {
        console.log('🔐 Using Firebase Auth');
        setAuthProvider('firebase');
        
        const unsubscribe = firebase.auth?.onAuthStateChanged?.((firebaseUser: any) => {
          if (firebaseUser) {
            setFirebaseUser(firebaseUser);
            const isNewUser = !firebaseUser.displayName;
            setNeedsOnboarding(isNewUser);
            
            const appUser: AppUser = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              uid: firebaseUser.uid,
              isAdmin: false,
              plan: 'free'
            };
            
            setUser(appUser);
            setCurrentView(isNewUser ? 'onboarding' : 'dashboard');
          } else {
            setUser(null);
            setFirebaseUser(null);
            setNeedsOnboarding(false);
            if (currentView !== 'admin') {
              setCurrentView('landing');
            }
          }
          
          setAuthLoading(false);
        });

        return () => unsubscribe?.();
      }
    };

    initAuth();
  }, []);

  const verifyAdminSession = async (sessionToken: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
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
          headers: { 'Authorization': `Bearer ${adminSession}` }
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
      if (authProvider === 'supabase') {
        await supabase.auth.signOut();
      } else if (firebase.auth) {
        await firebase.auth.signOut();
      }
      setUser(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
          onLogin={() => setShowLogin(false)}
          onClose={() => {
            setShowLogin(false);
            setCurrentView('landing');
          }}
        />
      </div>
    );
  }

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

  if (currentView === 'onboarding' && (firebaseUser || supabaseUser)) {
    return (
      <Onboarding 
        user={supabaseUser || firebaseUser}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (currentView === 'dashboard' && user) {
    return <Dashboard />;
  }

  return (
    <LandingPage 
      onGetStarted={handleGetStarted}
      onAdminLogin={() => setShowAdminLogin(true)}
    />
  );
};

export default AuthGate;
