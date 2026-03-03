import React, { useState, useRef } from 'react';
import { agentService, decode, decodeAudioData, encode } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE'>('IDLE');
  const [volume, setVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const startSeven = async () => {
    if (status !== 'IDLE') return;
    setStatus('CONNECTING');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;

      const outAnal = outputCtx.createAnalyser();
      analyserRef.current = outAnal;

      const sessionPromise = agentService.connectLive({
        onopen: () => setStatus('LIVE'),
        onmessage: async (msg: any) => {
          const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && outputAudioCtxRef.current) {
            const buf = await decodeAudioData(decode(audio), outputAudioCtxRef.current, 24000, 1);
            const source = outputAudioCtxRef.current.createBufferSource();
            source.buffer = buf;
            source.connect(analyserRef.current!);
            source.connect(outputAudioCtxRef.current.destination);

            const start = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + buf.duration;

            setIsAiSpeaking(true);
            source.onended = () => {
              if (outputAudioCtxRef.current && outputAudioCtxRef.current.currentTime >= nextStartTimeRef.current) {
                setIsAiSpeaking(false);
              }
            };
          }

          if (msg.serverContent?.interrupted) {
            nextStartTimeRef.current = 0;
            setIsAiSpeaking(false);
          }
        },
        onerror: (e: any) => {
          console.error(e);
          setStatus('IDLE');
        },
        onclose: () => setStatus('IDLE')
      });

      sessionPromiseRef.current = sessionPromise;

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        const currentSessionPromise = sessionPromiseRef.current;
        if (currentSessionPromise) {
          const data = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(data.length);
          for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;

          currentSessionPromise.then((session) => {
            session.sendRealtimeInput({
              media: {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              }
            });
          });
        }
      };

      const update = () => {
        if (analyserRef.current) {
          const d = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(d);
          const avg = d.reduce((a, b) => a + b, 0) / d.length;
          setVolume(avg);
        }
        requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error(err);
      setStatus('IDLE');
    }
  };

  const orbSize = 240 + (status === 'LIVE' ? volume * 1.1 : 0);

  return (
    <div className="min-h-screen w-full bg-black text-[#b58aff]">
      <header className="h-20 border-b border-white/10 px-6 md:px-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-white">MALIKA-NASHMI OS</h1>
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/40">Managed by Master Said | Judy.777</p>
        </div>
        <div className="rounded-full border border-[#7a40ff]/50 bg-[#12091f] px-3 py-2 text-xs tracking-widest uppercase text-[#c78dff]">
          JUDY · Unified
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-[1fr_360px] min-h-[calc(100vh-80px)]">
        <section className="relative p-8 md:p-12 flex flex-col items-center justify-center gap-8">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(181,138,255,0.12),transparent_55%)]" />

          <div
            className="relative rounded-full border border-[#ff3b3b]/30 bg-[radial-gradient(circle,rgba(255,71,87,0.85),rgba(255,30,30,0.25)_55%,transparent_75%)] shadow-[0_0_80px_rgba(255,45,45,0.6)] transition-all duration-200"
            style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-4 h-4 rounded-full ${status === 'LIVE' ? 'bg-[#39ff14]' : status === 'CONNECTING' ? 'bg-[#ffe08a]' : 'bg-black/40'}`} />
            </div>
          </div>

          <button
            onClick={startSeven}
            disabled={status !== 'IDLE'}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-[#a343ff] bg-black/60 py-6 text-center text-lg md:text-2xl font-semibold tracking-[0.35em] uppercase text-[#b54dff] transition hover:bg-[#180d2a] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Initialize Sovereign Link
          </button>

          <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.2em]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/70">System: {status}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/70">Voice: {isAiSpeaking ? 'Responding' : 'Listening'}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-white/70">Signal: {Math.round(volume)}</div>
          </div>
        </section>

        <aside className="border-l border-white/10 p-8">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/50 mb-6">Security Logs</h2>
          <div className="space-y-3 text-xs text-white/50">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">Node: ALARAB_CORE_777</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">Persona: JUDY (Unified)</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">Auth: MASTER_AUTHORIZED</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">Mode: AUDIO_REALTIME</div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
