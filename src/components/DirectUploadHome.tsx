import React, { useRef, useState } from 'react';
import {
  Upload,
  Plus,
  Film,
  Sparkles,
  Music,
  Zap,
  Sliders,
  Play,
  ArrowRight,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { AspectRatio, ProjectSettings, Track } from '../types/editor';
import { DEFAULT_SAMPLE_MEDIA } from '../utils/assetsData';
import { audioEngine } from '../utils/audioEngine';

interface DirectUploadHomeProps {
  projectSettings: ProjectSettings;
  tracks: Track[];
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  onEnterStudio: () => void;
  onUploadFiles: (files: FileList) => void;
  onLoadTemplate: (templateKey: 'neon' | 'lofi' | 'vlog' | 'blank') => void;
  onOpenAutoCaptions: () => void;
  onOpenStockMusic: () => void;
}

export const DirectUploadHome: React.FC<DirectUploadHomeProps> = ({
  projectSettings,
  tracks,
  onUpdateSettings,
  onEnterStudio,
  onUploadFiles,
  onLoadTemplate,
  onOpenAutoCaptions,
  onOpenStockMusic,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>(projectSettings.aspectRatio || '9:16');

  // Count total clips in project
  const totalClips = tracks.reduce((acc, t) => acc + t.clips.length, 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
  };

  const handleAspectChange = (aspect: AspectRatio) => {
    setSelectedAspect(aspect);
    onUpdateSettings({ aspectRatio: aspect });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a0f] text-slate-100 select-none overflow-y-auto">
      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-8 border-b border-[#1b2333] bg-[#0b0e16]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">CineCut</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Mobile-First Video & Photo Editor</p>
          </div>
        </div>

        {/* Right Header Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {totalClips > 0 && (
            <button
              onClick={onEnterStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141923] hover:bg-[#1c2333] border border-[#222c3d] text-xs font-medium text-sky-300 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Resume Project ({totalClips} clips)</span>
            </button>
          )}

          <button
            onClick={onEnterStudio}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/25 transition-transform active:scale-95"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6 sm:gap-8">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Aspect Ratio Selector Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0d121c] border border-[#1c2436]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200">Canvas Aspect Ratio:</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: '9:16' as AspectRatio, label: '9:16', desc: 'TikTok / Reels' },
              { id: '16:9' as AspectRatio, label: '16:9', desc: 'YouTube / Web' },
              { id: '1:1' as AspectRatio, label: '1:1', desc: 'Square Post' },
              { id: '4:5' as AspectRatio, label: '4:5', desc: 'Portrait' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => handleAspectChange(ratio.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedAspect === ratio.id
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                    : 'bg-[#141a26] text-slate-400 hover:text-slate-200 hover:bg-[#1a2232]'
                }`}
                title={ratio.desc}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero: Direct Upload Card (CapCut Mobile New Project Style) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 overflow-hidden ${
            isDragging
              ? 'border-sky-400 bg-sky-950/30 scale-[1.01]'
              : 'border-[#232d42] hover:border-sky-500/60 bg-gradient-to-b from-[#0f1522] to-[#090d15] hover:shadow-2xl hover:shadow-sky-500/10'
          }`}
        >
          {/* Ambient center radial glow */}
          <div className="absolute inset-0 bg-radial from-sky-500/5 to-transparent pointer-events-none" />

          {/* Plus icon circle */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/30 group-hover:scale-105 transition-transform duration-300">
            <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[2.5]" />
          </div>

          <div className="flex flex-col items-center gap-1 z-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
              New Project · Upload Media
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
              Tap or drag & drop videos, photos, or music to start editing immediately
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 z-10 pt-2">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#151c2a] border border-[#232c3f]">
              <Film className="w-3 h-3 text-sky-400" /> MP4 / MOV / WebM
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#151c2a] border border-[#232c3f]">
              <ImageIcon className="w-3 h-3 text-emerald-400" /> JPG / PNG / WebP
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#151c2a] border border-[#232c3f]">
              <Music className="w-3 h-3 text-purple-400" /> MP3 / WAV
            </span>
          </div>

          <button
            type="button"
            className="mt-2 px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-colors z-10"
          >
            Select from Device
          </button>
        </div>

        {/* Quick Tools Row (CapCut Feature Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={onOpenAutoCaptions}
            className="p-4 rounded-2xl bg-[#0d121c] border border-[#1d2638] hover:border-amber-500/40 hover:bg-[#121926] cursor-pointer transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">AI Auto-Captions</span>
            <span className="text-[10px] text-slate-400">Colorful speech subtitles</span>
          </div>

          <div
            onClick={onOpenStockMusic}
            className="p-4 rounded-2xl bg-[#0d121c] border border-[#1d2638] hover:border-emerald-500/40 hover:bg-[#121926] cursor-pointer transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Stock Music & SFX</span>
            <span className="text-[10px] text-slate-400">Royalty-free soundtracks</span>
          </div>

          <div
            onClick={() => onLoadTemplate('neon')}
            className="p-4 rounded-2xl bg-[#0d121c] border border-[#1d2638] hover:border-sky-500/40 hover:bg-[#121926] cursor-pointer transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Neon Reel Template</span>
            <span className="text-[10px] text-slate-400">Speed ramping & LUT</span>
          </div>

          <div
            onClick={() => onLoadTemplate('blank')}
            className="p-4 rounded-2xl bg-[#0d121c] border border-[#1d2638] hover:border-purple-500/40 hover:bg-[#121926] cursor-pointer transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Blank Project</span>
            <span className="text-[10px] text-slate-400">Empty multi-track stage</span>
          </div>
        </div>

        {/* Instant Starter Templates */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Quick-Start Production Templates</span>
            </h3>
            <span className="text-[11px] text-slate-400">1-click to load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Template 1: Cyberpunk Neon */}
            <div
              onClick={() => onLoadTemplate('neon')}
              className="group relative rounded-2xl overflow-hidden border border-[#20293d] bg-[#0c1017] hover:border-sky-400/60 cursor-pointer transition-all shadow-md"
            >
              <div className="h-32 bg-slate-900 relative overflow-hidden">
                <img
                  src={DEFAULT_SAMPLE_MEDIA[0]?.url}
                  alt="Neon Night"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-black/30" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-sky-500/80 text-white font-mono text-[9px] font-bold">
                  9:16 REEL
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  Cyberpunk Neon City
                </span>
                <span className="text-[11px] text-slate-400">
                  Speed ramp, neon glow cutout, & synth beats
                </span>
              </div>
            </div>

            {/* Template 2: Lofi Chill Mountain */}
            <div
              onClick={() => onLoadTemplate('lofi')}
              className="group relative rounded-2xl overflow-hidden border border-[#20293d] bg-[#0c1017] hover:border-emerald-400/60 cursor-pointer transition-all shadow-md"
            >
              <div className="h-32 bg-slate-900 relative overflow-hidden">
                <img
                  src={DEFAULT_SAMPLE_MEDIA[1]?.url}
                  alt="Nature Lake"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-black/30" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/80 text-white font-mono text-[9px] font-bold">
                  16:9 CINEMA
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Alpine Sunset Lofi
                </span>
                <span className="text-[11px] text-slate-400">
                  Warm film LUT, ambient audio, and slow zoom
                </span>
              </div>
            </div>

            {/* Template 3: Vintage Film Portrait */}
            <div
              onClick={() => onLoadTemplate('vlog')}
              className="group relative rounded-2xl overflow-hidden border border-[#20293d] bg-[#0c1017] hover:border-purple-400/60 cursor-pointer transition-all shadow-md"
            >
              <div className="h-32 bg-slate-900 relative overflow-hidden">
                <img
                  src={DEFAULT_SAMPLE_MEDIA[2]?.url}
                  alt="Retro Film"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-transparent to-black/30" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-purple-500/80 text-white font-mono text-[9px] font-bold">
                  9:16 STORY
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Retro Film Vlog
                </span>
                <span className="text-[11px] text-slate-400">
                  Sepia tone, animated subtitle captions, & grain
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
