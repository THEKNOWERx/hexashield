/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, Activity, Cpu, Globe, Zap, ShieldCheck, Database, Github, Linkedin, Lock, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 1.2 seconds for faster responsiveness
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 3D Intro Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#000000' }}
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.1,
              transition: { duration: 0.5, ease: "circIn" }
            }}
          >
            {/* Intensive Grid Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,112,255,0.05)_1px,transparent_1px)] bg-[length:100%_4px] animate-scanlines pointer-events-none"></div>
            
            {/* Volumetric 3D Logo Entrance */}
            <motion.div 
              className="perspective-[2500px] z-10"
              initial={{ 
                scale: 0, 
                opacity: 0, 
                rotateX: 110, 
                rotateY: -60,
                z: -2000 
              }}
              animate={{ 
                scale: 1,
                opacity: 1, 
                rotateX: 0, 
                rotateY: 0, 
                z: 0 
              }}
              transition={{ 
                type: "spring",
                stiffness: 100,
                damping: 18,
                mass: 2,
                duration: 1.5
              }}
            >
              <motion.img
                src="/hex_logo.jpeg"
                alt="HexaShield Logo"
                className="w-auto h-[280px] md:h-[450px] object-contain mix-blend-screen"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 85%)'
                }}
                animate={{
                   y: [0, -15, 0],
                   rotateY: [0, 5, -5, 0],
                   rotateX: [0, 2, -2, 0],
                   filter: [
                     "drop-shadow(0 0 10px rgba(0,112,255,0.4))",
                     "drop-shadow(0 0 40px rgba(0,112,255,0.8))",
                     "drop-shadow(0 0 20px rgba(0,112,255,0.6))"
                   ]
                }}
                transition={{ 
                   y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                   rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                   rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                   filter: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              />
            </motion.div>
            
            {/* Aggressive Loading Sequence */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="mt-16 flex flex-col items-center w-full max-w-md px-6 z-10"
            >
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4 relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-cyber-blue shadow-[0_0_15px_#0070ff]"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "45%", "85%", "100%"] }}
                  transition={{ duration: 2.2, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }}
                />
              </div>
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1], color: ["#fff", "#0070f3", "#fff"] }} 
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  Initializing platform
                </motion.span>
                <span className="text-cyber-neon">Loading…</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-cyber-black text-white selection:bg-cyber-blue relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-blue/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-neon/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-cyber-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
              <div className="p-2 bg-cyber-blue/10 rounded-lg border border-cyber-blue/20">
                <Shield className="text-cyber-blue" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">HEXA<span className="text-cyber-blue">SHIELD</span></span>
            </Link>
          </motion.div>
          <div className="hidden md:flex gap-10 text-[11px] font-semibold tracking-wide text-gray-400">
            <Link to="/nexus/tactical" className="hover:text-cyber-blue transition-colors">Features</Link>
            <Link to="/nexus/intelligence" className="hover:text-cyber-blue transition-colors">Platform</Link>
            <Link to="/nexus/protocol" className="hover:text-cyber-blue transition-colors">Documentation</Link>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/login" className="cyber-button text-xs px-7 py-3">
              Sign in
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue text-[11px] font-semibold tracking-wide"
            >
              <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse"></span>
              Enterprise penetration testing platform
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-white"
            >
              Find vulnerabilities <br /> 
              before <span className="text-cyber-blue">attackers do.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 max-w-xl leading-relaxed"
            >
              HexaShield combines automated reconnaissance, network scanning, and
              AI-assisted analysis to map your attack surface, prioritize real risks,
              and guide remediation — all from a single dashboard.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link to="/login" className="cyber-button text-sm px-9 py-4 flex items-center justify-center gap-2.5 group">
                Get started
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register" className="px-9 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-cyber-blue/50 transition-all flex items-center justify-center text-sm font-semibold text-gray-300 hover:text-white">
                Create account
              </Link>
            </motion.div>
          </div>

          {/* Abstract Cyber Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            <div className="absolute -inset-10 bg-cyber-blue/10 blur-[100px] rounded-full animate-pulse"></div>
            <div className="relative aspect-square rounded-[3rem] border border-white/5 bg-cyber-black/40 backdrop-blur-3xl overflow-hidden p-8 group">
               <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="h-full w-full border border-white/5 rounded-2xl relative flex items-center justify-center p-6">
                  <Cpu className="text-cyber-blue opacity-20 absolute scale-[3] blur-sm animate-pulse" />
                  <div className="relative z-10 text-center space-y-6">
                     <ShieldCheck size={80} className="text-cyber-blue mx-auto filter drop-shadow-[0_0_20px_rgba(0,112,255,0.5)]" />
                     <div className="space-y-1">
                        <div className="text-4xl font-black font-mono tracking-tighter text-white">99.8%</div>
                        <div className="text-[10px] font-black text-cyber-neon uppercase tracking-widest">Confidence Score</div>
                     </div>
                  </div>
               </div>

               {/* Floating elements */}
               <div className="absolute top-10 right-10 p-3 bg-cyber-black/60 border border-white/10 rounded-xl backdrop-blur-md animate-bounce">
                  <Activity size={16} className="text-cyber-neon" />
               </div>
               <div className="absolute bottom-10 left-10 p-3 bg-cyber-black/60 border border-white/10 rounded-xl backdrop-blur-md animate-pulse">
                  <Zap size={16} className="text-cyber-warning" />
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { label: 'Real-time Intelligence', icon: Activity, desc: 'Continuous monitoring of global threat feeds and known CVE databases.' },
            { label: 'Attack Path Mapping', icon: Globe, desc: 'AI-assisted attack path visualization and asset reconnaissance.' },
            { label: 'Secure Storage', icon: Database, desc: 'Encrypted storage for all audit logs and finding reports.' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-6 border-l border-white/5 pl-8"
            >
              <div className="p-3 bg-cyber-blue/10 rounded-xl border border-cyber-blue/20">
                <item.icon size={20} className="text-cyber-blue" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-2 tracking-tight">{item.label}</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* NEW: URL Expert Audit Section (Outside Experience) */}
      <section className="py-32 px-6 relative overflow-hidden bg-black">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyber-blue/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
           <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-cyber-neon/10 border border-cyber-neon/20 rounded-full text-cyber-neon text-[11px] font-semibold tracking-wide">
                 Public threat intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                 URL & domain <br/>
                 <span className="text-cyber-neon">security audit.</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                 Instant security analysis for any URL or domain. Identify malicious
                 redirects, protocol weaknesses, and reputation scores through our
                 cross-referencing engine.
              </p>
              <div className="flex gap-4">
                 <Link to="/url-scan" className="px-8 py-3.5 bg-cyber-neon text-black font-semibold text-sm rounded-xl hover:brightness-110 transition-all">
                    Audit a link
                 </Link>
                 <div className="hidden sm:flex items-center gap-3 px-6 text-[11px] font-semibold text-gray-500 tracking-wide border border-white/5 rounded-xl">
                    <Activity size={14} className="text-cyber-blue" />
                    Live feed active
                 </div>
              </div>
           </div>
           
           <div className="flex-1 grid grid-cols-2 gap-6 w-full">
              {[
                { title: "Reputation HUD", desc: "Global trust analysis", icon: ShieldCheck },
                { title: "Protocol Audit", desc: "Deep header inspection", icon: Lock },
                { title: "Redirect Path", desc: "Malicious jump detection", icon: Zap },
                { title: "Historical Sync", desc: "Past result mapping", icon: History }
              ].map((card, idx) => (
                <div key={idx} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-cyber-neon/30 hover:bg-cyber-neon/5 transition-all group">
                   {card.icon && <card.icon className="text-cyber-blue group-hover:text-cyber-neon mb-4 transition-colors" size={24} />}
                   <h4 className="text-white font-bold text-sm mb-1">{card.title}</h4>
                   <p className="text-[10px] text-gray-600 font-medium uppercase tracking-tight">{card.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-cyber-black relative z-10 border-t border-white/5 mt-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link to="/" className="flex items-center gap-3 group">
                <Shield className="text-cyber-blue" size={28} />
                <span className="text-2xl font-black tracking-tighter">HEXA<span className="text-cyber-blue">SHIELD</span></span>
              </Link>
              <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left">Next-Gen Cyber Intelligence Platform</p>
            </div>
            
            <div className="flex gap-12">
              <div className="text-center md:text-left">
                <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Resources</h5>
                <div className="flex flex-col gap-2 text-xs text-gray-500 font-medium">
                  <a href="#" className="hover:text-cyber-blue transition-colors">Framework Specs</a>
                  <a href="#" className="hover:text-cyber-blue transition-colors">API Docs</a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
              <a href="https://github.com/Theknower22" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyber-blue/50 hover:bg-cyber-blue/10 text-gray-500 hover:text-white transition-all group shadow-blue-glow">
                <Github size={24} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://linkedin.com/in/khaled-hani/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyber-blue/50 hover:bg-cyber-blue/10 text-gray-500 hover:text-white transition-all group shadow-blue-glow">
                <Linkedin size={24} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
            
            <p className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">© 2026 HexaShield Security. By Khaled Hani. Graduation Research Project.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default LandingPage;

