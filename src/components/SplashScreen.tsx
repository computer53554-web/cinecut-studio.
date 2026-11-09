import React, { useEffect, useState } from 'react';
import { Film, Sparkles, Zap, Play } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing CineCut studio engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Progress increment simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 18) + 12;
        if (next > 35 && next < 70) {
          setStatusText('Loading neural video effects & smart cutout...');
        } else if (next >= 70 && next < 95) {
          setStatusText('Preloading Web Audio synth & stock media...');
        } else if (next >= 95) {
          setStatusText('Studio Ready');
        }
        return Math.min(next, 100);
      });
    }, 130);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const exitTimer = setTimeout(() => {
          onFinish();
        }, 350);
        return () => clearTimeout(exitTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [progress, onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onFinish, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#05070c] text-white select-none transition-all duration-350 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top micro badge */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-4">
        <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          CineCut Engine 2.5
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Center Cinematic Brand Logo */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <div className="relative mb-6 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-2xl shadow-sky-500/30">
            <div className="w-full h-full bg-[#0a0d15] rounded-[15px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent" />
              <Film className="w-12 h-12 sm:w-14 sm:h-14 text-sky-400 drop-shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 flex items-center justify-center shadow-md">
                <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>CineCut</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
            Studio
          </span>
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium max-w-xs">
          Mobile-First AI Video & Motion Editor
        </p>

        {/* Highlight features pill */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300">
            <Sparkles className="w-3 h-3 text-sky-400" /> AI Captions
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
            <Zap className="w-3 h-3 text-indigo-400" /> Smart Cutout
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300">
            4K / 60 FPS Export
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar & Loading Status */}
      <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-2.5 z-10 pb-6">
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="truncate max-w-[200px]">{statusText}</span>
          <span className="text-sky-400 font-semibold">{progress}%</span>
        </div>

        {/* Glowing Progress Track */}
        <div className="w-full h-1.5 bg-[#141923] rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400 rounded-full transition-all duration-150 shadow-sm shadow-sky-400/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-500 mt-1">Tap anywhere to start editing</p>
      </div>
    </div>
  );
};
