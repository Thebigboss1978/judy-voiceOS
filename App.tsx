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

  const ringScale = 1 + (status === 'LIVE' ? volume / 280 : 0);

  return (
    <div className="h-screen w-full bg-[#020305] text-[#e2b714] flex items-center justify-center p-6">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#e2b714]/20 bg-black/70 shadow-[0_0_60px_rgba(226,183,20,0.08)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,rgba(226,183,20,0.10),transparent_45%)]" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] tracking-[0.8em] uppercase text-[#e2b714]/60">AlArab Club 777</p>
            <h1 className="text-2xl md:text-4xl font-bold tracking-wider">SEVEN • Unified Persona</h1>
            <p className="text-sm text-[#e2b714]/70">شخصية واحدة فعّالة بدل ٣ شخصيات</p>
          </div>

          <button
            onClick={startSeven}
            className="group relative w-72 h-72 md:w-80 md:h-80 rounded-full border border-[#e2b714]/40 flex items-center justify-center disabled:cursor-not-allowed"
            disabled={status !== 'IDLE'}
          >
            <div
              className="absolute inset-6 rounded-full border border-[#e2b714]/30 transition-transform duration-200"
              style={{ transform: `scale(${ringScale})` }}
            />
            <div className={`absolute inset-0 rounded-full blur-2xl transition-opacity ${status === 'LIVE' ? 'opacity-90' : 'opacity-30'}`} style={{ background: 'radial-gradient(circle, rgba(226,183,20,0.28), transparent 65%)' }} />
            <div className="relative text-center px-6">
              <div className={`mx-auto mb-4 w-3 h-3 rounded-full ${status === 'LIVE' ? (isAiSpeaking ? 'bg-[#39ff14] shadow-[0_0_18px_#39ff14]' : 'bg-[#e2b714] animate-pulse') : status === 'CONNECTING' ? 'bg-[#f5d76e] animate-pulse' : 'bg-white/20'}`} />
              <div className="text-lg md:text-xl font-semibold tracking-[0.2em] uppercase">Seven</div>
              <div className="text-xs mt-2 tracking-[0.35em] uppercase text-[#e2b714]/60">Tap to invoke</div>
            </div>
          </button>

          <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs uppercase tracking-widest text-center">
            <div className="rounded-xl border border-[#e2b714]/20 p-4 bg-[#0a0a0a]/70">State: {status}</div>
            <div className="rounded-xl border border-[#e2b714]/20 p-4 bg-[#0a0a0a]/70">Voice: {isAiSpeaking ? 'Responding' : 'Listening'}</div>
            <div className="rounded-xl border border-[#e2b714]/20 p-4 bg-[#0a0a0a]/70">Signal: {Math.round(volume)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
