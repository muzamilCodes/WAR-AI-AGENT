'use client';

import React, { useState } from 'react';
import { X, QrCode, Laptop, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { generatePairingCode } from '../../lib/api';
import { DeviceInfo } from '@war-ai/shared';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DeviceInfo[];
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  onClose,
  devices
}) => {
  const [pairingData, setPairingData] = useState<{ code: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const res = await generatePairingCode();
      if (res?.code) {
        setPairingData({ code: res.code, token: res.token });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl glass-panel-glow border-cyan-500/40 p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-lg text-slate-100">Windows PC Device Pairing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Devices List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connected Windows Devices</h4>
          {devices.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
              No remote Windows Agent connected. Run <code className="text-cyan-300 font-mono">npm run start:agent</code> on your Windows PC.
            </div>
          ) : (
            devices.map(dev => (
              <div key={dev.id} className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{dev.name} ({dev.hostname})</p>
                    <p className="text-[10px] text-slate-400 font-mono">{dev.os} • Agent v{dev.agentVersion}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pairing Code Generator */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300">Pair New Windows Device</h4>
          <p className="text-xs text-slate-400">
            Generate a 6-digit secure pairing code to link a remote Windows Agent over the cloud WebSocket hub.
          </p>

          {pairingData ? (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
              <span className="text-xs text-slate-400 font-mono uppercase">Pairing Code (Expires in 10m)</span>
              <span className="font-orbitron font-extrabold text-3xl tracking-widest text-cyan-400">
                {pairingData.code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pairingData.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors pt-1"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Generate 6-Digit Pairing Code
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
