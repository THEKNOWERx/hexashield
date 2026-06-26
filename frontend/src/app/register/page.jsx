"use client";
﻿/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Shield, Lock, User, Mail, ShieldAlert, Cpu, Activity, UserPlus, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/apiClient';
import { useNotification } from '../../components/NotificationSystem';
import CyberCard from '../../components/CyberCard';

const Register = () => {
  const showNotification = useNotification();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'analyst'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      showNotification("Account created successfully. You may now login.", "success");
      router.push('/login');
    } catch (err) {
      showNotification(err.response?.data?.detail || "Registration failed", "error");
      setError(err.response?.data?.detail || 'Failed to create account. Username might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-blue/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="p-4 bg-cyber-blue/10 rounded-2xl border border-cyber-blue/20 mb-4 shadow-blue-glow">
            <UserPlus className="text-cyber-blue" size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Hexa<span className="text-cyber-blue">Shield</span></h1>
          <p className="text-sm font-medium text-gray-500 mt-2">Create your account</p>
        </motion.div>

        <CyberCard className="!p-8 border-cyber-blue/20">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white tracking-tight">Sign up</h2>
            <p className="text-sm text-gray-500">Enter your details to get started.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-cyber-alert/5 border border-cyber-alert/20 rounded-xl text-cyber-alert text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-cyber-blue transition-colors" size={17} />
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="cyber-input w-full py-4 pl-12"
                    placeholder="yourname"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-cyber-blue transition-colors" size={17} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="cyber-input w-full py-4 pl-12"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="cyber-input w-full py-4 px-4 appearance-none text-gray-300"
                >
                  <option value="analyst">Security Analyst</option>
                  <option value="student">Student Researcher</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-cyber-blue transition-colors" size={17} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="cyber-input w-full py-4 pl-12 pr-12"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-cyber-blue transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="cyber-button w-full py-5 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              <ShieldAlert size={18} />
              <span className="font-semibold">{loading ? 'Creating account…' : 'Create account'}</span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-gray-500">
              Already have an account? <Link href="/login" className="text-cyber-blue font-semibold hover:underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </CyberCard>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-6"
        >
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyber-neon" />
            <span className="text-xs font-medium text-gray-600">Uptime 99.9%</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-800" />
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-cyber-blue" />
            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">V4 Protocol</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

