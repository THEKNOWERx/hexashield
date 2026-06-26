"use client";
/* eslint-disable no-unused-vars */


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Shield, Lock, User, ArrowRight, Activity, Cpu, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../../services/apiClient';
import { useNotification } from '../../../components/NotificationSystem';
import CyberCard from '../../../components/CyberCard';

const Login = () => {
  const showNotification = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiClient = (await import('../../services/apiClient')).default;
        await apiClient.get('health');
        setBackendStatus('online');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(username.trim(), password);
      const token = res.data.access_token;
      localStorage.setItem('access_token', token);
      
      let defaultRoute = '/dashboard';
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        if (role === 'admin') defaultRoute = '/admin';
        else if (role === 'student') defaultRoute = '/scientific-lab';
      } catch (e) {}
      
      showNotification("Signed in successfully.", "success");
      router.push(defaultRoute);
    } catch (err) {
      if (!err.response) {
        showNotification("Cannot connect to server. Is the backend running?", "error");
        setError("Network error: Backend server is unreachable.");
      } else {
        showNotification(err.response?.data?.detail || "Authentication Failed", "error");
        setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyber-blue/[0.07] blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyber-neon/[0.05] blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="p-3 bg-cyber-blue/10 rounded-2xl border border-cyber-blue/20 mb-4">
            <Shield className="text-cyber-blue" size={36} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hexa<span className="text-cyber-blue">Shield</span></h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-cyber-neon' : backendStatus === 'offline' ? 'bg-cyber-alert' : 'bg-gray-600 animate-pulse'}`} />
            <p className="text-xs font-medium text-gray-500">
              {backendStatus === 'online' ? 'Server online' : backendStatus === 'offline' ? 'Server offline' : 'Connecting…'}
            </p>
          </div>
        </motion.div>

        <CyberCard className="!p-8">
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-white tracking-tight">Sign in</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enter your credentials to access the platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-cyber-alert/[0.08] border border-cyber-alert/20 rounded-lg text-cyber-alert text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-blue transition-colors" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cyber-input w-full py-3 pl-11"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-blue transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full py-3 pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyber-blue transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-button w-full py-3.5 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
            >
              <span className="font-semibold">{loading ? 'Signing in…' : 'Sign in'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>


          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center">
            <p className="text-sm text-gray-500">
              No account? <Link href="/register" className="text-cyber-blue font-semibold hover:underline underline-offset-4">Register</Link>
            </p>
          </div>
        </CyberCard>
      </div>
    </div>
  );
};

export default Login;

