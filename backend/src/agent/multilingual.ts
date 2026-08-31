import { SupportedLanguage } from '@war-ai/shared';

export class MultilingualEngine {
  // Common Roman Hindi/Urdu words dictionary
  private static readonly HINDI_URDU_ROMAN_KEYWORDS = [
    'kholo', 'khol', 'kholna', 'khol do', 'chalao', 'chala do', 'chala', 'chalana',
    'karo', 'kar do', 'kar', 'karna', 'band', 'hatao', 'dhoondo', 'dhoond', 'khojo',
    'iska', 'iski', 'iske', 'isko', 'usko', 'uska', 'uski', 'uske', 'ye', 'yeh', 'woh', 'wo',
    'wala', 'wali', 'bhai', 'boss', 'mera', 'meri', 'mere', 'apna', 'apni', 'kaunsa', 'kaunsi',
    'kya', 'hai', 'hain', 'mein', 'par', 'se', 'ko', 'aur', 'phir', 'bhi', 'ruko', 'bas',
    'shuru', 'batao', 'dikhao', 'sunao', 'suno'
  ];

  public static detectLanguage(text: string): SupportedLanguage {
    if (!text || text.trim() === '') return 'english';

    // 1. Check Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hindi';
    }

    // 2. Check Arabic/Persian script (Urdu)
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'urdu';
    }

    // 3. Check Roman Hindi / Roman Urdu / Hinglish
    const lower = text.toLowerCase();
    const words = lower.split(/[\s,?.!;:()]+/).filter(w => w.length > 0);
    
    let hindiUrduWordCount = 0;
    for (const w of words) {
      if (this.HINDI_URDU_ROMAN_KEYWORDS.includes(w)) {
        hindiUrduWordCount++;
      }
    }

    const ratio = words.length > 0 ? hindiUrduWordCount / words.length : 0;

    if (hindiUrduWordCount >= 2 || ratio >= 0.25) {
      // If contains typical Urdu spellings (e.g., 'karo', 'apna', 'shukriya', 'bhai')
      if (lower.includes('bhai') || lower.includes('boss') || lower.includes('kholo') || lower.includes('isko')) {
        return 'hinglish';
      }
      return 'roman_hindi';
    }

    return 'english';
  }

  public static isInterruptionCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const stopKeywords = [
      'stop', 'ruko', 'ruk jao', 'bas', 'bas karo', 'cancel', 'cancel karo',
      'chup', 'chup raho', 'shanti', 'rok do', 'abort', 'pause', 'hold on',
      'रुको', 'बस', 'روکو', 'بس'
    ];

    return stopKeywords.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw));
  }

  public static hasPronounReference(text: string): boolean {
    const lower = text.toLowerCase();
    const pronouns = [
      'iska', 'iski', 'iske', 'isko', 'usko', 'uska', 'uski', 'uske',
      'ye wala', 'yeh wala', 'woh wala', 'is project', 'is folder',
      'its', 'this', 'that', 'it'
    ];
    return pronouns.some(p => new RegExp(`\\b${p}\\b`, 'i').test(lower));
  }

  public static generateNaturalResponse(
    intent: 'confirm' | 'acknowledge' | 'completed' | 'clarify' | 'error' | 'stopped',
    lang: SupportedLanguage,
    context: {
      actionName?: string;
      targetName?: string;
      details?: string;
      options?: string[];
    } = {}
  ): string {
    const isDesi = ['hindi', 'urdu', 'roman_hindi', 'roman_urdu', 'hinglish'].includes(lang);

    // Clean target name from technical prefix or raw URLs
    let cleanTarget = (context.targetName || context.actionName || 'Task')
      .replace(/^open browser:\s*/i, '')
      .replace(/^https?:\/\/\S+/i, 'Browser')
      .replace(/%[0-9a-fA-F]{2}/g, '')
      .replace(/_/g, ' ')
      .trim();

    if (!cleanTarget || cleanTarget.toLowerCase().includes('http')) {
      cleanTarget = 'Task';
    }

    switch (intent) {
      case 'acknowledge':
        if (isDesi) {
          return `Ji boss! Main ${cleanTarget} shuru kar rahi hoon...`;
        }
        return `Sure thing! Starting ${cleanTarget} right away...`;

      case 'completed':
        if (isDesi) {
          if (cleanTarget.toLowerCase().includes('lock')) {
            return `Ji boss! Aapka laptop lock kar diya gaya hai.`;
          }
          if (cleanTarget.toLowerCase().includes('youtube')) {
            return `Ji boss! YouTube open kar diya gaya hai.`;
          }
          if (cleanTarget.toLowerCase().includes('browser') || cleanTarget.toLowerCase().includes('chrome')) {
            return `Ji boss! Browser successfully open ho gaya hai.`;
          }
          return `Done boss! ${cleanTarget} successfully complete ho gaya hai.`;
        }
        return `All set! ✅ Successfully completed ${cleanTarget}.`;

      case 'clarify':
        if (isDesi) {
          if (context.options && context.options.length > 0) {
            return `Boss, mujhe ${context.options.length} matches mile hain. Kaunsa open karun?`;
          }
          return `Ji boss, batayein kaunsa project ya app open karna hai?`;
        }
        if (context.options && context.options.length > 0) {
          return `I found ${context.options.length} matches. Which one would you like to open?`;
        }
        return `Sure! Which project or file would you like to open?`;

      case 'error':
        if (isDesi) {
          return `Boss, issue aa gaya: ${context.details || 'Action perform nahi ho paya'}. Kya main dobara try karun?`;
        }
        return `Encountered an issue: ${context.details || 'Could not complete action'}. Would you like me to retry?`;

      case 'stopped':
        if (isDesi) {
          return `Theek hai boss, main ruk gayi hoon. Agla command bataiye.`;
        }
        return `Understood 🛑 Operation cancelled. Ready for your next command.`;

      default:
        return isDesi ? 'Ji boss, batayein, main sun rahi hoon.' : 'How can I help you today?';
    }
  }
}
