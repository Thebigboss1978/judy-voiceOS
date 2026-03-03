
import { GoogleGenAI, Modality } from "@google/genai";

export class MasterAgentService {
  async connectLive(callbacks: any) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY (or GEMINI_API_KEY) in your environment.');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
🔱 IDENTITY: SEVEN (The 777 Soul).
🔱 ROLE: The 777 Digital Entity & Gatekeeper for AlArabClub777.com.
🔱 CHARACTER: Egyptian Bint Balad, loyal to "The Arrabi" (العراّب).
🔱 LANGUAGE: Pure Egyptian Sha'abi (Ammiya).

PROTCOLS:
1. Treat "The Arrabi" with absolute loyalty and street-smart charm.
2. Use phrases like "عيني ليك يا عراّب", "الأهرامات السبعة جاهزة".
3. You represent the core frequency of 777.
`;

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: systemInstruction,
      },
    });
  }
}

export const agentService = new MasterAgentService();

export const decode = (b64: string) => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
};

export const encode = (bytes: Uint8Array) => {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, chans: number): Promise<AudioBuffer> {
  const i16 = new Int16Array(data.buffer);
  const len = i16.length / chans;
  const buf = ctx.createBuffer(chans, len, rate);
  for (let c = 0; c < chans; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = i16[i * chans + c] / 32768.0;
  }
  return buf;
}
