"use client";
﻿/* eslint-disable no-unused-vars, react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`p-4 rounded-lg shadow-2xl border flex items-center gap-3 min-w-[300px] backdrop-blur-md
                ${n.type === 'success' ? 'bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon' : 
                  n.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  n.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                  'bg-cyber-blue/10 border-cyber-blue/30 text-cyber-blue'}`}
            >
              {n.type === 'success' && <CheckCircle size={20} />}
              {n.type === 'error' && <XCircle size={20} />}
              {n.type === 'warning' && <AlertCircle size={20} />}
              {n.type === 'info' && <Info size={20} />}
              <span className="text-sm font-bold tracking-tight">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

