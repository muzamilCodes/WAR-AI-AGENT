'use client';

import React from 'react';
import { Bot, Shield, Laptop, Settings, QrCode, Wifi, WifiOff } from 'lucide-react';
import { DeviceInfo } from '@war-ai/shared';

interface HeaderProps {
  device?: DeviceInfo;
  onOpenSettings: () => void;
  onOpenPairing: () => void;
  activeTaskCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  device,
  onOpenSettings,
  onOpenPairing,
  activeTaskCount,
}) => {
  const isOnline = !!device?.isOnline;

  return (
    <header className="w-full glass-panel border-b border-cyan-500/20 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Bot className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-cyber-dark animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              WAR AI
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 tracking-widest">
              v1.0 Windows
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Your Personal AI Computer Agent</p>
        </div>
      </div>

      {/* Center Activity Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 shadow-inner">
        <Shield className="w-3.5 h-3.5 text-cyan-400" />
        <span>Security Boundary: <strong className="text-emerald-400">Protected</strong></span>
        {activeTaskCount > 0 && (
          <span className="flex items-center gap-1 ml-2 text-cyan-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {activeTaskCount} Active Step{activeTaskCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Right Controls: Device Status & Modals */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Device Pill */}
        <button
          onClick={onOpenPairing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 shadow-sm shadow-emerald-500/20'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
          }`}
          title="Click to manage paired Windows PC"
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono">
            {device ? device.hostname : 'Windows PC'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </button>

        {/* Pairing / QR Code Button */}
        <button
          onClick={onOpenPairing}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Pair Remote Device"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
