'use client';

import React from 'react';
import { ActivityEvent, TaskStep } from '@war-ai/shared';
import { CheckCircle2, AlertTriangle, Loader2, PlayCircle, ShieldCheck, Terminal, Folder, Globe, Search, Cpu } from 'lucide-react';

interface ActivityStreamProps {
  steps?: TaskStep[];
  liveEvents?: ActivityEvent[];
  planSummary?: string;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  steps = [],
  liveEvents = [],
  planSummary
}) => {
  if (steps.length === 0 && liveEvents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <p className="font-orbitron text-sm uppercase tracking-wider text-slate-400">Activity Monitor</p>
        <p className="text-xs text-slate-600 mt-1 max-w-xs">
          Real-time Windows automation actions, process verification, and security checks will appear here.
        </p>
      </div>
    );
  }

  const getToolIcon = (tool?: string) => {
    switch (tool) {
      case 'open_vscode':
      case 'open_vscode_project':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'open_terminal':
      case 'execute_command':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'open_folder':
      case 'create_folder':
      case 'project_discovery':
        return <Folder className="w-4 h-4 text-amber-400" />;
      case 'open_browser':
      case 'search_browser':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'find_installed_application':
      case 'search_file':
        return <Search className="w-4 h-4 text-purple-400" />;
      default:
        return <PlayCircle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h2 className="font-orbitron font-semibold text-xs text-slate-300 uppercase tracking-wider">
            Live Action Activity
          </h2>
        </div>
        {planSummary && (
          <span className="text-[11px] text-cyan-400/80 font-mono truncate max-w-[200px]">
            {planSummary}
          </span>
        )}
      </div>

      {/* Step Tree List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {steps.map((step, index) => {
          const isPending = step.status === 'pending';
          const isRunning = step.status === 'running' || step.status === 'verifying';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isWaiting = step.status === 'waiting_confirmation';

          return (
            <div
              key={step.id || index}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isRunning
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-500/10 scale-[1.01]'
                  : isCompleted
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : isFailed
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : isWaiting
                  ? 'bg-amber-950/30 border-amber-500/50 animate-pulse'
                  : 'bg-slate-900/30 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-slate-800 border border-slate-700">
                    {getToolIcon(step.tool)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{step.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                    {step.result?.verificationDetails && (
                      <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {step.result.verificationDetails}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-[10px] text-rose-400 font-mono mt-1">
                        {step.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isRunning && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      EXECUTING
                    </span>
                  )}
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3" />
                      VERIFIED
                    </span>
                  )}
                  {isFailed && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <AlertTriangle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      CONFIRMING
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                      QUEUED
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
