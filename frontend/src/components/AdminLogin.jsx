import React, { useState } from 'react';
import { api } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLogin({ onLogin, isAdmin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New States
  const [view, setView] = useState('login'); // 'login' or 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Redirect if already logged in
  if (isAdmin) {
    window.location.hash = '#/admin';
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.login(username, password);
      onLogin(data.user, data.token);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError('');
      setForgotSuccess('');
      
      const res = await api.forgotPassword(forgotEmail);
      setForgotSuccess(res.message || 'If this email is registered, a password reset link has been sent.');
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'An error occurred while processing your request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gold/3 blur-[100px] -bottom-20 -right-20"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10">
        {view === 'login' ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold/35 bg-gold/5 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)] overflow-hidden">
                <img 
                  src="/MY3Logo.jpg" 
                  className="w-full h-full object-contain rounded-full" 
                  alt="Mythri Restaurant Logo" 
                />
              </div>
              <h2 className="text-2xl font-bold font-serif text-white tracking-wide">Admin Portal</h2>
              <p className="text-zinc-500 text-sm mt-1">Mythri Family Restaurant</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/10 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
                  placeholder="e.g., joelramireddy@gmail.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setForgotEmail('');
                      setForgotSuccess('');
                      setForgotError('');
                    }}
                    className="text-[11px] text-gold/80 hover:text-gold transition font-semibold focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center text-zinc-400 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded border-zinc-800 bg-zinc-900 text-gold focus:ring-0 focus:ring-offset-0" />
                  Remember me
                </label>
                <a href="#/" className="text-gold/80 hover:text-gold transition">Back to website</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gold-gradient hover:opacity-90 active:scale-[0.98] text-black font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-gold mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold/35 bg-gold/5 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)] overflow-hidden">
                <img 
                  src="/MY3Logo.jpg" 
                  className="w-full h-full object-contain rounded-full" 
                  alt="Mythri Restaurant Logo" 
                />
              </div>
              <h2 className="text-2xl font-bold font-serif text-white tracking-wide">Reset Password</h2>
              <p className="text-zinc-500 text-sm mt-1">Mythri Family Restaurant</p>
            </div>

            {forgotError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/10 text-red-400 text-xs">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-6 text-center">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 text-xs text-left leading-relaxed">
                  {forgotSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full py-3.5 bg-gold-gradient hover:opacity-90 active:scale-[0.98] text-black font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-gold"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
                    placeholder="e.g., admin@mythri.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 bg-gold-gradient hover:opacity-90 active:scale-[0.98] text-black font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-gold mt-6"
                >
                  {forgotLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-xs text-gold/80 hover:text-gold transition font-semibold focus:outline-none"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
