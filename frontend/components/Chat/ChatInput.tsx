'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Square, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, isVoice?: boolean) => void;
  onStop: () => void;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isListening,
  isThinking,
  isSpeaking,
  onToggleMic
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim(), false);
    setInput('');
  };

  const isBusy = isThinking || isSpeaking;

  return (
    <div className="w-full glass-panel border-t border-cyan-500/20 px-4 py-3 sm:px-6">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
        {/* Voice Mic Button */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white pulse-ring-active'
              : 'bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-cyan-400'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Voice Control'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Stop Operation Button (Active when agent is thinking, speaking or executing) */}
        {isBusy && (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            title="Interrupt and stop WAR AI"
          >
            <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        {/* Text Input Field */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isListening}
            placeholder={
              isListening
                ? '🎙️ Listening... (Say "Hey WAR" or your command)'
                : 'Ask WAR anything... ("VS Code kholo", "Sportify run karo")'
            }
            className="w-full py-3 pl-4 pr-10 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 shadow-inner"
          />
          <Sparkles className="w-4 h-4 text-cyan-500/40 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
