import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { Readable } from 'stream';

export interface TTSOptions {
  voice?: string;
  lang?: string;
  rate?: number; // 0.5 to 1.5
  pitch?: number;
}

export class TTSService {
  // Default Ultra-Realistic Studio Female/Women Voices
  private static defaultVoices: Record<string, string> = {
    hindi: 'hi-IN-SwaraNeural',
    urdu: 'ur-PK-UzmaNeural',
    roman_hindi: 'hi-IN-SwaraNeural',
    roman_urdu: 'ur-PK-UzmaNeural',
    hinglish: 'hi-IN-SwaraNeural',
    english: 'en-IN-NeerjaNeural'
  };

  /**
   * Cleans text before sending to Neural Speech engine
   */
  public static cleanTextForSpeech(text: string): string {
    return text
      .replace(/[😎✅🚀🛑💻📂🔍⚙️🤖«»*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Automatically select best Neural voice based on language and text (Default: Natural Female Voice)
   */
  public static resolveVoice(text: string, preferredVoice?: string, lang?: string): string {
    if (preferredVoice) return preferredVoice;

    if (lang && this.defaultVoices[lang]) {
      return this.defaultVoices[lang];
    }

    // Check if Urdu script
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ur-PK-UzmaNeural';
    }

    // Check if Devanagari script or Hinglish keywords
    if (/[\u0900-\u097F]/.test(text) || 
        ['kholo', 'chalao', 'karo', 'hain', 'mein', 'boss', 'bhai', 'shuru', 'batayein', 'hoon', 'aap', 'ji'].some(w => text.toLowerCase().includes(w))) {
      return 'hi-IN-SwaraNeural';
    }

    return 'hi-IN-SwaraNeural';
  }

  /**
   * Generates high-definition Neural MP3 audio stream
   */
  public static async generateSpeechStream(
    rawText: string,
    options: TTSOptions = {}
  ): Promise<Readable> {
    const text = this.cleanTextForSpeech(rawText);
    if (!text) {
      throw new Error('Text is empty for speech generation');
    }

    const voice = this.resolveVoice(text, options.voice, options.lang);
    const tts = new MsEdgeTTS();

    // Configure 24kHz High Bitrate MP3 output
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);
    return audioStream;
  }

  /**
   * Generates high-definition Neural MP3 audio buffer
   */
  public static async generateSpeechBuffer(
    rawText: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    const stream = await this.generateSpeechStream(rawText, options);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Get available Neural Voice profiles
   */
  public static getAvailableVoices() {
    return [
      { id: 'hi-IN-SwaraNeural', name: 'WAR AI Female (Natural Hindi / Hinglish Studio - Swara)', lang: 'hi-IN', gender: 'Female', isDefault: true },
      { id: 'en-IN-NeerjaNeural', name: 'WAR AI Female (Natural Indian English - Neerja)', lang: 'en-IN', gender: 'Female' },
      { id: 'ur-PK-UzmaNeural', name: 'WAR AI Female (Natural Urdu Studio - Uzma)', lang: 'ur-PK', gender: 'Female' },
      { id: 'en-US-JennyNeural', name: 'WAR AI Female (Natural US Studio - Jenny)', lang: 'en-US', gender: 'Female' },
      { id: 'en-US-AriaNeural', name: 'WAR AI Female (Expressive US Studio - Aria)', lang: 'en-US', gender: 'Female' },
      { id: 'hi-IN-MadhurNeural', name: 'WAR AI Male (Hindi / Hinglish - Madhur)', lang: 'hi-IN', gender: 'Male' },
      { id: 'en-IN-PrabhatNeural', name: 'WAR AI Male (Indian English - Prabhat)', lang: 'en-IN', gender: 'Male' },
      { id: 'ur-PK-AsadNeural', name: 'WAR AI Male (Urdu - Asad)', lang: 'ur-PK', gender: 'Male' }
    ];
  }
}
