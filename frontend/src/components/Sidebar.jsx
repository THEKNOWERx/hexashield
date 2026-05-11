import { LayoutDashboard, Shield, Search, Network, AlertTriangle, FileText, Settings, HelpCircle, LogOut, BookOpen, ChevronRight, Target, FlaskConical, Palette, Globe } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Sidebar = () => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleLogoClick = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1000);
  };
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard', color: 'text-blue-500', glow: 'shadow-blue-500/20', bg: 'bg-blue-500/10' },
    { name: 'Reconnaissance', icon: <Search size={18} />, path: '/recon', color: 'text-cyber-neon', glow: 'shadow-cyber-neon/20', bg: 'bg-cyber-neon/10' },
    { name: 'Network Scan', icon: <Network size={18} />, path: '/scan', color: 'text-orange-500', glow: 'shadow-orange-500/20', bg: 'bg-orange-500/10' },
    { name: 'Vulnerability', icon: <AlertTriangle size={18} />, path: '/vulnerabilities', color: 'text-red-500', glow: 'shadow-red-500/20', bg: 'bg-red-500/10' },
    { name: 'Attack Path', icon: <Shield size={18} />, path: '/attack-path', color: 'text-purple-500', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10' },
    { name: 'Reports', icon: <FileText size={18} />, path: '/reports', color: 'text-blue-400', glow: 'shadow-blue-400/20', bg: 'bg-blue-400/10' },
    { name: 'Framework', icon: <BookOpen size={18} />, path: '/about', color: 'text-gray-400', glow: 'shadow-gray-400/20', bg: 'bg-gray-400/10' },
    { name: 'Admin Panel', icon: <Settings size={18} />, path: '/admin', color: 'text-white/40', glow: 'shadow-white/10', bg: 'bg-white/5' },
  ];

  return (
    <div className="w-64 h-screen bg-cyber-surface border-r border-white/5 flex flex-col p-6 z-40">
      <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3.5 mb-12 pl-1 cursor-pointer group">
        <motion.div
          animate={{ rotate: isSpinning ? 360 : 0 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="w-11 h-11 bg-cyber-neon rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.4)] transition-all duration-500"
        >
          <Shield className="text-black" size={24} strokeWidth={2.5} />
        </motion.div>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tighter uppercase flex items-center leading-none">
            <span className="text-white">HEXA</span>
            <span className="text-cyber-neon ml-0.5">SHIELD</span>
          </h1>
          <span className="text-[10px] text-cyber-blue font-black uppercase tracking-[0.25em] mt-1.5 opacity-90">
             ADMIN CLEARANCE
          </span>
        </div>
      </Link>
      
      <nav className="flex-1 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center group relative px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? `${item.bg} text-white border border-white/5 ${item.glow}` 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className={`absolute left-0 w-1.5 h-6 rounded-full ${item.color.replace('text-', 'bg-')}`}
                    style={{ marginLeft: '1px', boxShadow: `0 0 10px ${item.color.includes('green') ? '#22c55e' : (item.color.includes('red') ? '#ef4444' : '#3b82f6')}` }}
                  />
                )}
                <div className={`transition-colors duration-300 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'} ml-4`}>
                   {item.icon}
                </div>
                <span className={`ml-3 font-bold text-xs tracking-tight transition-all ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto"
                  >
                    <ChevronRight size={14} className="text-white/40" />
                  </motion.div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="p-4 bg-cyber-black border border-white/5 rounded-2xl flex items-center justify-between group hover:border-cyber-blue/30 transition-all cursor-default">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-cyber-neon rounded-full shadow-neon-glow animate-pulse" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1.5">Neural User</span>
                 <span className="text-xs font-black text-white uppercase tracking-tighter leading-none">ADMIN</span>
              </div>
           </div>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }}
          className="flex items-center gap-2.5 px-4 py-2 w-full text-gray-600 hover:text-cyber-alert transition-all group"
        >
          <LogOut size={14} className="opacity-40 group-hover:opacity-100" />
          <span className="font-bold text-[10px] uppercase tracking-tighter">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

