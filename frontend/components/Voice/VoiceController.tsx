'use client';

import React, { useEffect, useRef } from 'react';

interface VoiceControllerProps {
  isListening: boolean;
  isSpeaking?: boolean;
  onListeningChange: (listening: boolean) => void;
  onTranscript: (text: string) => void;
  onInterruption: () => void;
  wakeWordEnabled: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  isListening,
  isSpeaking = false,
  onListeningChange,
  onTranscript,
  onInterruption,
  wakeWordEnabled
}) => {
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const onTranscriptRef = useRef(onTranscript);
  const onInterruptionRef = useRef(onInterruption);
  const onListeningChangeRef = useRef(onListeningChange);
  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  const cooldownUntilRef = useRef<number>(0);
  const restartTimerRef = useRef<any>(null);
  const isStartingRef = useRef<boolean>(false);

  // Sync refs to avoid re-triggering speech engine effects
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onInterruptionRef.current = onInterruption;
    onListeningChangeRef.current = onListeningChange;
    wakeWordEnabledRef.current = wakeWordEnabled;
  }, [onTranscript, onInterruption, onListeningChange, wakeWordEnabled]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    if (isSpeaking) {
      cooldownUntilRef.current = Date.now() + 600;
    } else {
      cooldownUntilRef.current = Date.now() + 600;
    }
  }, [isSpeaking]);

  // Main SpeechRecognition Lifecycle (runs once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceController] Web Speech API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Multi-lingual recognition for Hindi, Urdu & English/Hinglish
    recognition.maxAlternatives = 1;

    const safeStart = () => {
      if (!isListeningRef.current || isStartingRef.current) return;
      try {
        isStartingRef.current = true;
        recognition.start();
      } catch (err: any) {
        isStartingRef.current = false;
        // Already started or busy, retry after delay
        if (err.name !== 'InvalidStateError') {
          console.warn('[VoiceController] Start error:', err);
        }
      }
    };

    recognition.onstart = () => {
      isStartingRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcript = item[0]?.transcript?.trim() || '';

        // Check for interruption command in realtime even while AI is speaking
        const lower = transcript.toLowerCase();
        if (['ruko', 'stop', 'bas', 'cancel', 'rok do', 'chup', 'pause'].some(k => lower.includes(k))) {
          onInterruptionRef.current();
          if (item.isFinal) {
            onTranscriptRef.current(transcript);
          }
          return;
        }

        // Suppress transcript while AI is speaking through speakers
        if (isSpeakingRef.current || Date.now() < cooldownUntilRef.current) {
          continue;
        }

        if (item.isFinal) {
          finalTranscript += ' ' + transcript;
        }
      }

      finalTranscript = finalTranscript.trim();

      if (finalTranscript && !isSpeakingRef.current && Date.now() >= cooldownUntilRef.current) {
        // If Wake Word is enabled
        if (wakeWordEnabledRef.current) {
          if (finalTranscript.toLowerCase().includes('hey war') || finalTranscript.toLowerCase().includes('war')) {
            const stripped = finalTranscript.replace(/hey war/gi, '').replace(/^war\s*/gi, '').trim();
            if (stripped) {
              onTranscriptRef.current(stripped);
            }
          }
        } else {
          // Direct Voice Mode: pass all speech
          onTranscriptRef.current(finalTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      isStartingRef.current = false;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('[VoiceController] Microphone permission denied.');
        onListeningChangeRef.current(false);
        return;
      }
      // Recoverable errors (no-speech, network, aborted) -> will auto-restart in onend
    };

    recognition.onend = () => {
      isStartingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

      // Auto-restart loop if user still wants to listen
      if (isListeningRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            safeStart();
          }
        }, 150);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  // Handle User Mic Toggle
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        isStartingRef.current = true;
        recognition.start();
      } catch (err: any) {
        isStartingRef.current = false;
        // Ignore if already started
      }
    } else {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.stop();
      } catch {}
    }
  }, [isListening]);

  return null;
};

