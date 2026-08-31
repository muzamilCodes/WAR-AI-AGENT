'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '@war-ai/shared';
import { Bot, User, Volume2, ShieldAlert, Sparkles, Check, X } from 'lucide-react';

interface ChatContainerProps {
  messages: ChatMessage[];
  onConfirmAction?: (actionRequest: any, approved: boolean, planId?: string) => void;
  onQuickPromptSelect?: (prompt: string) => void;
  onSpeakMessage?: (text: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onConfirmAction,
  onQuickPromptSelect,
  onSpeakMessage
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    'Hey WAR, VS Code kholo.',
    'Sportify project kholo.',
    'Ab iska terminal kholo aur project run karo.',
    'Chrome kholo aur Google open karo.',
    'Screen par kya chal raha hai?'
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 md:px-6 py-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <Bot className="w-9 h-9 text-slate-950" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="font-orbitron font-bold text-xl text-slate-100">
              Hello, I am <span className="text-cyan-400">WAR AI</span>
            </h2>
            <p className="text-sm text-slate-400">
              Your Personal AI Computer Agent. Speak or type in English, Hindi, Urdu, or Hinglish to control your Windows PC.
            </p>
          </div>

          {/* Quick Prompt Chips */}
          <div className="w-full max-w-lg space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickPromptSelect?.(prompt)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all shadow-sm text-left"
                >
                  «&nbsp;{prompt}&nbsp;»
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  isAgent
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-500/20 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                    : 'glass-panel-glow border-slate-700/60 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isAgent ? 'WAR AI' : 'You'}
                  </span>
                  {msg.language && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                      {msg.language.toUpperCase()}
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Confirmation Box if message requires permission */}
                {msg.requiresConfirmation && msg.pendingAction && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Security Approval Required</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {msg.pendingAction.description || `Execute ${msg.pendingAction.tool}`}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onConfirmAction?.(msg.pendingAction, true, msg.planId)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Execute
                      </button>
                      <button
                        onClick={() => onConfirmAction?.(msg.pendingAction, false, msg.planId)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Deny
                      </button>
                    </div>
                  </div>
                )}

                {/* Read aloud TTS button for AI messages */}
                {isAgent && (
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={() => onSpeakMessage?.(msg.text)}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Speak response"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
