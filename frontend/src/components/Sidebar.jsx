import { LayoutDashboard, Shield, Search, Network, AlertTriangle, FileText, Settings, LogOut, BookOpen, Crosshair } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const decodeRole = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return { role: 'analyst', username: 'operator' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { role: payload.role || 'analyst', username: payload.sub || 'operator' };
  } catch {
    return { role: 'analyst', username: 'operator' };
  }
};

const ROLE_LABELS = {
  admin: 'Administrator',
  security_analyst: 'Security Analyst',
  analyst: 'Security Analyst',
  student: 'Student',
};

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Reconnaissance', icon: Search, path: '/recon' },
  { name: 'Network Scan', icon: Network, path: '/scan' },
  { name: 'Vulnerabilities', icon: AlertTriangle, path: '/vulnerabilities' },
  { name: 'Attack Path', icon: Crosshair, path: '/attack-path' },
  { name: 'Reports', icon: FileText, path: '/reports' },
  { name: 'Framework', icon: BookOpen, path: '/about' },
  { name: 'Admin Panel', icon: Settings, path: '/admin' },
];

const Sidebar = () => {
  const { role, username } = decodeRole();
  const initials = (username || 'OP').slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 h-screen bg-cyber-surface border-r border-white/[0.06] flex flex-col z-40">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.06] group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-blue to-blue-600 flex items-center justify-center shadow-blue-glow">
          <Shield className="text-white" size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <h1 className="text-[15px] font-bold tracking-tight text-white">
            Hexa<span className="text-cyber-blue">Shield</span>
          </h1>
          <span className="text-[10px] text-gray-500 font-medium mt-1 tracking-wide">Security Platform</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Operations</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-cyber-blue/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyber-blue"
                    />
                  )}
                  <Icon size={18} className={isActive ? 'text-cyber-blue' : 'text-gray-500'} strokeWidth={2} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-cyber-blue/15 border border-cyber-blue/25 flex items-center justify-center text-xs font-bold text-cyber-blue">
            {initials}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold text-white truncate capitalize">{username}</span>
            <span className="text-[11px] text-gray-500 truncate">{ROLE_LABELS[role] || 'Operator'}</span>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }}
          className="mt-2 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-cyber-alert hover:bg-cyber-alert/[0.08] transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

