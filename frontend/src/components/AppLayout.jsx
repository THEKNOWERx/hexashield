"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import NexusChat from './NexusChat';

const publicPaths = ['/', '/login', '/register'];

const ROLE_ROUTES = {
  admin: ['/dashboard', '/recon', '/scan', '/vulnerabilities', '/exploitation', '/reports', '/about', '/admin', '/settings', '/attack-path', '/scientific-lab', '/ai-assistant'],
  security_analyst: ['/dashboard', '/recon', '/scan', '/vulnerabilities', '/exploitation', '/reports', '/attack-path', '/about', '/ai-assistant'],
  analyst: ['/dashboard', '/recon', '/scan', '/vulnerabilities', '/exploitation', '/reports', '/attack-path', '/about', '/ai-assistant'],
  student: ['/scientific-lab', '/attack-path', '/about', '/ai-assistant']
};

const getDefaultRoute = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'student') return '/scientific-lab';
  return '/dashboard';
};

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return { role: 'analyst', permissions: null };
  }
};

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('access_token');
    
    // Auth redirect logic
    if (token) {
      const payload = decodeToken(token);
      const role = payload.role || 'analyst';
      const allowedRoutes = payload.permissions || ROLE_ROUTES[role] || ROLE_ROUTES['analyst'];
      
      const defaultRoute = allowedRoutes.length > 0 ? allowedRoutes[0] : getDefaultRoute(role);
      
      if (publicPaths.includes(pathname)) {
        router.replace(defaultRoute);
      } else {
        // Enforce RBAC
        const isAllowed = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
        
        if (!isAllowed) {
          router.replace(defaultRoute);
        }
      }
    } else if (!token && !publicPaths.includes(pathname)) {
      router.replace('/login');
    }
  }, [pathname, router]);

  const isPublicPage = publicPaths.includes(pathname);

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-cyber-black text-white flex flex-col relative" style={{ visibility: isClient ? 'visible' : 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-black text-white" style={{ visibility: isClient ? 'visible' : 'hidden' }}>
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
}
