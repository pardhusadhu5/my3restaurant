import React, { useState } from 'react';
import { api } from '../services/api';

export default function AdminLogin({ onLogin, isAdmin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gold/3 blur-[100px] -bottom-20 -right-20"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10">
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
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
              placeholder="e.g., admin"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
              placeholder="••••••••"
            />
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

        {/* Guest Demo Credentials Banner */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <p className="text-zinc-500 text-xs mb-2">Local Demo Credentials:</p>
          <div className="inline-block px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/10 text-[11px] text-gold/80 font-mono">
            Username: <span className="text-white font-semibold">admin</span> &nbsp;|&nbsp; Password: <span className="text-white font-semibold">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
