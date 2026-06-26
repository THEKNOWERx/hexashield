/* eslint-disable react-refresh/only-export-components */
"use client";

import React, { createContext, useContext, useState } from 'react';

const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
  const [reconResults, setReconResults] = useState(null);
  
  // Scan Persistence
  const [scanResults, setScanResults] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [livePorts, setLivePorts] = useState([]);
  
  // Vulnerability Persistence
  const [vulnResults, setVulnResults] = useState(null);
  
  const [activeTarget, setActiveTarget] = useState("");

  const clearAll = () => {
    setReconResults(null);
    setScanResults(null);
    setScanLogs([]);
    setScanProgress(0);
    setLivePorts([]);
    setVulnResults(null);
    setActiveTarget("");
  };

  return (
    <SecurityContext.Provider value={{ 
      reconResults, setReconResults, 
      scanResults, setScanResults,
      scanLogs, setScanLogs,
      scanProgress, setScanProgress,
      livePorts, setLivePorts,
      vulnResults, setVulnResults,
      activeTarget, setActiveTarget,
      clearAll
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
