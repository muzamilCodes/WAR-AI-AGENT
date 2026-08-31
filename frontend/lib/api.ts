const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function sendChatMessage(text: string, isVoice: boolean = false, language?: string) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, isVoice, language })
  });
  return await response.json();
}

export async function fetchConnectedDevices() {
  const response = await fetch(`${API_BASE}/api/devices`);
  return await response.json();
}

export async function generatePairingCode() {
  const response = await fetch(`${API_BASE}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
}

export async function confirmAction(actionRequest: any, approved: boolean, planId?: string) {
  const response = await fetch(`${API_BASE}/api/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionRequest, approved, planId })
  });
  return await response.json();
}

export async function fetchAuditLogs() {
  const response = await fetch(`${API_BASE}/api/audit`);
  return await response.json();
}

export async function fetchContextMemory() {
  const response = await fetch(`${API_BASE}/api/context`);
  return await response.json();
}

export function getTTSAudioUrl(text: string, voice?: string, lang?: string): string {
  const params = new URLSearchParams({ text });
  if (voice) params.append('voice', voice);
  if (lang) params.append('lang', lang);
  return `${API_BASE}/api/tts?${params.toString()}`;
}

export async function fetchTTSVoices() {
  try {
    const response = await fetch(`${API_BASE}/api/tts/voices`);
    return await response.json();
  } catch {
    return { success: false, voices: [] };
  }
}
