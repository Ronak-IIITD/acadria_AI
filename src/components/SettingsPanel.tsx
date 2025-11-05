import { useState, useContext, FC } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: 'account' | 'personalization' | 'billing' | 'data') => void;
  activeSection: 'account' | 'personalization' | 'billing' | 'data';
}

const SettingsPanel: FC<SettingsPanelProps> = ({ isOpen, onClose, onNavigate, activeSection }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [userName, setUserName] = useState('Aizen');
  const [userEmail] = useState('aizenjod7047@gmail.com');
  const [language, setLanguage] = useState('English');
  const [chatModel, setChatModel] = useState('Auto');

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden"
          style={{ background: 'var(--color-bg-primary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div className="w-60 border-r flex flex-col" style={{ 
            background: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border-light)' 
          }}>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Close settings"
              >
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-2 space-y-1">
              <button
                onClick={() => onNavigate('account')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeSection === 'account' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Account</span>
              </button>

              <button
                onClick={() => onNavigate('personalization')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeSection === 'personalization' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Personalization</span>
              </button>

              <button
                onClick={() => onNavigate('billing')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeSection === 'billing' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Plan & Billing</span>
              </button>

              <button
                onClick={() => onNavigate('data')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeSection === 'data' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Data Controls</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="p-6 space-y-6">
                {/* Complete Profile Banner */}
                <div className="rounded-xl p-4 flex items-center justify-between" style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Complete Profile</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Get personalized contents</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                    Complete →
                  </button>
                </div>

                {/* Name */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Name</label>
                    <button className="text-sm" style={{ color: 'var(--color-accent-primary)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-base" style={{ color: 'var(--color-text-primary)' }}>{userName}</div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Email</label>
                  <div className="text-base" style={{ color: 'var(--color-text-primary)' }}>{userEmail}</div>
                </div>

                {/* Date Created */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Date Created</label>
                  <div className="text-base" style={{ color: 'var(--color-text-primary)' }}>October 22, 2025</div>
                </div>

                {/* Streaks */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Streaks</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>1</span>
                  </div>
                </div>

                {/* Content Count */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Content Count</label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>5</span>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>15% Off - Referral Link</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Invite friends, get 15% off for 1 month per referral ⓘ
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors" style={{
                      borderColor: 'var(--color-border-medium)',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-elevated)'
                    }}>
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Personalization Section */}
            {activeSection === 'personalization' && (
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Personalization</h2>

                {/* Language */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border-medium)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="English">🇺🇸 🇬🇧 English</option>
                    <option value="Spanish">🇪🇸 Spanish</option>
                    <option value="French">🇫🇷 French</option>
                    <option value="German">🇩🇪 German</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      if ((e.target.value === 'dark' && theme === 'light') || (e.target.value === 'light' && theme === 'dark')) {
                        toggleTheme();
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border-medium)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="light">☀️ Light</option>
                    <option value="dark">🌙 Dark</option>
                  </select>
                </div>

                {/* Chat Model */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-primary)' }}>Chat Model</label>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border-medium)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="Auto">Auto</option>
                    <option value="gemini-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-pro">Gemini 2.5 Pro</option>
                    <option value="grok">Grok 4</option>
                  </select>
                </div>
              </div>
            )}

            {/* Plan & Billing Section */}
            {activeSection === 'billing' && (
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Plan & Billing</h2>
                
                <div className="rounded-xl p-6 border" style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border-medium)'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upgrade</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        You are currently on the free plan
                      </p>
                    </div>
                    <button className="px-6 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors hover:bg-white/5" style={{
                      borderColor: 'var(--color-border-medium)',
                      color: 'var(--color-text-primary)'
                    }}>
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Controls Section */}
            {activeSection === 'data' && (
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Data Controls</h2>
                
                <div className="rounded-xl p-6 border" style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border-medium)'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Account</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <button className="px-6 py-2.5 rounded-lg text-sm font-medium border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
