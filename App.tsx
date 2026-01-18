
import React, { useState, useEffect, useRef } from 'react';
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

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 flex flex-col items-center">
        <div className="text-[10px] tracking-[1.2em] text-[#e2b714] opacity-80 uppercase mb-2">AlArab_Club_777</div>
        <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#e2b714]/50 to-transparent"></div>
      </div>
      
      {/* Interaction Core - Pyramids */}
      <div className="flex gap-12 items-end h-64 z-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} onClick={startSeven} className="cursor-pointer group relative">
            {/* Status Indicator Orb */}
            <div className={`w-1.5 h-1.5 rounded-full mb-12 mx-auto transition-all duration-700 ${
              status === 'LIVE' ? (isAiSpeaking ? 'bg-[#39ff14] shadow-[0_0_15px_#39ff14]' : 'bg-[#e2b714] animate-pulse') : 'bg-white/10'
            }`} />
            
            {/* Pyramid Steps */}
            <div className="flex flex-col-reverse gap-1.5">
              {[...Array(7)].map((_, j) => (
                <div 
                  key={j} 
                  className="bg-[#e2b714] transition-all duration-300 rounded-sm"
                  style={{ 
                    width: `${24 + (j*22)}px`, 
                    height: '2.5px', 
                    opacity: status === 'IDLE' ? 0.05 : 1 - (j*0.12),
                    boxShadow: status === 'LIVE' ? `0 0 ${volume/5}px rgba(226,183,20,0.6)` : 'none',
                    transform: `scaleX(${1 + (status === 'LIVE' ? volume/60 : 0)})`
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Control Info */}
      <div className="mt-24 flex flex-col items-center gap-4">
        <div className="text-[9px] text-[#e2b714]/40 tracking-[0.8em] uppercase">
          {status === 'IDLE' ? 'Protocol: Click Pyramids to Invoke' : `System: ${status}`}
        </div>
        {status === 'LIVE' && (
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 bg-[#39ff14] rounded-full animate-ping"></div>
             <span className="text-[8px] text-[#39ff14] tracking-widest uppercase">Direct_Link_Established</span>
          </div>
        )}
      </div>

      {/* Corner Data */}
      <div className="absolute bottom-10 right-10 text-[8px] text-[#e2b714]/20 text-right uppercase tracking-widest">
        Node: AlArab_Core_777<br/>
        Auth: Master_Authorized
      </div>
    </div>
  );
};

export default App;
