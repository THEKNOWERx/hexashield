/* eslint-disable no-unused-vars */
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MapPin } from 'lucide-react';

const MapModal = ({ isOpen, onClose, lat, lon, city, country, title }) => {
  if (!lat || !lon) return null;

  // Use the title/exact address for the query if available, otherwise coordinates.
  const query = title ? encodeURIComponent(title) : `${lat},${lon}`;
  const mapUrl = `https://www.google.com/maps?q=${query}&z=15&output=embed`;
  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-cyber-black border border-cyber-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-cyber-border">
              <div className="flex items-center gap-3">
                <MapPin className="text-cyber-blue" size={20} />
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Target Location {city && `â€” ${city}, ${country}`}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 bg-black relative">
              <iframe
                title="Target Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
              />
            </div>

            <div className="p-4 border-t border-cyber-border bg-cyber-surface flex justify-between items-center text-xs">
               <div className="text-gray-500 font-mono">
                 COORDS: {lat}, {lon}
               </div>
               <a 
                href={externalMapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-cyber-blue hover:text-white transition-colors font-bold uppercase tracking-tighter"
               >
                 OPEN IN GOOGLE MAPS
                 <ExternalLink size={14} />
               </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MapModal;

