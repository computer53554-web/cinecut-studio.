import React from 'react';
import {
  Film,
  Camera,
  Download,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Keyboard,
  Maximize2,
  Sparkles,
  Home,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { AspectRatio, ProjectSettings } from '../types/editor';

interface TopBarProps {
  projectSettings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  onOpenExport: () => void;
  onTakeSnapshot: () => void;
  onOpenShortcuts: () => void;
  onOpenAutoCaptions?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleFullscreen?: () => void;
  onNavigateHome?: () => void;
  layoutMode?: 'desktop' | 'mobile';
  onToggleLayoutMode?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectSettings,
  onUpdateSettings,
  onOpenExport,
  onTakeSnapshot,
  onOpenShortcuts,
  onOpenAutoCaptions,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onToggleFullscreen,
  onNavigateHome,
  layoutMode = 'desktop',
  onToggleLayoutMode,
}) => {
  const aspectRatios: { label: string; value: AspectRatio; desc: string }[] = [
    { label: '16:9', value: '16:9', desc: 'YouTube / Landscape' },
    { label: '9:16', value: '9:16', desc: 'TikTok / Shorts / Reels' },
    { label: '1:1', value: '1:1', desc: 'Instagram Square' },
    { label: '4:5', value: '4:5', desc: 'Social Portrait' },
  ];

  return (
    <header className="h-14 bg-[#0e121a] border-b border-[#1f2737] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            CineCut <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">PRO</span>
          </span>
        </div>

        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141923] hover:bg-[#1e2637] border border-[#222c3d] text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Go to Direct Upload / New Project"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Home / Upload</span>
          </button>
        )}

        <div className="h-4 w-px bg-[#263147] mx-1" />

        <input
          type="text"
          value={projectSettings.title}
          onChange={(e) => onUpdateSettings({ title: e.target.value })}
          className="bg-transparent hover:bg-[#161c27] focus:bg-[#161c27] px-2.5 py-1 rounded text-xs font-medium text-slate-200 border border-transparent focus:border-sky-500/50 outline-none w-36 sm:w-44 transition-colors truncate"
          placeholder="Project Title"
        />
      </div>

      {/* Zone 2: Editor Mode & Canvas Aspect Controls */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-[#141923] p-0.5 rounded-lg border border-[#222c3d]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1 bg-[#141923] p-1 rounded-lg border border-[#222c3d]">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onUpdateSettings({ aspectRatio: ratio.value })}
              title={ratio.desc}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                projectSettings.aspectRatio === ratio.value
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e2636]'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Snapping Toggle */}
        <button
          onClick={() => onUpdateSettings({ snap: !projectSettings.snap })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            projectSettings.snap
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-[#141923] text-slate-400 border-[#222c3d] hover:text-slate-300'
          }`}
          title="Toggle Timeline Magnetic Snapping (S)"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Snap: {projectSettings.snap ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Zone 3: Actions & Export Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="p-2 rounded-lg bg-[#141923] border border-[#222c3d] text-slate-400 hover:text-slate-100 hover:bg-[#1e2636] transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-lg bg-[#141923] border border-[#222c3d] text-slate-400 hover:text-slate-100 hover:bg-[#1e2636] transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {onOpenAutoCaptions && (
          <button
            onClick={onOpenAutoCaptions}
            title="Generate AI Auto-Captions (TikTok / Reels subtitles)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Captions</span>
          </button>
        )}

        {onToggleLayoutMode && (
          <button
            onClick={onToggleLayoutMode}
            title={layoutMode === 'mobile' ? 'Switch to Desktop Studio' : 'Switch to Mobile View'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141923] border border-[#222c3d] text-slate-300 hover:text-white hover:bg-[#1e2636] text-xs font-medium transition-colors"
          >
            {layoutMode === 'mobile' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden xl:inline">Studio</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden xl:inline">Mobile</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onTakeSnapshot}
          title="Download snapshot of current frame (PNG)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141923] border border-[#222c3d] text-slate-300 hover:text-white hover:bg-[#1e2636] text-xs font-medium transition-colors"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
