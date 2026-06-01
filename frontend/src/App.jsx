/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ReconView from './pages/ReconView';
import VulnAnalysisView from './pages/VulnAnalysisView';
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
    <div className="flex h-screen bg-cyber-black overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto px-8 py-8 relative z-10 custom-scrollbar">
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
              <Route path="/dashboard" element={wrapLayout(Dashboard, "Security Overview", "Risk posture and active threats.")} />
              <Route path="/vulnerabilities" element={wrapLayout(VulnAnalysisView, "Vulnerabilities", "Findings and remediation guidance.")} />
              <Route path="/attack-path" element={wrapLayout(AttackPathView, "Attack Path", "Visualization of exploit chains.")} />
              <Route path="/reports" element={wrapLayout(ReportGeneratorView, "Reports", "Penetration testing reports and history.")} />
              <Route path="/reports/:id" element={wrapLayout(ReportDetailView, "Report", "Detailed assessment results.")} />
              <Route path="/ai-assistant" element={wrapLayout(AIAssistantView, "AI Assistant", "AI-powered remediation and advisory.")} />
              <Route path="/settings/theme" element={wrapLayout(ThemeCustomizerView, "Appearance", "Customize the platform's look and feel.")} />
              <Route path="/about" element={wrapLayout(AboutFramework, "Framework", "Architecture and standards documentation.")} />
              
              {/* Nexus Navigation Targets */}
              <Route path="/nexus/tactical" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="tactical" />, "Platform", "Unified intelligence")} />
              <Route path="/nexus/intelligence" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="intelligence" />, "Platform", "Unified intelligence")} />
              <Route path="/nexus/protocol" element={wrapLayout(props => <NexusIntelligenceView {...props} initialTab="protocol" />, "Platform", "Unified intelligence")} />
            </Route>

          {/* Elevated Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'security_analyst', 'analyst']} />}>
            <Route path="/recon" element={wrapLayout(ReconView, "Reconnaissance", "IP geo, DNS, SSL, subdomains, and WHOIS.")} />
            <Route path="/scan" element={wrapLayout(ScanView, "Network Scan", "Port discovery and service fingerprinting.")} />
            <Route path="/url-scan" element={wrapLayout(URLScannerView, "URL Audit", "Reputation analysis and protocol inspection.")} />
          </Route>

          {/* Admin Exclusive Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={wrapLayout(AdminPanelView, "Admin", "User management and platform controls.")} />
          </Route>
          
          </Routes>
          </SecurityProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

