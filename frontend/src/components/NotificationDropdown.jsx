import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Info, X, Trash2, ShieldAlert } from 'lucide-react';

const NotificationDropdown = ({ notifications, onMarkRead, onPurge, onClose }) => {
  const safeNotifications = Array.isArray(notifications) ? notifications.filter(Boolean) : [];

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'text-cyber-neon bg-cyber-neon/10 border-cyber-neon/30';
      case 'warning': return 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30';
      case 'danger': return 'text-cyber-alert bg-cyber-alert/10 border-cyber-alert/30';
      default: return 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/30';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'danger': return <ShieldAlert size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-12 right-0 w-80 bg-cyber-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Notifications</span>
          <span className="px-1.5 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue text-[10px] font-semibold">
            {safeNotifications.filter(n => n && !n.is_read).length} new
          </span>
        </div>
        <button 
          onClick={onPurge}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-cyber-alert transition-colors"
          title="Clear all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {safeNotifications.length > 0 ? (
          <div className="divide-y divide-white/5">
            {safeNotifications.map((n) => (
              <motion.div 
                key={n?.id || Math.random()}
                layout
                className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group ${n && !n.is_read ? 'bg-cyber-blue/5' : ''}`}
                onClick={() => n?.id && onMarkRead?.(n.id)}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 p-1.5 rounded-lg border h-fit ${getTypeColor(n?.type)}`}>
                    {getIcon(n?.type || 'info')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-[11px] font-bold text-white truncate">{n?.title || 'Notification'}</h4>
                      <span className="text-[8px] font-mono text-gray-600 shrink-0">
                        {n?.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                      {n?.message || 'No details available.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Info size={16} className="text-gray-700" />
            </div>
            <p className="text-xs font-medium text-gray-600">No notifications</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5 bg-white/[0.01] text-center">
        <button 
          onClick={onClose}
          className="text-xs font-medium text-gray-500 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
