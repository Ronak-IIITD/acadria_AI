import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import AIBookIcon from './icons/AIBookIcon';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onClose: () => void;
}

const Login = ({ onLogin, onClose }: LoginProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔑 Attempting Google sign-in with popup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google sign-in successful:', result.user.email);
      
      const user: User = {
        name: result.user.displayName || 'User',
        email: result.user.email || '',
      };
      
      // Call onLogin callback
      onLogin(user);
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        setError(
          'Popup was blocked by your browser. Please allow popups for this site and try again.\n\n' +
          'Or try using a different browser.'
        );
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed popup, just clear loading state
        console.log('User cancelled popup');
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        console.error('❌ Unauthorized domain:', currentDomain);
        setError(
          `Domain "${currentDomain}" is not authorized.\n\n` +
          `To fix this:\n` +
          `1. Go to Firebase Console → Authentication → Settings\n` +
          `2. Add "${currentDomain}" to Authorized domains\n` +
          `3. If using localhost, ensure both "localhost" and "127.0.0.1" are added`
        );
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/configuration-not-found') {
        setError('Firebase configuration error. Please ensure Google Sign-In is enabled in Firebase Console.');
      } else if (error.code === 'auth/invalid-api-key') {
        setError('Invalid Firebase API key. Please check your environment variables.');
      } else {
        setError(error.message || 'Failed to sign in with Google. Please try again.');
      }

      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const user: User = {
        name: result.user.displayName || email.split('@')[0],
        email: result.user.email || email,
      };
      onLogin(user);
    } catch (error: any) {
      console.error('Email auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 flex items-center justify-center z-[100] animate-fade-in"
        style={{ 
          background: 'linear-gradient(180deg, rgba(53, 208, 195, 0.03) 0%, rgba(139, 147, 212, 0.05) 50%, rgba(139, 147, 212, 0.03) 100%)',
          backgroundColor: 'var(--color-bg-primary)'
        }}
        aria-modal="true"
        role="dialog"
    >
      {/* Close button - Top Right */}
      <button 
          onClick={onClose} 
          className="absolute top-8 right-8 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Close login dialog"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative text-center max-w-md w-full px-6">

        {/* Logo */}
        <div className="mb-8">
          <div 
            className="inline-flex p-4 rounded-2xl mb-4"
            style={{ backgroundColor: 'rgba(53, 208, 195, 0.12)' }}
          >
            <AIBookIcon className="h-12 w-12" style={{ color: '#35d0c3' }} />
          </div>
        </div>
        
        {/* Header */}
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {isSignUp ? 'Create Account' : 'Welcome back'}
        </h2>
        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Let's continue your learning journey.
        </p>
        
        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full font-medium py-3.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
          style={{
            backgroundColor: 'var(--color-surface-soft)',
            border: '1px solid var(--color-border-light)',
            color: 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--color-border-light)' }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>
              or continue with
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                backgroundColor: 'var(--color-surface-soft)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                backgroundColor: 'var(--color-surface-soft)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div 
              className="text-sm p-3 rounded-lg"
              style={{ 
                color: 'var(--color-error)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #35d0c3 0%, #8b93d4 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(53, 208, 195, 0.3)',
            }}
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <p style={{ color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;