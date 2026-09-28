import React, { useState } from 'react';
import { BookOpen, Lock, Mail, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { addToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
        addToast('success', 'Welcome! Account created with sample notes.');
      } else {
        await login(email, password);
        addToast('success', 'Logged in successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const demoEmail = 'demo@dailynotes.app';
    const demoPass = 'demo1234';

    try {
      // Try login first
      await login(demoEmail, demoPass);
      addToast('success', 'Logged in to Demo account!');
    } catch (loginErr) {
      // If demo account does not exist yet, register it!
      try {
        await register(demoEmail, demoPass, 'Demo User');
        addToast('success', 'Demo account created and initialized!');
      } catch (regErr) {
        setErrorMsg('Could not initialize demo account: ' + regErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md">
        
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Daily Notes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture, upload, and organize your daily work.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 shadow-xl border border-slate-200/80 dark:border-slate-800">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                isRegister
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-2xl text-sm font-bold shadow-md shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Want to quickly explore without creating an account?
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore Demo Account (1-Click)</span>
            </button>
          </div>

        </div>

        {/* Privacy Note */}
        <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Your notes are private and stored securely in SQLite.</span>
        </div>

      </div>
    </div>
  );
}
