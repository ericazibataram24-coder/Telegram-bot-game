import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onSuccess?: () => void;
}

export function AuthModal({ onSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Email / Password Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else {
        alert('Account created! Check your email for confirmation if required.');
        if (onSuccess) onSuccess();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  // Google OAuth Handler
  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isSignUp ? 'Join as a Creator' : 'Welcome Back'}
      </h2>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleAuth}
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-all mb-4 shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </button>

      <div className="relative flex py-3 items-center my-2">
        <div className="flex-grow border-t border-slate-700"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-medium">Or email</span>
        <div className="flex-grow border-t border-slate-700"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50"
        >
          {loading ? 'Connecting...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-4">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-amber-400 font-medium hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
