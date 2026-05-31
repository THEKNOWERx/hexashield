import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, AlertTriangle, Cpu } from 'lucide-react';

const TacticalFeed = ({ events }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyber-blue" />
          <span className="text-sm font-semibold text-gray-400">Activity Feed</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-cyber-neon" />
          <div className="w-1 h-1 rounded-full bg-cyber-neon opacity-40" />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        {events && events.length > 0 ? (
          events.map((event, i) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="p-6 bg-white/[0.01] border border-white/5 rounded-xl hover:border-cyber-blue/30 transition-all group cursor-default"
            >
              <div className="flex items-start gap-5">
                <div className={`p-2.5 rounded-lg border border-white/5 ${
                  event.severity === 'Critical' ? 'bg-cyber-alert/5 text-cyber-alert' :
                  event.severity === 'High' ? 'bg-cyber-warning/5 text-cyber-warning' :
                  'bg-cyber-blue/5 text-cyber-blue'
                }`}>
                  {event.severity === 'Critical' ? <Shield size={16} /> : <Zap size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 tabular-nums">{event.time || '10:45:00'}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${
                      event.severity === 'Critical' ? 'border-cyber-alert/40 text-cyber-alert' : 'border-white/5 text-gray-500'
                    }`}>
                      {event.severity === 'Critical' ? 'Critical' : 'Advisory'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1.5 line-clamp-1 group-hover:text-cyber-blue transition-colors">{event.name}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{event.description}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-10 gap-6">
            <Cpu size={48} className="text-white" />
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-white/5">
        <button className="w-full py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] transition-all">
          Access Deep Audit Logs
        </button>
      </div>
    </div>
  );
};

export default TacticalFeed;
