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
    if (!window.confirm("Purge all neural alerts?")) return;
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
    <header className="flex items-center justify-between mb-4 py-2">
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-600 transition-colors group-focus-within:text-white" />
          </div>
          <input 
            type="text" 
            placeholder="Search queries, nodes, or intel..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-white/[0.05] focus:border-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative flex items-center gap-2">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 transition-colors ${
              isNotificationsOpen ? 'text-blue-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-black" />
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

        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-white uppercase tracking-tight">SOC Admin</p>
            <p className="text-[8px] text-cyber-neon font-black uppercase tracking-tighter">CLEARED</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center p-1 group hover:border-blue-400 transition-all cursor-pointer">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
              <User size={18} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
