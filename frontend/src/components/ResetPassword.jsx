import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Parse token from hash URL (e.g., #/reset-password?token=xxxx)
  useEffect(() => {
    const hash = window.location.hash;
    const searchIdx = hash.indexOf('?');
    if (searchIdx > -1) {
      const urlParams = new URLSearchParams(hash.substring(searchIdx));
      const t = urlParams.get('token');
      if (t) {
        setToken(t);
        validateToken(t);
        return;
      }
    }
    setTokenError('No password reset token was provided.');
    setLoading(false);
  }, []);

  const validateToken = async (t) => {
    try {
      setLoading(true);
      const res = await api.validateResetToken(t);
      if (res.valid) {
        setTokenValid(true);
        setEmail(res.email);
      }
    } catch (err) {
      console.error(err);
      setTokenError(err.message || 'This password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      const res = await api.resetPassword(token, newPassword);
      setSubmitSuccess(res.message || 'Your password has been reset successfully!');
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 3000);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Validation checks
  const isLengthValid = newPassword.length >= 6;
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] -top-40 -left-40"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gold/3 blur-[100px] -bottom-20 -right-20"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold/35 bg-gold/5 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)] overflow-hidden">
            <img 
              src="/MY3Logo.jpg" 
              className="w-full h-full object-contain rounded-full" 
              alt="Mythri Restaurant Logo" 
            />
          </div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-wide">Choose New Password</h2>
          <p className="text-zinc-500 text-sm mt-1">Mythri Family Restaurant</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-xs font-mono">Verifying reset token...</p>
          </div>
        ) : tokenError ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/10 text-red-400 text-xs flex items-start space-x-3 text-left">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Invalid Reset Link</span>
                <span className="leading-relaxed">{tokenError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = '#/login'; }}
              className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              Back to Login
            </button>
          </div>
        ) : submitSuccess ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 text-xs flex items-start space-x-3 text-left">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Success!</span>
                <span className="leading-relaxed">{submitSuccess}</span>
                <span className="block mt-2 text-[10px] text-zinc-400">Redirecting you to login page in 3 seconds...</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = '#/login'; }}
              className="w-full py-3.5 bg-gold-gradient hover:opacity-90 active:scale-[0.98] text-black font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-gold"
            >
              Back to Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            {submitError && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/10 text-red-400 text-xs">
                {submitError}
              </div>
            )}

            <div className="p-3 bg-gold/5 border border-gold/10 rounded-xl mb-2 text-left">
              <span className="text-[10px] text-gold uppercase font-mono block">Resetting password for</span>
              <span className="text-zinc-200 text-xs font-semibold">{email}</span>
            </div>

            {/* New Password input */}
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input */}
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-gold/50 focus:outline-none text-white text-sm transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Requirements Validation Checklist */}
            <div className="bg-zinc-950/40 border border-zinc-900/80 p-3.5 rounded-xl space-y-2 text-[11px] text-zinc-500">
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isLengthValid ? 'bg-emerald-400' : 'bg-zinc-700'}`}></div>
                <span className={isLengthValid ? 'text-zinc-300 font-semibold' : ''}>At least 6 characters long</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${doPasswordsMatch ? 'bg-emerald-400' : 'bg-zinc-700'}`}></div>
                <span className={doPasswordsMatch ? 'text-zinc-300 font-semibold' : ''}>Passwords must match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading || !isLengthValid || !doPasswordsMatch}
              className="w-full py-3.5 bg-gold-gradient hover:opacity-90 active:scale-[0.98] text-black font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-gold mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
