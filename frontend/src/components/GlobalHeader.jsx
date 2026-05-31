import { Bell, User, Palette, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsService } from '../services/apiClient';
import NotificationDropdown from './NotificationDropdown';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const GlobalHeader = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { themeMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getLatest();
      if (res && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Alert sync failure", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s neural poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    if (!id) return;
    try {
      await notificationsService.markAsRead(id);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handlePurge = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await notificationsService.purgeAll();
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications.filter(Boolean) : [];
  const unreadCount = safeNotifications.filter(n => n && !n.is_read).length;

  const getThemeStyles = () => {
    switch (themeMode) {
      case 'monochrome':
        return 'bg-cyber-neon/10 border-cyber-neon text-cyber-neon shadow-[0_0_10px_rgba(57,255,20,0.3)]';
      case 'plasma':
        return 'bg-blue-500/20 border-blue-500 text-blue-600 shadow-[0_0_15px_rgba(0,71,255,0.4)]';
      case 'red':
        return 'bg-red-600/20 border-red-600 text-red-600 shadow-[0_0_15px_rgba(255,0,0,0.4)]';
      case 'toxic':
        return 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)]';
      case 'deep-blue':
        return 'bg-[#0070FF]/20 border-[#0070FF] text-[#0070FF] shadow-[0_0_15px_rgba(0,112,255,0.4)]';
      default:
        return 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10';
    }
  };

  return (
    <header className="flex items-center justify-between gap-6 mb-6">
      <div className="min-w-0">
        {title && <h1 className="text-2xl font-semibold text-white tracking-tight truncate">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group hidden md:block w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500 transition-colors group-focus-within:text-cyber-blue" />
          </div>
          <input
            type="text"
            placeholder="Search findings, hosts, or CVEs..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.06] focus:border-cyber-blue/50 focus:ring-2 focus:ring-cyber-blue/15 transition-all"
          />
        </div>
        <div className="relative flex items-center">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2.5 rounded-lg transition-colors ${
              isNotificationsOpen ? 'text-cyber-blue bg-cyber-blue/10' : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-cyber-alert text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <NotificationDropdown
                notifications={safeNotifications}
                onMarkRead={handleMarkRead}
                onPurge={handlePurge}
                onClose={() => setIsNotificationsOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
