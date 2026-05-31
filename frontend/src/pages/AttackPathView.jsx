/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, AlertCircle, Loader2, Play, Pause, RotateCcw, Crosshair, Server, Network, ShieldAlert, Target, Activity } from 'lucide-react';
import { attackPathService } from '../services/apiClient';
import { motion } from 'framer-motion';
import GlobalHeader from '../components/GlobalHeader';

const TYPE_ICON = {
  Entry: Crosshair,
  Host: Server,
  Service: Network,
  Vulnerability: ShieldAlert,
  Impact: Zap,
  Objective: Target,
};

const riskColor = (risk) => {
  switch ((risk || '').toLowerCase()) {
    case 'critical': return '#f05252';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#4f83f1';
    default: return '#4f83f1';
  }
};

const nodeColor = (node) => {
  switch (node.type) {
    case 'Entry': return '#4f83f1';
    case 'Host': return '#10b981';
    case 'Service': return '#06b6d4';
    case 'Vulnerability': return riskColor(node.risk);
    case 'Impact': return '#f05252';
    case 'Objective': return '#b91c1c';
    default: return '#64748b';
  }
};

const AttackGraph = ({ data }) => {
  const { graph, predictive_analysis: analysis = {}, metrics = {}, target } = data;
  const [selected, setSelected] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [speed, setSpeed] = useState(1400);

  // Lay nodes out in columns by stage, spread vertically within each stage.
  const layout = useMemo(() => {
    const nodes = graph?.nodes || [];
    const stages = {};
    nodes.forEach((n) => {
      const s = n.stage ?? 0;
      (stages[s] = stages[s] || []).push(n);
    });
    const stageKeys = Object.keys(stages).map(Number).sort((a, b) => a - b);
    const maxStage = Math.max(1, ...stageKeys);
    const positioned = {};
    stageKeys.forEach((s) => {
      const col = stages[s];
      const x = 8 + (s / maxStage) * 84;
      col.forEach((n, i) => {
        const y = col.length === 1 ? 50 : 14 + (i * (72 / (col.length - 1)));
        positioned[n.id] = { ...n, x, y };
      });
    });
    return positioned;
  }, [graph]);

  // Ordered reveal sequence (stage, then order within stage).
  const order = useMemo(() => {
    return Object.values(layout).sort((a, b) => (a.stage - b.stage) || (a.y - b.y)).map((n) => n.id);
  }, [layout]);

  useEffect(() => {
    let t;
    if (isPlaying && step < order.length - 1) {
      t = setTimeout(() => setStep((p) => p + 1), speed);
    } else if (step >= order.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(t);
  }, [isPlaying, step, order.length, speed]);

  const statusOf = (id) => {
    if (step === -1) return 'revealed';
    const idx = order.indexOf(id);
    if (idx === step) return 'active';
    if (idx < step) return 'compromised';
    return 'pending';
  };

  const linkVisible = (l) => {
    if (step === -1) return true;
    const si = order.indexOf(l.source);
    return si <= step;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Graph surface */}
      <div className="flex-[2] cyber-panel bg-black/40 border border-white/5 relative overflow-hidden flex flex-col min-h-[520px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyber-neon animate-pulse' : 'bg-gray-600'}`} />
            <h3 className="text-sm font-semibold text-gray-300">Attack Path — {target}</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            {step === -1 ? `${order.length} nodes` : `Step ${Math.min(step + 1, order.length)} / ${order.length}`}
          </span>
        </div>

        <div className="flex-1 relative w-full min-h-[380px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {(graph?.links || []).map((l, i) => {
              const s = layout[l.source];
              const t = layout[l.target];
              if (!s || !t || !linkVisible(l)) return null;
              const lit = statusOf(l.target) !== 'pending';
              const mx = (s.x + t.x) / 2;
              const my = (s.y + t.y) / 2;
              return (
                <g key={i}>
                  <motion.line
                    x1={`${s.x}%`} y1={`${s.y}%`} x2={`${t.x}%`} y2={`${t.y}%`}
                    stroke={lit ? 'rgba(79,131,241,0.55)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={1.5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  {l.label && lit && (
                    <text x={`${mx}%`} y={`${my}%`} dy="-3" textAnchor="middle"
                      className="fill-gray-500" style={{ fontSize: 8, fontFamily: 'monospace' }}>
                      {l.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {Object.values(layout).map((node) => {
            const Icon = TYPE_ICON[node.type] || Activity;
            const status = statusOf(node.id);
            const dim = status === 'pending';
            const color = nodeColor(node);
            return (
              <motion.button
                key={node.id}
                onClick={() => setSelected(node)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: dim ? 0.85 : 1, opacity: dim ? 0.3 : 1 }}
                whileHover={{ scale: 1.08 }}
                className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 border-black/30 shadow-lg ${status === 'active' ? 'ring-4 ring-white/20 animate-pulse' : ''}`}
                  style={{ backgroundColor: dim ? '#1f2937' : color }}
                >
                  <Icon size={16} className="text-white" />
                </div>
                <span className="mt-1.5 text-[10px] font-medium bg-black/80 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap max-w-[140px] truncate text-gray-300">
                  {node.label}
                </span>
              </motion.button>
            );
          })}

          {order.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle size={36} className="mb-3" />
              <p className="text-sm">No findings available to map. Run a scan first.</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black/60 border-t border-white/10 p-4 flex items-center gap-4 mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => { if (step === -1) setStep(0); setIsPlaying(!isPlaying); }}
              disabled={order.length === 0}
              className="p-2.5 rounded-lg bg-cyber-blue hover:bg-blue-600 text-white transition-all active:scale-95 disabled:opacity-40"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => { setIsPlaying(false); setStep(-1); }}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 line-clamp-1">
              {analysis.threat_scenario || 'Play to walk through the attack path step by step.'}
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(1400 / s)}
                className={`text-xs font-semibold px-2.5 py-1 rounded border transition-all ${speed === 1400 / s ? 'bg-cyber-neon/10 border-cyber-neon text-cyber-neon' : 'border-white/10 text-gray-500'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligence sidebar */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="cyber-panel bg-black/40 border border-white/5 p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-white">Node Intelligence</h3>
            <Shield className="text-cyber-blue" size={20} />
          </div>

          {selected ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ color: nodeColor(selected), border: `1px solid ${nodeColor(selected)}55` }}>
                  {selected.type}
                </span>
                <p className="text-lg font-bold text-white mt-2 break-words">{selected.label}</p>
                {selected.detail && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selected.detail}</p>}
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-3">
                {selected.risk && (
                  <Row label="Risk level" value={selected.risk} valueColor={riskColor(selected.risk)} />
                )}
                {selected.cvss != null && selected.cvss > 0 && (
                  <Row label="CVSS" value={Number(selected.cvss).toFixed(1)} />
                )}
                {selected.prob != null && (
                  <Row label="Exploit likelihood" value={`${Math.round(selected.prob * 100)}%`} />
                )}
                {selected.mitre && <Row label="MITRE ATT&CK" value={selected.mitre} />}
              </div>

              <button onClick={() => setSelected(null)} className="w-full py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-medium text-gray-400">
                Clear
              </button>
            </motion.div>
          ) : (
            <div className="py-10 flex flex-col items-center text-center opacity-40">
              <AlertCircle size={36} className="mb-3 text-gray-500" />
              <p className="text-xs text-gray-500">Select a node to inspect its details.</p>
            </div>
          )}
        </div>

        {/* Real metrics */}
        <div className="cyber-panel bg-black/40 border border-white/5 p-6">
          <h5 className="text-xs font-semibold text-gray-500 mb-4">Path Analysis</h5>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Attack paths" value={metrics.paths ?? 0} color="text-cyber-blue" />
            <Metric label="Critical nodes" value={metrics.critical ?? 0} color="text-red-500" />
            <Metric label="Max exploit prob" value={`${Math.round((metrics.max_exploit_prob ?? 0) * 100)}%`} color="text-cyber-warning" />
            <Metric label="Exposure" value={metrics.exposure ?? '—'} color="text-cyber-neon" />
          </div>

          {(analysis.top_risks || []).length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <h5 className="text-xs font-semibold text-gray-500 mb-3">Top risks</h5>
              <div className="space-y-2">
                {analysis.top_risks.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-gray-300 truncate">{r.name}</span>
                    <span className="font-semibold flex-shrink-0" style={{ color: riskColor(r.risk_level) }}>{r.risk_level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-xs font-semibold" style={valueColor ? { color: valueColor } : { color: '#e5e7eb' }}>{value}</span>
  </div>
);

const Metric = ({ label, value, color }) => (
  <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
    <span className="text-[10px] text-gray-500 font-medium">{label}</span>
    <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
  </div>
);

const AttackPathView = ({ headerTitle, headerSubtitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await attackPathService.generateGraph();
        if (active) setData(res.data);
      } catch (err) {
        if (active) setError(err.response?.data?.detail || err.message || 'Failed to build attack path.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="animate-spin text-cyber-blue" size={40} />
        <p className="text-sm font-mono text-gray-500">Building attack path from findings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />
      {error ? (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-mono">
          [ERROR] {error}
        </div>
      ) : (
        <AttackGraph data={data || { graph: { nodes: [], links: [] } }} />
      )}
    </div>
  );
};

export default AttackPathView;
