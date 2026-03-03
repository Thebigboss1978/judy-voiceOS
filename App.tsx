import React, { useEffect, useRef, useState } from 'react';
import { agentService, decode, decodeAudioData, encode } from './services/geminiService';

const STICK_COUNT = 6;

const App: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE'>('IDLE');
  const [volume, setVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const stopAllSources = () => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // ignore stop race conditions
      }
    }
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  };

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

          if (msg.serverContent?.interrupted) {
            stopAllSources();
            return;
          }

          if (audio && outputAudioCtxRef.current) {
            const buf = await decodeAudioData(decode(audio), outputAudioCtxRef.current, 24000, 1);
            const source = outputAudioCtxRef.current.createBufferSource();
            source.buffer = buf;
            source.connect(analyserRef.current!);
            source.connect(outputAudioCtxRef.current.destination);
            activeSourcesRef.current.add(source);

            const start = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + buf.duration;

            setIsAiSpeaking(true);
            source.onended = () => {
              activeSourcesRef.current.delete(source);
              if (activeSourcesRef.current.size === 0) {
                setIsAiSpeaking(false);
              }
            };
          }
        },
        onerror: (e: any) => {
          console.error(e);
          stopAllSources();
          setStatus('IDLE');
        },
        onclose: () => {
          stopAllSources();
          setStatus('IDLE');
        },
      });

      sessionPromiseRef.current = sessionPromise;

      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      const source = inputCtx.createMediaStreamSource(stream);
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        const currentSessionPromise = sessionPromiseRef.current;
        if (!currentSessionPromise) return;

        const data = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;

        currentSessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        });
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
      stopAllSources();
      setStatus('IDLE');
    }
  };

  const motion = status === 'LIVE' ? volume / 255 : 0.12;
  const glow = 0.3 + motion * 0.8;

  return (
    <div
      onClick={startSeven}
      className="h-screen w-full bg-[#020611] flex items-center justify-center cursor-pointer select-none"
      style={{
        background: `radial-gradient(circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(25,35,75,0.25), #020611 52%)`,
      }}
    >
      <div className="relative flex items-center gap-5 md:gap-6">
        {Array.from({ length: STICK_COUNT }).map((_, i) => {
          const center = (STICK_COUNT - 1) / 2;
          const dist = Math.abs(i - center);
          const tilt = (i - center) * 0.11 + (mouse.x - 0.5) * 0.6;
          const scaleY = 1 + motion * (1.2 - dist * 0.18) + (0.5 - mouse.y) * 0.35;
          const active = i === 3;

          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: active ? '10px' : '8px',
                height: active ? '80px' : '72px',
                background: active ? '#d1a521' : '#f5f1df',
                boxShadow: active
                  ? `0 0 ${28 + volume / 4}px rgba(209,165,33,${glow})`
                  : `0 0 ${18 + volume / 6}px rgba(245,241,223,${0.2 + glow * 0.5})`,
                transform: `rotate(${tilt}rad) scaleY(${Math.max(0.7, scaleY)})`,
                opacity: 0.75 + motion * 0.2,
                transition: 'transform 80ms linear, box-shadow 120ms linear, opacity 120ms linear',
              }}
            />
          );
        })}

        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 8 + motion * 14,
            height: 8 + motion * 14,
            background: isAiSpeaking ? '#39ff14' : '#f5f1df',
            boxShadow: isAiSpeaking
              ? `0 0 ${24 + volume / 3}px rgba(57,255,20,0.8)`
              : `0 0 ${16 + volume / 5}px rgba(245,241,223,0.35)`,
            transition: 'all 90ms linear',
          }}
        />
      </div>
    </div>
  );
};

export default App;
