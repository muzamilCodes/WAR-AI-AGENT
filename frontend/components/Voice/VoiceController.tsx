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
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const cooldownUntilRef = useRef<number>(0);

  // Keep ref up to date
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    if (isSpeaking) {
      // While speaking, don't allow ambient voice input
      cooldownUntilRef.current = Date.now() + 800;
    } else {
      // Cooldown for 800ms after speaking stops to avoid echo
      cooldownUntilRef.current = Date.now() + 800;
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check browser Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceController] Web Speech API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // supports Hindi & English/Hinglish mixed

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcript = item[0].transcript.trim();

        // Check for interruption command in realtime even while speaking
        const lower = transcript.toLowerCase();
        if (['ruko', 'stop', 'bas', 'cancel', 'rok do', 'chup'].some(k => lower.includes(k))) {
          onInterruption();
          if (item.isFinal) {
            onTranscript(transcript);
          }
          return;
        }

        // If the AI is currently speaking through the speakers, or in post-speech cooldown, IGNORE speaker echo
        if (isSpeakingRef.current || Date.now() < cooldownUntilRef.current) {
          continue;
        }

        if (item.isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript && !isSpeakingRef.current && Date.now() >= cooldownUntilRef.current) {
        // Check for wake word if enabled
        if (wakeWordEnabled && finalTranscript.toLowerCase().includes('hey war')) {
          const stripped = finalTranscript.replace(/hey war/gi, '').trim();
          if (stripped) {
            onTranscript(stripped);
          }
        } else {
          onTranscript(finalTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[VoiceController] Speech recognition:', event.error);
        if (event.error === 'not-allowed') {
          onListeningChange(false);
        }
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [onTranscript, onInterruption, wakeWordEnabled, isListening, onListeningChange]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
      } catch {}
    } else {
      try {
        recognition.stop();
      } catch {}
    }
  }, [isListening]);

  return null;
};

