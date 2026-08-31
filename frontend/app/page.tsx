'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header/Header';
import { AudioOrb } from '../components/Visualizer/AudioOrb';
import { ChatContainer } from '../components/Chat/ChatContainer';
import { ChatInput } from '../components/Chat/ChatInput';
import { ActivityStream } from '../components/Activity/ActivityStream';
import { VoiceController } from '../components/Voice/VoiceController';
import { ConfirmationModal } from '../components/Modals/ConfirmationModal';
import { SettingsModal } from '../components/Modals/SettingsModal';
import { DevicePairingModal } from '../components/Device/DevicePairingModal';
import { ChatMessage, TaskStep, ActivityEvent, DeviceInfo, ActionRequest, StepStatus } from '@war-ai/shared';
import { sendChatMessage, confirmAction, fetchConnectedDevices } from '../lib/api';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSteps, setCurrentSteps] = useState<TaskStep[]>([]);
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const [planSummary, setPlanSummary] = useState<string>('');
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'thinking' | 'planning' | 'executing' | 'speaking'>('idle');

  // Device & Modals
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingActionRequest, setPendingActionRequest] = useState<ActionRequest | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | undefined>(undefined);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);

  // Voice Settings
  const [isListening, setIsListening] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Setup WebSocket connection to backend
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    let ws: WebSocket;

    const connectWS = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Frontend WS] Connected to WAR AI Backend Hub');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'activity_event') {
              const ev = data.event as ActivityEvent;
              setLiveEvents(prev => [ev, ...prev.slice(0, 20)]);

              if (ev.type === 'plan_created') {
                setPlanSummary(ev.title);
                setAgentState('executing');
              } else if (ev.type === 'step_start' || ev.type === 'step_progress') {
                setCurrentSteps(prev => {
                  const existingIdx = prev.findIndex(s => s.id === ev.stepId);
                  if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = { ...updated[existingIdx], status: ev.status as StepStatus, description: ev.description };
                    return updated;
                  }
                  return prev;
                });
              } else if (ev.type === 'step_complete') {
                setCurrentSteps(prev => {
                  const existingIdx = prev.findIndex(s => s.id === ev.stepId);
                  if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                      ...updated[existingIdx],
                      status: 'completed',
                      result: { success: true, message: ev.description, tool: updated[existingIdx].tool || 'open_application', id: ev.stepId || 'step' }
                    };
                    return updated;
                  }
                  return prev;
                });
              }
            } else if (data.type === 'device_status_update' || data.type === 'init_state') {
              if (data.devices) setDevices(data.devices);
            }
          } catch (err) {
            console.error('[Frontend WS] Message parsing error:', err);
          }
        };

        ws.onclose = () => {
          setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.error('[Frontend WS] Setup failed:', err);
      }
    };

    connectWS();

    // Initial devices fetch
    fetchConnectedDevices().then(res => {
      if (res?.devices) setDevices(res.devices);
    }).catch(console.error);

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Text-To-Speech function with realistic voice selection
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // cancel prior speech

    // Clean emojis & formatting for smooth speech
    const speechCleanText = text
      .replace(/[😎✅🚀🛑💻📂🔍⚙️🤖«»*#_`]/g, '')
      .replace(/[\n\r]+/g, ' ')
      .trim();

    if (!speechCleanText) return;

    const utterance = new SpeechSynthesisUtterance(speechCleanText);
    utterance.rate = Math.min(Math.max(voiceSpeed, 0.8), 1.3);
    utterance.pitch = 1.0;

    const voices = synth.getVoices();
    const isHindiText = /[\u0900-\u097F]/.test(speechCleanText) || 
      ['kholo', 'chalao', 'karo', 'hain', 'mein', 'boss', 'bhai', 'shuru', 'batayein', 'hoon', 'kar'].some(w => speechCleanText.toLowerCase().includes(w));

    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (isHindiText) {
      // 1. Natural / Online Hindi voices (Edge/Chrome Microsoft Natural/Google voices)
      selectedVoice = voices.find(v => 
        (v.lang.toLowerCase().startsWith('hi') || v.lang.includes('hi-IN')) && 
        (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Swara') || v.name.includes('Madhur'))
      ) || voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.lang.includes('hi-IN'));
    }

    if (!selectedVoice) {
      // 2. High-quality Indian English or British/US Natural voices
      selectedVoice = voices.find(v => 
        (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')) && 
        (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('Neerja') || v.name.includes('Google'))
      ) || voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setAgentState('speaking');
    utterance.onend = () => {
      setAgentState('idle');
    };
    utterance.onerror = () => {
      setAgentState('idle');
    };

    synth.speak(utterance);
  }, [voiceSpeed]);

  // Voice Interruption: "Ruko", "Stop", "Bas", "Cancel"
  const handleVoiceInterruption = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setAgentState('listening');
  }, []);

  // Stop button clicked
  const handleStop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsListening(false);
    setAgentState('idle');
  }, []);

  // User sends message (via text or voice)
  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      isVoice
    };

    setMessages(prev => [...prev, userMessage]);
    setAgentState('thinking');

    try {
      const response = await sendChatMessage(text, isVoice);
      if (response && response.message) {
        setMessages(prev => [...prev, response.message]);

        if (response.plan && response.plan.steps) {
          setCurrentSteps(response.plan.steps);
          setPlanSummary(response.plan.summary);
        }

        if (response.requiresConfirmation && response.pendingAction) {
          setPendingActionRequest(response.pendingAction);
          setPendingPlanId(response.plan?.id);
          setConfirmationModalOpen(true);
          setAgentState('idle');
        } else {
          // Speak AI response aloud
          speakText(response.message.text);
        }
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'agent',
        text: `Boss, network error: ${err.message || 'Could not reach backend'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setAgentState('idle');
    }
  };

  // Handle High-Risk Confirmation Decision
  const handleConfirmDecision = async (actionReq: ActionRequest, approved: boolean, planId?: string) => {
    setConfirmationModalOpen(false);
    setAgentState('executing');

    try {
      const res = await confirmAction(actionReq, approved, planId);
      const feedbackMsg: ChatMessage = {
        id: `confirm_resp_${Date.now()}`,
        sender: 'agent',
        text: approved
          ? (res?.result?.message || 'Action executed successfully')
          : 'Action cancelled boss.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, feedbackMsg]);
      speakText(feedbackMsg.text);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAgentState('idle');
      setPendingActionRequest(null);
    }
  };

  const activeDevice = devices.find(d => d.isOnline) || devices[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#06080e] text-slate-100 font-sans">
      {/* Voice Subsystem */}
      <VoiceController
        isListening={isListening}
        isSpeaking={agentState === 'speaking'}
        onListeningChange={setIsListening}
        onTranscript={(transcript) => {
          handleSendMessage(transcript, true);
        }}
        onInterruption={handleVoiceInterruption}
        wakeWordEnabled={wakeWordEnabled}
      />

      {/* Header */}
      <Header
        device={activeDevice}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenPairing={() => setPairingModalOpen(true)}
        activeTaskCount={currentSteps.filter(s => s.status === 'running').length}
      />

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Audio Visualizer Orb + Conversation Chat Stream */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-800/80">
          {/* Top Visualizer Area */}
          <div className="py-2 px-4 flex items-center justify-center bg-gradient-to-b from-cyan-950/20 to-transparent border-b border-slate-800/40">
            <AudioOrb
              state={agentState}
              onClick={() => setIsListening(prev => !prev)}
            />
          </div>

          {/* Chat Stream */}
          <ChatContainer
            messages={messages}
            onConfirmAction={handleConfirmDecision}
            onQuickPromptSelect={(prompt) => handleSendMessage(prompt, false)}
            onSpeakMessage={speakText}
          />

          {/* Chat & Voice Input */}
          <ChatInput
            onSendMessage={(txt, isV) => handleSendMessage(txt, isV)}
            onStop={handleStop}
            isListening={isListening}
            isThinking={agentState === 'thinking'}
            isSpeaking={agentState === 'speaking'}
            onToggleMic={() => setIsListening(prev => !prev)}
          />
        </div>

        {/* Right: Realtime Action Activity Tree */}
        <div className="hidden lg:block w-96 h-full glass-panel bg-slate-950/70 overflow-hidden">
          <ActivityStream
            steps={currentSteps}
            liveEvents={liveEvents}
            planSummary={planSummary}
          />
        </div>
      </div>

      {/* Security Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModalOpen}
        actionRequest={pendingActionRequest}
        onApprove={() => pendingActionRequest && handleConfirmDecision(pendingActionRequest, true, pendingPlanId)}
        onDeny={() => pendingActionRequest && handleConfirmDecision(pendingActionRequest, false, pendingPlanId)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        voiceSpeed={voiceSpeed}
        onVoiceSpeedChange={setVoiceSpeed}
        wakeWordEnabled={wakeWordEnabled}
        onWakeWordToggle={setWakeWordEnabled}
      />

      {/* Remote Device Pairing Modal */}
      <DevicePairingModal
        isOpen={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        devices={devices}
      />
    </div>
  );
}
