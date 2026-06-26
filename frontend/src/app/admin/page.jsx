"use client";
import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/apiClient';
import { Users, Shield, History, Cpu, Server, Activity, AlertCircle, Settings, Download, Trash2, UserPlus, Edit3, X, Check, Power } from 'lucide-react';
import GlobalHeader from '../../../components/GlobalHeader';

const AVAILABLE_PERMISSIONS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/recon', label: 'Reconnaissance' },
  { path: '/scan', label: 'Network Scan' },
  { path: '/vulnerabilities', label: 'Vulnerabilities' },
  { path: '/exploitation', label: 'Exploitation' },
  { path: '/reports', label: 'Reports' },
  { path: '/attack-path', label: 'Attack Path' },
  { path: '/scientific-lab', label: 'Scientific Lab' },
  { path: '/ai-assistant', label: 'AI Assistant' },
  { path: '/about', label: 'Framework' },
  { path: '/admin', label: 'Admin Panel' },
  { path: '/settings', label: 'Settings' }
];

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
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const usersRes = await adminService.getUsers();
      const statsRes = await adminService.getStats();
      
      if (usersRes && usersRes.data) setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      if (statsRes && statsRes.data) {
        setSystemStats(prev => ({
          ...prev,
          ...statsRes.data,
          health: statsRes.data.health || prev.health
        }));
      }
    } catch (err) {
      console.error("Admin dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.is_active === 1 ? 0 : 1;
    try {
      await adminService.updateStatus(user.id, newStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await adminService.updatePermissions(editingUser.id, editingUser.permissions);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, permissions: editingUser.permissions } : u));
      setEditingUser(null);
    } catch (err) {
      console.error("Failed to update permissions", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (path) => {
    if (!editingUser) return;
    const hasPerm = editingUser.permissions.includes(path);
    const newPerms = hasPerm 
      ? editingUser.permissions.filter(p => p !== path)
      : [...editingUser.permissions, path];
    setEditingUser({ ...editingUser, permissions: newPerms });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-medium">Loading…</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-32 bg-cyber-black text-white relative">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Cpu className="text-cyber-blue mb-4" />
           <p className="text-sm text-gray-400 font-medium">CPU Load</p>
           <p className="text-3xl font-bold tabular-nums">{systemStats.health?.cpu || '0%'}</p>
        </div>
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Server className="text-cyber-neon mb-4" />
           <p className="text-sm text-gray-400 font-medium">Memory</p>
           <p className="text-3xl font-bold tabular-nums">{typeof systemStats.health?.memory === 'string' ? systemStats.health.memory.split(' / ')[0] : '0 GB'}</p>
        </div>
        <div className="p-6 bg-cyber-surface border border-white/5 rounded-2xl">
           <Activity className="text-cyber-alert mb-4" />
           <p className="text-sm text-gray-400 font-medium">Status</p>
           <p className="text-3xl font-bold">{systemStats.health?.load || 'Stable'}</p>
        </div>
      </div>

      <div className="cyber-panel bg-cyber-surface p-8">
         <h2 className="text-lg font-semibold mb-6 border-b border-white/5 pb-4">User Management & Permissions</h2>
         <div className="space-y-4">
            {Array.isArray(users) && users.length > 0 ? users.map((u, i) => (
               <div key={u.id || i} className="p-5 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center font-bold">{u.username ? u.username.substring(0, 1).toUpperCase() : 'U'}</div>
                     <div>
                        <p className="font-semibold">{u.username || 'System'}</p>
                        <p className="text-xs text-gray-500">{u.role || 'User'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${u.is_active === 1 ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                     >
                        <Power size={14} />
                        {u.is_active === 1 ? 'Active' : 'Inactive'}
                     </button>
                     
                     <button
                        onClick={() => setEditingUser({ ...u, permissions: u.permissions || [] })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 flex items-center gap-2 transition-colors"
                     >
                        <Edit3 size={14} />
                        Edit Permissions
                     </button>
                  </div>
               </div>
            )) : (
               <p className="text-center py-10 text-gray-600">No users found</p>
            )}
         </div>
      </div>

      {/* Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-cyber-surface border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Permissions</h3>
                <p className="text-sm text-gray-400 mt-1">Configure access for {editingUser.username}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isGranted = editingUser.permissions.includes(perm.path);
                  return (
                    <div 
                      key={perm.path}
                      onClick={() => togglePermission(perm.path)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isGranted ? 'border-cyber-blue/50 bg-cyber-blue/10' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${isGranted ? 'bg-cyber-blue border-cyber-blue text-white' : 'border-gray-600 text-transparent'}`}>
                        <Check size={14} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isGranted ? 'text-white' : 'text-gray-400'}`}>{perm.label}</p>
                        <p className="text-[10px] text-gray-500">{perm.path}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-black/20">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePermissions}
                disabled={saving}
                className="cyber-button px-6 py-2 text-sm font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelView;
