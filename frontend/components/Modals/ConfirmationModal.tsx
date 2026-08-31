'use client';

import React from 'react';
import { ActionRequest } from '@war-ai/shared';
import { AlertOctagon, ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  actionRequest: ActionRequest | null;
  onApprove: () => void;
  onDeny: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  actionRequest,
  onApprove,
  onDeny
}) => {
  if (!isOpen || !actionRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl glass-panel-glow border-amber-500/50 p-6 space-y-5 shadow-2xl shadow-amber-500/10">
        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-lg text-slate-100">
              Security Confirmation Required
            </h3>
            <p className="text-xs text-amber-300/80 font-mono">
              Risk Level: <span className="uppercase font-bold">{actionRequest.riskLevel}</span>
            </p>
          </div>
        </div>

        {/* Action Details */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Target Tool:</span>
            <span className="font-mono text-cyan-400 font-semibold">{actionRequest.tool}</span>
          </div>
          <p className="text-sm text-slate-200 font-medium">
            {actionRequest.confirmationPrompt || actionRequest.description}
          </p>
          
          {actionRequest.args && Object.keys(actionRequest.args).length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Arguments:</span>
              <pre className="mt-1 p-2 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(actionRequest.args, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onDeny}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Deny & Abort
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Check className="w-4 h-4 text-slate-950" />
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
