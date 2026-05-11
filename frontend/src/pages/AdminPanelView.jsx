import React, { useState, useEffect } from 'react';
import { adminService } from '../services/apiClient';
import { Users, Shield, History, Cpu, Server, Activity, AlertCircle, Settings, Download, Trash2, UserPlus } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';

const AdminPanelView = ({ headerTitle = "Admin Control", headerSubtitle = "System management and audit" }) => {
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({
      total_scans: 0,
      active_targets: 0,
      critical_findings: 0,
      system_status: 'Operational',
      health: {
        cpu: '0%',
        memory: '0 GB / 0 GB',
        load: 'Stable'
      }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const usersRes = await adminService.getUsers();
        const statsRes = await adminService.getStats();
        
        if (isMounted) {
          if (usersRes && usersRes.data) setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
          if (statsRes && statsRes.data) {
            setSystemStats(prev => ({
              ...prev,
              ...statsRes.data,
              health: statsRes.data.health || prev.health
            }));
          }
        }
      } catch (err) {
        console.error("Admin dashboard fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Synthesizing Admin Layer...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 bg-cyber-black text-white p-8">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-cyber-surface border border-white/5 rounded-2xl">
           <Cpu className="text-cyber-blue mb-4" />
           <p className="text-[10px] text-gray-600 uppercase font-bold">CPU Load</p>
           <p className="text-3xl font-black">{systemStats.health?.cpu || '0%'}</p>
        </div>
        <div className="p-8 bg-cyber-surface border border-white/5 rounded-2xl">
           <Server className="text-cyber-neon mb-4" />
           <p className="text-[10px] text-gray-600 uppercase font-bold">Memory Matrix</p>
           <p className="text-3xl font-black">{typeof systemStats.health?.memory === 'string' ? systemStats.health.memory.split(' / ')[0] : '0 GB'}</p>
        </div>
        <div className="p-8 bg-cyber-surface border border-white/5 rounded-2xl">
           <Activity className="text-cyber-alert mb-4" />
           <p className="text-[10px] text-gray-600 uppercase font-bold">Status</p>
           <p className="text-3xl font-black">{systemStats.health?.load || 'Stable'}</p>
        </div>
      </div>

      <div className="cyber-panel bg-cyber-surface p-10 mt-10">
         <h2 className="text-xl font-black italic uppercase mb-8 border-b border-white/5 pb-4">Personnel Database</h2>
         <div className="space-y-4">
            {Array.isArray(users) && users.length > 0 ? users.map((u, i) => (
               <div key={u.id || i} className="p-6 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center font-bold">{u.username ? u.username.substring(0, 1) : 'U'}</div>
                     <div>
                        <p className="font-bold">{u.username || 'System'}</p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest">{u.role || 'User'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-cyber-neon font-black">{u.status || 'ACTIVE'}</p>
                  </div>
               </div>
            )) : (
               <p className="text-center py-10 text-gray-700">No records found</p>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminPanelView;
