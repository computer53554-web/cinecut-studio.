import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
  Copy,
  Download,
  ArrowLeft,
  Sparkles,
  Sliders,
  Type,
  Music,
  Zap,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  Volume2,
  VolumeX,
  Gauge,
  Layers,
  Wand2,
  Smile,
  Diamond,
  RefreshCw,
} from 'lucide-react';
import { AspectRatio, Clip, FilterPreset, Keyframe, ProjectSettings, Track, TransitionType } from '../types/editor';
import { canvasRenderer } from '../utils/canvasRenderer';
import { audioEngine } from '../utils/audioEngine';
import { FILTER_PRESETS } from '../utils/assetsData';
import { STOCK_MUSIC } from '../utils/stockMediaData';

interface MobileEditorViewProps {
  tracks: Track[];
  projectSettings: ProjectSettings;
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedClipIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onStepFrame: (direction: number) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSelectClip: (clipId: string | null, isMultiSelect?: boolean) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onSplitClipAtPlayhead: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenAutoCaptions: () => void;
  onOpenReplaceClip?: () => void;
  onNavigateHome: () => void;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
}

type MobileToolTab = 'none' | 'edit' | 'keyframes' | 'audio' | 'text' | 'filters' | 'cutout';

export const MobileEditorView: React.FC<MobileEditorViewProps> = ({
  tracks,
  projectSettings,
  currentTime,
  isPlaying,
  selectedClipId,
  selectedClipIds,
  canUndo,
  canRedo,
  onSeek,
  onTogglePlay,
  onStepFrame,
  onJumpStart,
  onJumpEnd,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClipAtPlayhead,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenAutoCaptions,
  onOpenReplaceClip,
  onNavigateHome,
  onUpdateSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<MobileToolTab>('none');
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  // Get active selected clip object
  let selectedClip: Clip | null = null;
  if (selectedClipId) {
    for (const t of tracks) {
      const found = t.clips.find((c) => c.id === selectedClipId);
      if (found) {
        selectedClip = found;
        break;
      }
    }
  }

  // Keyframe calculations & handlers for active clip
  const timeInClip = selectedClip
    ? Math.max(0, Math.min(selectedClip.duration, currentTime - selectedClip.start))
    : 0;
  const keyframes = selectedClip?.keyframes || [];
  const activeKeyframeIndex = selectedClip
    ? keyframes.findIndex((kf) => Math.abs(kf.time - timeInClip) < 0.12)
    : -1;
  const hasKeyframeAtCurrent = activeKeyframeIndex !== -1;

  const handleToggleKeyframe = () => {
    if (!selectedClip) return;
    let updatedKfs: Keyframe[];
    if (hasKeyframeAtCurrent) {
      updatedKfs = keyframes.filter((_, idx) => idx !== activeKeyframeIndex);
    } else {
      const newKf: Keyframe = {
        id: `kf-${Date.now()}`,
        time: Math.round(timeInClip * 100) / 100,
        x: selectedClip.transform.x,
        y: selectedClip.transform.y,
        scale: selectedClip.transform.scale,
        rotation: selectedClip.transform.rotation,
        opacity: selectedClip.transform.opacity,
      };
      updatedKfs = [...keyframes, newKf].sort((a, b) => a.time - b.time);
    }
    onUpdateClip(selectedClip.id, { keyframes: updatedKfs });
  };

  const handleJumpPrevKeyframe = () => {
    if (!selectedClip || keyframes.length === 0) return;
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    const prev = sorted.reverse().find((kf) => kf.time < timeInClip - 0.08);
    if (prev) {
      onSeek(selectedClip.start + prev.time);
    }
  };

  const handleJumpNextKeyframe = () => {
    if (!selectedClip || keyframes.length === 0) return;
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    const next = sorted.find((kf) => kf.time > timeInClip + 0.08);
    if (next) {
      onSeek(selectedClip.start + next.time);
    }
  };

  // Render canvas frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasRenderer.getResolution(projectSettings.aspectRatio, '1080p');
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    canvasRenderer.render(ctx, {
      currentTime,
      tracks,
      aspectRatio: projectSettings.aspectRatio,
      width,
      height,
      selectedClipId,
    });
  }, [tracks, projectSettings, currentTime, selectedClipId]);

  // Format seconds to mm:ss.ff
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis
      .toString()
      .padStart(2, '0')}`;
  };

  const totalDuration = projectSettings.duration || 60;
  // Pixels per second for mobile timeline
  const pps = 40;
  const contentWidth = Math.max(300, totalDuration * pps);

  // Aspect ratios
  const aspectRatios: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a0f] text-slate-100 select-none overflow-hidden relative">
      {/* 1. Mobile Top Navigation Bar */}
      <header className="h-14 px-3 bg-[#0d121c] border-b border-[#1b2333] flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-[#141924] hover:bg-[#1f2838] border border-[#222c3d] text-slate-300 hover:text-white transition-colors"
            title="Back to Home / Upload"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
          </button>

          {/* Project Title */}
          <input
            type="text"
            value={projectSettings.title}
            onChange={(e) => onUpdateSettings({ title: e.target.value })}
            className="bg-transparent px-2 py-1 text-xs font-bold text-white outline-none w-28 sm:w-40 truncate"
          />
        </div>

        {/* Center: Aspect Ratio & Undo/Redo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAspectMenu(!showAspectMenu)}
            className="px-2.5 py-1 rounded-lg bg-[#141924] border border-[#222c3d] text-[11px] font-mono text-sky-300 hover:bg-[#1a2232] transition-colors"
          >
            {projectSettings.aspectRatio}
          </button>

          <div className="flex items-center gap-0.5 bg-[#141924] p-0.5 rounded-lg border border-[#222c3d]">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-transform"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </header>

      {/* Aspect Ratio Dropdown Menu */}
      {showAspectMenu && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-[#0f1522] border border-[#243147] rounded-xl p-1.5 shadow-2xl flex gap-1 animate-in fade-in zoom-in-95">
          {aspectRatios.map((aspect) => (
            <button
              key={aspect}
              onClick={() => {
                onUpdateSettings({ aspectRatio: aspect });
                setShowAspectMenu(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                projectSettings.aspectRatio === aspect
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#192233]'
              }`}
            >
              {aspect}
            </button>
          ))}
        </div>
      )}

      {/* 2. Video Preview Monitor (Center Stage) */}
      <div className="flex-1 min-h-[220px] max-h-[50vh] bg-[#05070c] relative flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center relative select-none"
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10 object-contain"
          />

          {/* Quick Play/Pause Center Tap Area */}
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent group"
          >
            {!isPlaying && (
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
            )}
          </button>
        </div>

        {/* Compact Playback Bar Overlay */}
        <div className="w-full max-w-sm flex items-center justify-between px-2 py-1 text-xs text-slate-300 mt-1 shrink-0">
          <span className="font-mono text-[11px] text-sky-400 tabular-nums font-semibold">
            {formatTimecode(currentTime)}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStepFrame(-1)}
              className="p-1 text-slate-400 hover:text-white"
              title="Previous Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-md shadow-sky-500/30 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
            </button>

            <button
              onClick={() => onStepFrame(1)}
              className="p-1 text-slate-400 hover:text-white"
              title="Next Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
            {formatTimecode(totalDuration)}
          </span>
        </div>
      </div>

      {/* 3. Mobile Compact Timeline */}
      <div className="h-32 bg-[#0a0e16] border-t border-b border-[#1b2333] flex flex-col shrink-0 select-none relative">
        {/* Quick Timeline Action Bar: Split, Delete, Duplicate */}
        <div className="h-8 px-3 bg-[#0d121c] border-b border-[#171f2d] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSplitClipAtPlayhead}
              disabled={!selectedClip}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#161c27] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 disabled:opacity-30 border border-[#222c3d] text-[11px]"
              title="Split Clip (Ctrl+B)"
            >
              <Scissors className="w-3 h-3 text-sky-400" />
              <span>Split</span>
            </button>

            <button
              onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
              disabled={!selectedClip}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#161c27] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 disabled:opacity-30 border border-[#222c3d] text-[11px]"
              title="Delete Clip"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
              disabled={!selectedClip}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#161c27] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 disabled:opacity-30 border border-[#222c3d] text-[11px]"
              title="Duplicate Clip"
            >
              <Copy className="w-3 h-3 text-indigo-400" />
              <span>Copy</span>
            </button>

            {onOpenReplaceClip && selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image') && (
              <button
                onClick={onOpenReplaceClip}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#161c27] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-[#222c3d] text-[11px]"
                title="Replace Media Clip"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                <span>Replace</span>
              </button>
            )}
          </div>

          {selectedClip && (
            <span className="text-[10px] text-sky-300 font-mono truncate max-w-[120px]">
              {selectedClip.name}
            </span>
          )}
        </div>

        {/* Scrollable Track Ribbon */}
        <div
          ref={timelineScrollRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft;
            const newTime = Math.max(0, Math.min(totalDuration, clickX / pps));
            onSeek(newTime);
          }}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#070a0f] cursor-pointer"
        >
          <div style={{ width: contentWidth }} className="h-full relative py-1.5 flex flex-col justify-around">
            {tracks.map((track) => (
              <div key={track.id} className="h-6 relative">
                {track.clips.map((clip) => {
                  const left = clip.start * pps;
                  const width = Math.max(18, clip.duration * pps);
                  const isSelected = selectedClipId === clip.id;

                  let bg = 'bg-sky-600/80 border-sky-400/60 text-sky-100';
                  if (clip.type === 'audio') bg = 'bg-emerald-600/80 border-emerald-400/60 text-emerald-100';
                  if (clip.type === 'text') bg = 'bg-purple-600/80 border-purple-400/60 text-purple-100';
                  if (clip.type === 'sticker') bg = 'bg-amber-600/80 border-amber-400/60 text-amber-100';

                  return (
                    <div
                      key={clip.id}
                      style={{ left, width }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id, false);
                      }}
                      className={`absolute top-0 bottom-0 rounded-md border text-[10px] font-medium px-1.5 flex items-center truncate ${bg} ${
                        isSelected ? 'ring-2 ring-white shadow-lg shadow-sky-500/30 brightness-110 z-10' : ''
                      }`}
                    >
                      <span className="truncate">{clip.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Glowing Red Playhead Line */}
            <div
              style={{ left: currentTime * pps }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-20"
            >
              <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -ml-1 -mt-1 shadow-md shadow-rose-500/50" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Slide-Up Mobile Tool Drawer */}
      {activeTool !== 'none' && (
        <div className="absolute inset-x-0 bottom-16 bg-[#0e131d] border-t border-[#222d42] rounded-t-3xl shadow-2xl p-4 z-40 max-h-[48vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#1d273a] mb-3">
            <span className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
              {activeTool === 'edit' && <Sliders className="w-4 h-4 text-sky-400" />}
              {activeTool === 'audio' && <Music className="w-4 h-4 text-emerald-400" />}
              {activeTool === 'text' && <Type className="w-4 h-4 text-purple-400" />}
              {activeTool === 'filters' && <Zap className="w-4 h-4 text-amber-400" />}
              {activeTool === 'cutout' && <Wand2 className="w-4 h-4 text-sky-400" />}
              {activeTool === 'keyframes' && <Layers className="w-4 h-4 text-indigo-400" />}
              <span>{activeTool} Tools</span>
            </span>
            <button
              onClick={() => setActiveTool('none')}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5"
            >
              <Check className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Drawer content depending on tool tab */}
          {activeTool === 'edit' && selectedClip && (
            <div className="flex flex-col gap-4 text-xs">
              {/* Speed slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Playback Speed:</span>
                  <span className="text-sky-400 font-mono">{selectedClip.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={selectedClip.speed}
                  onChange={(e) => onUpdateClip(selectedClip!.id, { speed: Number(e.target.value) })}
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Volume slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Volume:</span>
                  <span className="text-emerald-400 font-mono">
                    {Math.round(selectedClip.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.05"
                  value={selectedClip.volume}
                  onChange={(e) => onUpdateClip(selectedClip!.id, { volume: Number(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </div>

              {/* Opacity slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Opacity:</span>
                  <span className="text-sky-400 font-mono">
                    {Math.round(selectedClip.transform.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={selectedClip.transform.opacity}
                  onChange={(e) =>
                    onUpdateClip(selectedClip!.id, {
                      transform: { ...selectedClip!.transform, opacity: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-sky-400"
                />
              {/* Replace Media Clip */}
              {onOpenReplaceClip && (selectedClip.type === 'video' || selectedClip.type === 'image') && (
                <button
                  onClick={onOpenReplaceClip}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Media Clip (Preserve timing)</span>
                </button>
              )}
            </div>
          )}

          {activeTool === 'keyframes' && selectedClip && (
            <div className="flex flex-col gap-3.5 text-xs">
              {/* Keyframe Header Bar with Add/Del and Prev/Next */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30">
                <div className="flex items-center gap-1.5">
                  <Diamond className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="font-bold text-sky-300 block text-xs">Keyframe at Playhead</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Offset: {timeInClip.toFixed(2)}s · {keyframes.length} set
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleJumpPrevKeyframe}
                    disabled={keyframes.length === 0}
                    className="p-1.5 rounded-lg bg-[#141924] border border-[#222c3d] text-slate-300 disabled:opacity-30"
                    title="Previous Keyframe"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleToggleKeyframe}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      hasKeyframeAtCurrent
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    }`}
                  >
                    <Diamond className={`w-3 h-3 ${hasKeyframeAtCurrent ? 'fill-white' : ''}`} />
                    <span>{hasKeyframeAtCurrent ? 'Remove' : '+ Add'}</span>
                  </button>

                  <button
                    onClick={handleJumpNextKeyframe}
                    disabled={keyframes.length === 0}
                    className="p-1.5 rounded-lg bg-[#141924] border border-[#222c3d] text-slate-300 disabled:opacity-30"
                    title="Next Keyframe"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Keyframe List Chips */}
              {keyframes.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {keyframes.map((kf, i) => (
                    <button
                      key={kf.id || i}
                      onClick={() => onSeek(selectedClip.start + kf.time)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 shrink-0 ${
                        Math.abs(kf.time - timeInClip) < 0.12
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-[#151c28] border border-[#222d40] text-slate-300'
                      }`}
                    >
                      <Diamond className="w-2.5 h-2.5 fill-current" />
                      <span>{kf.time.toFixed(2)}s</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Position X & Y */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Position X:</span>
                    <span className="text-sky-400 font-mono">{selectedClip.transform.x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={selectedClip.transform.x}
                    onChange={(e) =>
                      onUpdateClip(selectedClip!.id, {
                        transform: { ...selectedClip!.transform, x: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Position Y:</span>
                    <span className="text-sky-400 font-mono">{selectedClip.transform.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    value={selectedClip.transform.y}
                    onChange={(e) =>
                      onUpdateClip(selectedClip!.id, {
                        transform: { ...selectedClip!.transform, y: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>

              {/* Scale & Rotation */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Scale:</span>
                    <span className="text-sky-400 font-mono">{Math.round(selectedClip.transform.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={selectedClip.transform.scale}
                    onChange={(e) =>
                      onUpdateClip(selectedClip!.id, {
                        transform: { ...selectedClip!.transform, scale: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Rotation:</span>
                    <span className="text-sky-400 font-mono">{selectedClip.transform.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={selectedClip.transform.rotation}
                    onChange={(e) =>
                      onUpdateClip(selectedClip!.id, {
                        transform: { ...selectedClip!.transform, rotation: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTool === 'filters' && selectedClip && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400">Cinematic Filter Presets:</span>
              <div className="grid grid-cols-3 gap-2">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      onUpdateClip(selectedClip!.id, {
                        filters: {
                          brightness: preset.brightness,
                          contrast: preset.contrast,
                          saturation: preset.saturation,
                          temperature: preset.temperature,
                          vignette: preset.vignette,
                          sepia: preset.sepia,
                          blur: preset.blur,
                          preset: preset.id,
                        },
                      })
                    }
                    className="p-2.5 rounded-xl bg-[#141a26] hover:bg-sky-500/20 border border-[#222c3d] text-xs font-semibold text-slate-200 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'cutout' && selectedClip && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400">AI Background Removal & Cutout:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'None (Normal)' },
                  { id: 'ai_subject', label: 'AI Subject Cutout' },
                  { id: 'chroma', label: 'Chroma Key (Green/Blue)' },
                  { id: 'luma', label: 'Luma Key (Black/White)' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      onUpdateClip(selectedClip!.id, {
                        smartCutout: {
                          enabled: mode.id !== 'none',
                          mode: mode.id as any,
                          keyColor: '#00FF00',
                          tolerance: 40,
                          softness: 20,
                          feather: 2,
                          strokeOutline: mode.id === 'ai_subject',
                          strokeColor: '#38bdf8',
                          strokeWidth: 4,
                        },
                      })
                    }
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedClip?.smartCutout?.mode === mode.id || (!selectedClip?.smartCutout?.enabled && mode.id === 'none')
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-[#141a26] border-[#222c3d] text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'text' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={onOpenAutoCaptions}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Auto-Captions</span>
              </button>
            </div>
          )}

          {activeTool === 'audio' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400">Quick Stock Music:</span>
              <div className="flex flex-col gap-2">
                {STOCK_MUSIC.slice(0, 3).map((track) => (
                  <div
                    key={track.id}
                    className="p-2.5 rounded-xl bg-[#141a26] border border-[#222c3d] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{track.name}</div>
                      <div className="text-[10px] text-slate-400">{track.genre} · {track.bpm} BPM</div>
                    </div>
                    <button
                      onClick={() => {
                        const buf = audioEngine.createSynthTrack(track.genre as any, track.duration);
                        audioEngine.setBuffer(track.id, buf);
                        // Add to audio track
                        const audioTrack = tracks.find((t) => t.type === 'audio');
                        if (audioTrack && audioTrack.clips[0]) {
                          onUpdateClip(audioTrack.clips[0].id, { mediaAssetId: track.id, name: track.name });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Mobile Bottom Tool Dock (CapCut Style) */}
      <footer className="h-16 bg-[#0a0d15] border-t border-[#1b2333] px-2 flex items-center justify-around shrink-0 z-30">
        {[
          { id: 'edit' as MobileToolTab, label: 'Edit', icon: Sliders },
          { id: 'keyframes' as MobileToolTab, label: 'Keyframes', icon: Diamond },
          { id: 'text' as MobileToolTab, label: 'Captions', icon: Type },
          { id: 'audio' as MobileToolTab, label: 'Audio', icon: Music },
          { id: 'filters' as MobileToolTab, label: 'Filters', icon: Zap },
          { id: 'cutout' as MobileToolTab, label: 'Cutout', icon: Wand2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(isActive ? 'none' : tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-sky-400 bg-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
};
