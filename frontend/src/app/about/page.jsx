/* eslint-disable no-unused-vars */
"use client";

import React from 'react';
import { BookOpen, Shield, ShieldCheck, Target, Activity, Code, Scale } from 'lucide-react';
import GlobalHeader from '../../../components/GlobalHeader';

const FrameworkCard = ({ title, desc, icon: Icon, points }) => (
  <div className="cyber-panel">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 flex items-center justify-center text-cyber-blue">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <p className="text-gray-400 text-sm leading-relaxed mb-6">{desc}</p>
    <ul className="space-y-3">
      {points.map((p, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon mt-1.5 shrink-0"></div>
          <span className="text-xs text-gray-300">{p}</span>
        </li>
      ))}
    </ul>
  </div>
);

const AboutFramework = ({ isMonochrome, onToggleMonochrome, headerTitle, headerSubtitle }) => {
  return (
    <div className="space-y-6">
      <GlobalHeader 
        title={headerTitle} 
        subtitle={headerSubtitle} 
        isMonochrome={isMonochrome} 
        onToggleMonochrome={onToggleMonochrome} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold border-b border-cyber-border pb-4">Problem Statement</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Modern organizations face an unprecedented volume of cyber threats. Traditional, manual penetration testing is slow, expensive, and often fails to keep pace with rapid deployment cycles. There is a critical need for automated, AI-assisted platforms that can identify, prioritize, and explain vulnerabilities in real-time.
          </p>
          <div className="p-6 bg-cyber-blue/5 border border-cyber-blue/20 rounded-lg">
            <h4 className="font-bold text-cyber-blue mb-2">The Solution</h4>
            <p className="text-xs text-gray-400 italic">
              "HexaShield provides a unified intelligence engine that combines automated network reconnaissance with AI-driven vulnerability analysis, mapping every finding to global security frameworks for actionable risk management."
            </p>
          </div>
        </div>
        <div className="cyber-panel flex flex-col items-center justify-center text-center p-10 bg-cyber-dark/50">
          <Shield className="text-cyber-blue mb-4 animate-pulse" size={48} />
          <h4 className="font-bold text-xl mb-4">Research Objective</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            To develop a scalable, ethical penetration testing simulator that utilizes artificial intelligence to bridge the gap between technical vulnerability detection and executive-level risk assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FrameworkCard 
          title="OWASP Top 10" 
          icon={ShieldCheck}
          desc="The standard awareness document for developers and web application security."
          points={[
            "Injection (SQL, NoSQL, etc.)",
            "Broken Access Control",
            "Cryptographic Failures",
            "Insecure Design Implementation",
            "Vulnerable & Outdated Components"
          ]}
        />
        <FrameworkCard 
          title="NIST Cybersecurity" 
          icon={Activity}
          desc="A framework to better manage and reduce cybersecurity risk into five core functions."
          points={[
            "Identify: Assets and Risks",
            "Protect: Safeguards and Training",
            "Detect: Monitoring and Analysis",
            "Respond: Mitigation Activities",
            "Recover: Resilience and Planning"
          ]}
        />
        <FrameworkCard 
          title="MITRE ATT&CK" 
          icon={Target}
          desc="A globally-accessible knowledge base of adversary tactics and techniques."
          points={[
            "Reconnaissance and Resource Dev",
            "Initial Access and Execution",
            "Persistence and Priv. Escalation",
            "Lateral Movement and Exfiltration",
            "Impact and Command/Control"
          ]}
        />
        <FrameworkCard 
          title="CVSS Scoring" 
          icon={Scale}
          desc="Standardized system for determining the severity of security vulnerabilities."
          points={[
            "Base Score: Intrinsic qualities",
            "Temporal Score: Current status",
            "Environmental Score: Specific context",
            "Metrics ranging from 0.0 to 10.0",
            "Mapping severity from Low to Critical"
          ]}
        />
        <FrameworkCard 
          title="AI Ethics" 
          icon={Code}
          desc="Principles guiding the responsible use of AI in automated security tools."
          points={[
            "Transparency in AI-led decisions",
            "Prevention of unauthorized exploitation",
            "Data privacy and analyst oversight",
            "Strict orientation toward defense",
            "Auditability of generated insights"
          ]}
        />
        <FrameworkCard 
          title="Academic Scope" 
          icon={BookOpen}
          desc="Project boundary and research methodology details."
          points={[
            "Simulated network environments",
            "Controlled vulnerability injection",
            "Comparative analysis vs manual testing",
            "Heuristic threat intelligence models",
            "Automated reporting benchmarks"
          ]}
        />
      </div>
    </div>
  );
};

export default AboutFramework;

