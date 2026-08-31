'use client';

import React, { useState, useEffect } from 'react';
import { X, Sliders, Volume2, Shield, FolderGit2, FileText, Check } from 'lucide-react';
import { fetchAuditLogs } from '../../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSpeed: number;
  onVoiceSpeedChange: (speed: number) => void;
  wakeWordEnabled: boolean;
  onWakeWordToggle: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSpeed,
  onVoiceSpeedChange,
  wakeWordEnabled,
  onWakeWordToggle
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'security' | 'workspaces' | 'audit'>('voice');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'audit') {
      fetchAuditLogs().then(data => {
        if (data?.logs) setAuditLogs(data.logs);
      }).catch(console.error);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl glass-panel-glow border-cyan-500/40 p-6 space-y-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-lg text-slate-100">WAR AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'voice' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Voice & Wake Word
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'security' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Security & Policy
          </button>
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'workspaces' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-4 h-4" /> Workspaces
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Audit Logs
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'voice' && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="font-semibold text-slate-200">Wake Word Detection («Hey WAR»)</p>
                  <p className="text-xs text-slate-400">Allows hands-free voice triggering</p>
                </div>
                <input
                  type="checkbox"
                  checked={wakeWordEnabled}
                  onChange={(e) => onWakeWordToggle(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-200">Voice Speech Rate: {voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => onVoiceSpeedChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <strong className="text-cyan-300">Supported Languages:</strong> English, Hindi, Urdu, Roman Hindi, Roman Urdu, Hinglish. Language is automatically detected without needing manual switching.
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-semibold text-slate-200 mb-1">Sandboxing & Permissions</h4>
                <p className="text-slate-400 mb-2">High-risk actions (file deletion, system command execution) strictly require interactive user confirmation.</p>
                <div className="space-y-1 font-mono text-emerald-400 text-[11px]">
                  <div>✔ Auto-verify process & window state</div>
                  <div>✔ Blacklist filter on dangerous shell commands</div>
                  <div>✔ Sensitive argument redaction in audit logs</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspaces' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-semibold text-slate-200 mb-1">Active Search Directories</h4>
                <p className="text-slate-400 mb-2">Project discovery searches standard development roots automatically:</p>
                <ul className="list-disc list-inside space-y-1 font-mono text-cyan-300">
                  <li>Desktop & OneDrive Desktop</li>
                  <li>Documents & OneDrive Documents</li>
                  <li>Downloads folder</li>
                  <li>C:\Projects, C:\workspace, C:\dev</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No audit records recorded yet</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-cyan-400 font-semibold">{log.tool}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 truncate">Prompt: &quot;{log.userRequest}&quot;</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={log.executionSuccess ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.executionSuccess ? 'SUCCESS' : 'FAILED'} ({log.executionTimeMs}ms)
                      </span>
                      <span className="text-slate-500">Risk: {log.riskLevel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-mono">WAR AI v1.0 Production</span>
          <button
            onClick={() => {
              setSavedMessage(true);
              setTimeout(() => {
                setSavedMessage(false);
                onClose();
              }, 600);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md"
          >
            {savedMessage ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            {savedMessage ? 'Saved!' : 'Close & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
