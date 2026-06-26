"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { Palette, Shield, Zap, Layout, CheckCircle2 } from 'lucide-react';
import GlobalHeader from '../../../components/GlobalHeader';

const ThemeOption = ({ mode, title, description, isSelected, onSelect, colorClass }) => {
  const swatchConfig = {
    cyber: { bg: 'bg-black', accent: 'bg-cyber-blue', neon: 'bg-cyber-green' },
    monochrome: { bg: 'bg-gray-800', accent: 'bg-gray-500', neon: 'bg-gray-400' },
    plasma: { bg: 'bg-white', accent: 'bg-blue-600', neon: 'bg-blue-400' },
    red: { bg: 'bg-[#1A0000]', accent: 'bg-red-600', neon: 'bg-orange-500' },
    toxic: { bg: 'bg-black', accent: 'bg-[#39FF14]', neon: 'bg-[#00FF90]' },
    'deep-blue': { bg: 'bg-[#00051A]', accent: 'bg-[#0070FF]', neon: 'bg-[#00F0FF]' }
  };

  const swatches = swatchConfig[mode] || swatchConfig.cyber;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(mode)}
      className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group ${
        isSelected 
          ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_30px_rgba(0,71,255,0.2)]' 
          : 'border-white/5 bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-white/5 ${isSelected ? colorClass : 'text-gray-500'}`}>
          <Palette size={24} />
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-cyber-blue"
          >
            <CheckCircle2 size={24} />
          </motion.div>
        )}
      </div>

      <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
        {title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>

      {/* Visual Preview Swatches (Refined & Accurate) */}
      <div className="mt-6 flex gap-2">
        <div className={`w-8 h-8 rounded-lg border border-white/10 ${swatches.bg}`} title="Background" />
        <div className={`w-8 h-8 rounded-lg border border-white/10 ${swatches.accent}`} title="Primary Accent" />
        <div className={`w-8 h-8 rounded-lg border border-white/10 ${swatches.neon}`} title="Neon/Alert" />
      </div>

      {isSelected && (
        <motion.div
          layoutId="selected-bg"
          className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-transparent pointer-events-none"
        />
      )}
    </motion.div>
  );
};

const ThemeCustomizerView = ({ headerTitle, headerSubtitle }) => {
  const { themeMode, setThemeMode } = useTheme();

  const themes = [
    {
      mode: 'cyber',
      title: 'Cyber (Default)',
      description: 'Standard high-fidelity dark mode with neon highlights, optimized for low-light environments.',
      colorClass: 'text-cyber-neon'
    },
    {
      mode: 'red',
      title: 'Red (High Alert)',
      description: 'High-intensity interface with striking red accents.',
      colorClass: 'text-red-600'
    },
    {
      mode: 'toxic',
      title: 'Neon Green',
      description: 'High-contrast aesthetic using bright neon greens for maximum visibility.',
      colorClass: 'text-[#39FF14]'
    },
    {
      mode: 'deep-blue',
      title: 'Deep Blue',
      description: 'Sleek midnight blue aesthetic with a calm, focused look.',
      colorClass: 'text-blue-500'
    },
    {
      mode: 'monochrome',
      title: 'Grayscale',
      description: 'High-contrast monochrome theme. Minimalist and focused.',
      colorClass: 'text-white'
    },
    {
      mode: 'plasma',
      title: 'Light Mode',
      description: 'A clean white and blue aesthetic, ideal for presentations and bright environments.',
      colorClass: 'text-blue-500'
    }
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-8">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-cyber-blue" />
            <h2 className="text-sm font-semibold text-gray-400">
              Appearance
            </h2>
          </div>
          <button 
            onClick={() => setThemeMode('cyber')}
            className="text-xs font-medium text-gray-500 hover:text-cyber-neon transition-colors"
          >
            Reset to default
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <ThemeOption
              key={theme.mode}
              {...theme}
              isSelected={themeMode === theme.mode}
              onSelect={setThemeMode}
            />
          ))}
        </div>
      </section>

      <div className="cyber-panel p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-cyber-blue/5 to-transparent">
        <div className="flex gap-6 items-center">
            <div className="w-16 h-16 rounded-2xl bg-cyber-blue/20 flex items-center justify-center border border-cyber-blue/30 overflow-hidden relative">
                <Layout className="text-cyber-blue relative z-10" size={32} />
                <div className="absolute inset-0 bg-cyber-blue/10 animate-pulse" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">Saved locally</h3>
                <p className="text-xs text-gray-500 max-w-sm">Your theme is stored in this browser and will persist across sessions on this device.</p>
            </div>
        </div>
        <button 
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all text-white"
        >
            Done
        </button>
      </div>

      <footer className="pt-12 border-t border-white/5 flex flex-col items-center gap-4 text-center">
          <Shield size={24} className="text-gray-800" />
          <p className="text-xs font-medium text-gray-600">HexaShield · Appearance</p>
      </footer>
    </div>
  );
};

export default ThemeCustomizerView;
