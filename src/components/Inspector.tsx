import React from 'react';
import {
  Sliders,
  Type,
  Maximize2,
  Volume2,
  Sparkles,
  Zap,
  Gauge,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Clock,
  Trash2,
  Copy,
  Scissors,
  Diamond,
  ChevronLeft,
  ChevronRight,
  ScissorsLineDashed,
  Wand2,
} from 'lucide-react';
import { Clip, FilterPreset, Keyframe, SmartCutoutMode, TextAnimation, TransitionType } from '../types/editor';
import { FILTER_PRESETS } from '../utils/assetsData';

interface InspectorProps {
  selectedClip: Clip | null;
  currentTime?: number;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onSplitClipAtPlayhead?: () => void;
  onSeek?: (time: number) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedClip,
  currentTime,
  onSeek,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClipAtPlayhead,
}) => {
  if (!selectedClip) {
    return (
      <div className="w-80 bg-[#0d1118] border-l border-[#1a2230] p-4 flex flex-col h-full select-none text-slate-400">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1f283a] text-slate-200">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Inspector</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-[#141b27] border border-[#222d40] flex items-center justify-center text-slate-500 mb-3">
            <Sliders className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-300">No Clip Selected</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
            Click any clip on the timeline or preview monitor to adjust transforms, speed, audio, color grading, and text.
          </p>

          <div className="mt-6 w-full space-y-2 text-left bg-[#121722] p-3 rounded-lg border border-[#1b2333]">
            <p className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Tips
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              • <kbd className="px-1 py-0.5 rounded bg-black/50 text-slate-300">Ctrl+B</kbd> to split clip at playhead
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              • Drag clip edges on timeline to trim in/out
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              • Spacebar to play/pause preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Update nested transform
  const updateTransform = (key: keyof Clip['transform'], value: number | boolean) => {
    onUpdateClip(selectedClip.id, {
      transform: {
        ...selectedClip.transform,
        [key]: value,
      },
    });
  };

  // Update nested filters
  const updateFilter = (key: keyof Clip['filters'], value: number | FilterPreset) => {
    onUpdateClip(selectedClip.id, {
      filters: {
        ...selectedClip.filters,
        [key]: value,
      },
    });
  };

  // Apply filter preset
  const applyPreset = (presetId: FilterPreset) => {
    const found = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    onUpdateClip(selectedClip.id, {
      filters: {
        brightness: found.brightness,
        contrast: found.contrast,
        saturation: found.saturation,
        temperature: found.temperature,
        vignette: found.vignette,
        blur: found.blur,
        sepia: found.sepia,
        preset: presetId,
      },
    });
  };

  // Speed adjustment (recalculates duration)
  const changeSpeed = (newSpeed: number) => {
    if (newSpeed <= 0) return;
    const oldSpeed = selectedClip.speed || 1.0;
    const ratio = oldSpeed / newSpeed;
    const newDuration = Math.max(0.5, Math.round(selectedClip.duration * ratio * 100) / 100);
    onUpdateClip(selectedClip.id, {
      speed: newSpeed,
      duration: newDuration,
    });
  };

  // Time offset within the selected clip (0 to clip.duration)
  const timeInClip = Math.max(
    0,
    Math.min(selectedClip.duration, (currentTime ?? selectedClip.start) - selectedClip.start)
  );

  const keyframes = selectedClip.keyframes || [];
  // Check if a keyframe exists near current playhead time
  const activeKeyframeIndex = keyframes.findIndex(
    (kf) => Math.abs(kf.time - timeInClip) < 0.12
  );
  const hasKeyframeAtCurrent = activeKeyframeIndex !== -1;

  // Keyframe handlers
  const handleToggleKeyframe = () => {
    let updatedKfs: Keyframe[];
    if (hasKeyframeAtCurrent) {
      // Remove keyframe at current position
      updatedKfs = keyframes.filter((_, idx) => idx !== activeKeyframeIndex);
    } else {
      // Add or update keyframe at current time
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
    if (!onSeek || keyframes.length === 0) return;
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    const prev = sorted.reverse().find((kf) => kf.time < timeInClip - 0.08);
    if (prev) {
      onSeek(selectedClip.start + prev.time);
    }
  };

  const handleJumpNextKeyframe = () => {
    if (!onSeek || keyframes.length === 0) return;
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    const next = sorted.find((kf) => kf.time > timeInClip + 0.08);
    if (next) {
      onSeek(selectedClip.start + next.time);
    }
  };

  // Smart Cutout helper
  const updateSmartCutout = (updates: Partial<NonNullable<Clip['smartCutout']>>) => {
    const currentConfig = selectedClip.smartCutout || {
      enabled: false,
      mode: 'ai_subject',
      keyColor: '#00FF00',
      tolerance: 40,
      softness: 25,
      feather: 4,
      strokeOutline: false,
      strokeColor: '#38BDF8',
      strokeWidth: 4,
    };
    onUpdateClip(selectedClip.id, {
      smartCutout: {
        ...currentConfig,
        ...updates,
      },
    });
  };

  return (
    <div className="w-80 bg-[#0d1118] border-l border-[#1a2230] flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Header with Clip Name & Action Tools */}
      <div className="p-3 border-b border-[#1a2230] bg-[#090d13] flex items-center justify-between gap-2 sticky top-0 z-10">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate">{selectedClip.name}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
            <span className="capitalize text-sky-400 font-semibold">{selectedClip.type}</span>
            <span>·</span>
            <span>{selectedClip.duration.toFixed(2)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onSplitClipAtPlayhead && (
            <button
              onClick={onSplitClipAtPlayhead}
              title="Split at playhead (Ctrl+B)"
              className="p-1.5 rounded bg-[#161c27] hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDuplicateClip(selectedClip.id)}
            title="Duplicate Clip"
            className="p-1.5 rounded bg-[#161c27] hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteClip(selectedClip.id)}
            title="Delete Clip (Del)"
            className="p-1.5 rounded bg-[#161c27] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-5 text-xs">
        {/* ================= KEYFRAME ANIMATION TOOLBAR ================= */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/30 border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-sky-300 text-xs uppercase tracking-wide">
              <Diamond className="w-3.5 h-3.5 text-sky-400" />
              <span>Keyframes</span>
            </span>

            {/* Jump buttons & Add Keyframe */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleJumpPrevKeyframe}
                disabled={keyframes.length === 0}
                className="p-1 rounded bg-[#131924] hover:bg-[#1f283a] disabled:opacity-30 text-slate-300"
                title="Jump to Previous Keyframe"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleToggleKeyframe}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                  hasKeyframeAtCurrent
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-[#182030] hover:bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
                title={hasKeyframeAtCurrent ? 'Remove Keyframe at Playhead' : 'Add Keyframe at Playhead'}
              >
                <Diamond className={`w-3 h-3 ${hasKeyframeAtCurrent ? 'fill-white' : ''}`} />
                <span>{hasKeyframeAtCurrent ? 'Del KF' : '+ Add KF'}</span>
              </button>

              <button
                onClick={handleJumpNextKeyframe}
                disabled={keyframes.length === 0}
                className="p-1 rounded bg-[#131924] hover:bg-[#1f283a] disabled:opacity-30 text-slate-300"
                title="Jump to Next Keyframe"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Playhead offset: <b className="text-sky-300 font-mono">{timeInClip.toFixed(2)}s</b></span>
            <span>{keyframes.length} keyframes set</span>
          </div>

          {/* Keyframe chip list */}
          {keyframes.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pt-1">
              {keyframes.map((kf, i) => (
                <button
                  key={kf.id || i}
                  onClick={() => onSeek && onSeek(selectedClip.start + kf.time)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                    Math.abs(kf.time - timeInClip) < 0.12
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-[#141b27] text-slate-300 hover:bg-[#1e2636]'
                  }`}
                  title={`Jump to ${kf.time.toFixed(2)}s`}
                >
                  <Diamond className="w-2.5 h-2.5 fill-current" />
                  <span>{kf.time.toFixed(2)}s</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= TRANSFORM CONTROLS ================= */}
        <div className="space-y-3 pb-4 border-b border-[#1b2333]">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Transform</span>
            </span>
            <button
              onClick={() =>
                onUpdateClip(selectedClip.id, {
                  transform: {
                    x: 0,
                    y: 0,
                    scale: 1.0,
                    rotation: 0,
                    opacity: 1.0,
                    flipH: false,
                    flipV: false,
                  },
                })
              }
              title="Reset Transform"
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Scale */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Scale</span>
              <span className="font-mono">{Math.round(selectedClip.transform.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={selectedClip.transform.scale}
              onChange={(e) => updateTransform('scale', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Position X & Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>X Offset</span>
                <span className="font-mono">{selectedClip.transform.x}px</span>
              </div>
              <input
                type="range"
                min="-600"
                max="600"
                step="5"
                value={selectedClip.transform.x}
                onChange={(e) => updateTransform('x', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Y Offset</span>
                <span className="font-mono">{selectedClip.transform.y}px</span>
              </div>
              <input
                type="range"
                min="-400"
                max="400"
                step="5"
                value={selectedClip.transform.y}
                onChange={(e) => updateTransform('y', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Rotation & Opacity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Rotation</span>
                <span className="font-mono">{selectedClip.transform.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedClip.transform.rotation}
                onChange={(e) => updateTransform('rotation', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{Math.round(selectedClip.transform.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedClip.transform.opacity}
                onChange={(e) => updateTransform('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Flip Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => updateTransform('flipH', !selectedClip.transform.flipH)}
              className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${
                selectedClip.transform.flipH
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'bg-[#141923] border-[#222c3d] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip H</span>
            </button>
            <button
              onClick={() => updateTransform('flipV', !selectedClip.transform.flipV)}
              className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs font-medium border transition-colors ${
                selectedClip.transform.flipV
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'bg-[#141923] border-[#222c3d] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip V</span>
            </button>
          </div>
        </div>

        {/* ================= AI SMART CUTOUT (Background Removal) ================= */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3 pb-4 border-b border-[#1b2333]">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Background Removal</span>
              </span>
              <button
                onClick={() =>
                  updateSmartCutout({
                    enabled: !selectedClip.smartCutout?.enabled,
                  })
                }
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                  selectedClip.smartCutout?.enabled
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                    : 'bg-[#161c27] text-slate-400 hover:text-slate-200 border border-[#222c3e]'
                }`}
              >
                {selectedClip.smartCutout?.enabled ? 'ACTIVE' : 'ENABLE'}
              </button>
            </div>

            {selectedClip.smartCutout?.enabled && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-1 bg-[#131924] p-1 rounded-lg border border-[#222c3e]">
                  {[
                    { id: 'ai_subject' as SmartCutoutMode, label: 'AI Subject' },
                    { id: 'chroma' as SmartCutoutMode, label: 'Chroma Key' },
                    { id: 'luma' as SmartCutoutMode, label: 'Luma Key' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateSmartCutout({ mode: m.id })}
                      className={`py-1 text-[10px] rounded font-semibold transition-all ${
                        selectedClip.smartCutout?.mode === m.id
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Chroma key color picker */}
                {selectedClip.smartCutout.mode === 'chroma' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Key Screen Color</span>
                      <div className="flex items-center gap-1.5">
                        {['#00FF00', '#0000FF', '#000000', '#FFFFFF'].map((c) => (
                          <button
                            key={c}
                            onClick={() => updateSmartCutout({ keyColor: c })}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded border ${
                              selectedClip.smartCutout?.keyColor === c
                                ? 'border-teal-400 scale-110 shadow'
                                : 'border-[#2d3a4e]'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedClip.smartCutout.keyColor || '#00FF00'}
                          onChange={(e) => updateSmartCutout({ keyColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border border-[#2d3a4e] bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tolerance & Softness */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Tolerance</span>
                      <span className="font-mono">{selectedClip.smartCutout.tolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="90"
                      value={selectedClip.smartCutout.tolerance}
                      onChange={(e) =>
                        updateSmartCutout({ tolerance: parseInt(e.target.value) })
                      }
                      className="w-full accent-teal-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Softness</span>
                      <span className="font-mono">{selectedClip.smartCutout.softness}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="80"
                      value={selectedClip.smartCutout.softness}
                      onChange={(e) =>
                        updateSmartCutout({ softness: parseInt(e.target.value) })
                      }
                      className="w-full accent-teal-400"
                    />
                  </div>
                </div>

                {/* Neon Contour / Stroke Outline */}
                <div className="p-2.5 rounded-lg bg-[#121824] border border-[#1f283a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Neon Subject Outline
                    </span>
                    <button
                      onClick={() =>
                        updateSmartCutout({
                          strokeOutline: !selectedClip.smartCutout?.strokeOutline,
                        })
                      }
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        selectedClip.smartCutout.strokeOutline
                          ? 'bg-sky-500 text-white'
                          : 'bg-[#1b2333] text-slate-400'
                      }`}
                    >
                      {selectedClip.smartCutout.strokeOutline ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {selectedClip.smartCutout.strokeOutline && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedClip.smartCutout.strokeColor || '#38BDF8'}
                          onChange={(e) =>
                            updateSmartCutout({ strokeColor: e.target.value })
                          }
                          className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-slate-300">
                          {selectedClip.smartCutout.strokeColor || '#38BDF8'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Glow:</span>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={selectedClip.smartCutout.strokeWidth || 4}
                          onChange={(e) =>
                            updateSmartCutout({ strokeWidth: parseInt(e.target.value) })
                          }
                          className="w-16 accent-sky-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SPEED ADJUSTMENT ================= */}
        <div className="space-y-3 pb-4 border-b border-[#1b2333]">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>Speed & Duration</span>
            </span>
            <span className="font-mono text-slate-300">{selectedClip.speed}x</span>
          </div>

          {/* Speed Presets */}
          <div className="grid grid-cols-4 gap-1">
            {[0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                className={`py-1 text-[11px] rounded font-medium transition-colors ${
                  selectedClip.speed === spd
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-[#141923] text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Timeline duration adjusts to {selectedClip.duration.toFixed(2)}s</span>
          </p>
        </div>

        {/* ================= AUDIO CONTROLS (Volume & Fading) ================= */}
        {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
          <div className="space-y-3 pb-4 border-b border-[#1b2333]">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio & Fading</span>
              </span>
              <button
                onClick={() => onUpdateClip(selectedClip.id, { muted: !selectedClip.muted })}
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  selectedClip.muted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-[#161c27] text-slate-400 hover:text-slate-200'
                }`}
              >
                {selectedClip.muted ? 'MUTED' : 'ACTIVE'}
              </button>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Volume</span>
                <span className="font-mono">{Math.round(selectedClip.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={selectedClip.volume}
                onChange={(e) =>
                  onUpdateClip(selectedClip.id, { volume: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            {/* Fade In & Fade Out */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fade In</span>
                  <span className="font-mono">{selectedClip.fadeIn}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4.0"
                  step="0.1"
                  value={selectedClip.fadeIn}
                  onChange={(e) =>
                    onUpdateClip(selectedClip.id, { fadeIn: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fade Out</span>
                  <span className="font-mono">{selectedClip.fadeOut}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4.0"
                  step="0.1"
                  value={selectedClip.fadeOut}
                  onChange={(e) =>
                    onUpdateClip(selectedClip.id, { fadeOut: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= COLOR GRADING & FILTERS ================= */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3 pb-4 border-b border-[#1b2333]">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Color Grading & Filters</span>
              </span>
              <button
                onClick={() => applyPreset('none')}
                title="Reset Filters"
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Presets Chips */}
            <div className="grid grid-cols-3 gap-1">
              {FILTER_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`py-1 text-[10px] rounded font-medium truncate transition-colors ${
                    selectedClip.filters.preset === preset.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#141923] text-slate-400 hover:text-slate-200'
                  }`}
                  title={preset.name}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Brightness & Contrast */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono">{selectedClip.filters.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={selectedClip.filters.brightness}
                  onChange={(e) => updateFilter('brightness', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono">{selectedClip.filters.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={selectedClip.filters.contrast}
                  onChange={(e) => updateFilter('contrast', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Saturation & Temperature */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono">{selectedClip.filters.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={selectedClip.filters.saturation}
                  onChange={(e) => updateFilter('saturation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Temp (Warm/Cool)</span>
                  <span className="font-mono">{selectedClip.filters.temperature}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={selectedClip.filters.temperature}
                  onChange={(e) => updateFilter('temperature', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Vignette & Blur */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Vignette</span>
                  <span className="font-mono">{selectedClip.filters.vignette}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedClip.filters.vignette}
                  onChange={(e) => updateFilter('vignette', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Blur</span>
                  <span className="font-mono">{selectedClip.filters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={selectedClip.filters.blur}
                  onChange={(e) => updateFilter('blur', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TRANSITIONS ================= */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Transition In</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none' as TransitionType, label: 'Cut (None)' },
                { id: 'crossfade' as TransitionType, label: 'Crossfade' },
                { id: 'wipeLeft' as TransitionType, label: 'Wipe Left' },
                { id: 'zoom' as TransitionType, label: 'Zoom In' },
                { id: 'flash' as TransitionType, label: 'Flash White' },
                { id: 'dipToBlack' as TransitionType, label: 'Dip to Black' },
              ].map((trans) => (
                <button
                  key={trans.id}
                  onClick={() =>
                    onUpdateClip(selectedClip.id, {
                      transitionIn: {
                        type: trans.id,
                        duration: selectedClip.transitionIn?.duration || 0.6,
                      },
                    })
                  }
                  className={`py-1.5 px-2 text-[11px] rounded font-medium text-left truncate transition-colors ${
                    selectedClip.transitionIn?.type === trans.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#141923] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {trans.label}
                </button>
              ))}
            </div>

            {selectedClip.transitionIn && selectedClip.transitionIn.type !== 'none' && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Transition Duration</span>
                  <span className="font-mono">{selectedClip.transitionIn.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={selectedClip.transitionIn.duration}
                  onChange={(e) =>
                    onUpdateClip(selectedClip.id, {
                      transitionIn: {
                        ...selectedClip.transitionIn!,
                        duration: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
