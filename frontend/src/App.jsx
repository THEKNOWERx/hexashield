/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ReconView from './pages/ReconView';
import VulnAnalysisView from './pages/VulnAnalysisView';
import ExploitationView from './pages/ExploitationView';
import AttackPathView from './pages/AttackPathView';
import AIAssistantView from './pages/AIAssistantView';
import ReportGeneratorView from './pages/ReportGeneratorView';
import ReportDetailView from './pages/ReportDetailView';
import ScanView from './pages/ScanView';
import AdminPanelView from './pages/AdminPanelView';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutFramework from './pages/AboutFramework';
import ScientificLabView from './pages/ScientificLabView';
import NexusIntelligenceView from './pages/NexusIntelligenceView';
import URLScannerView from './pages/URLScannerView';
import { NotificationProvider } from './components/NotificationSystem';
import NexusChat from './components/NexusChat';
import ProtectedRoute from './components/ProtectedRoute';
import { SecurityProvider } from './context/SecurityContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeCustomizerView from './pages/ThemeCustomizerView';

const AppLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex h-screen bg-cyber-black overflow-hidden font-sans border-t border-white/5">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <main className="flex-1 overflow-y-auto p-12 relative z-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
          <NexusChat />
        </main>
      </div>
    </div>
  );
};

function App() {
  const wrapLayout = (Component, title, subtitle) => (
    <AppLayout 
      title={title}
      subtitle={subtitle}
    >
      <Component 
        headerTitle={title}
        headerSubtitle={subtitle}
      />
    </AppLayout>
  );

  return (
    <Router>
      <ThemeProvider>
        <NotificationProvider>
          <SecurityProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Default Authenticated Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'security_analyst', 'analyst', 'student']} />}>
              <Route path="/dashboard" element={wrapLayout(Dashboard, "SOC Overview", "Real-time threat detection and infrastructure rank analysis.")} />
              <Route path="/vulnerabilities" element={wrapLayout(VulnAnalysisView, "Vulnerability", "Deep discovery and intelligent remediation orchestration.")} />
              <Route path="/attack-path" element={wrapLayout(AttackPathView, "Attack Path Analysis", "Topological visualization of exploit chains.")} />
              <Route path="/reports" element={wrapLayout(ReportGeneratorView, "Audit Inventory", "Professional penetration testing reports and historical logs.")} />
              <Route path="/reports/:id" element={wrapLayout(ReportDetailView, "Audit Intelligence", "Deep dive post-mortem of security audit event.")} />
              <Route path="/ai-assistant" element={wrapLayout(AIAssistantView, "AI Security Assistant", "Neural-powered remediation and advisory engine.")} />
              <Route path="/settings/theme" element={wrapLayout(ThemeCustomizerView, "Aesthetic Control", "Neural customization of the platform's visual identity.")} />
              <Route path="/about" element={wrapLayout(AboutFramework, "Framework", "System architecture and security standard documentation.")} />
              
              {/* Nexus Navigation Targets */}
              <Route path="/nexus/tactical" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="tactical" />, "Nexus Command", "Unified Tactical Intelligence")} />
              <Route path="/nexus/intelligence" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="intelligence" />, "Nexus Command", "Unified Tactical Intelligence")} />
              <Route path="/nexus/protocol" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="protocol" />, "Nexus Command", "Unified Tactical Intelligence")} />
            </Route>

          {/* Elevated Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'security_analyst', 'analyst']} />}>
            <Route path="/recon" element={wrapLayout(ReconView, "Passive Reconnaissance", "Network surface mapping: IP geo, DNS, SSL, subdomains, and WHOIS.")} />
            <Route path="/scan" element={wrapLayout(ScanView, "Infrastructure Scanning", "TCP/UDP discovery and active service fingerprinting.")} />
            <Route path="/url-scan" element={wrapLayout(URLScannerView, "URL Expert Audit", "High-fidelity reputation analysis and deep web protocol inspection.")} />
          </Route>

          {/* Admin Exclusive Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={wrapLayout(AdminPanelView, "Command Center", "User management and platform global controls.")} />
          </Route>
          
          </Routes>
          </SecurityProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

