import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Scissors,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Type,
  Smile,
  Video,
  Music,
} from 'lucide-react';
import { Clip, ProjectSettings, Track } from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface TimelineProps {
  tracks: Track[];
  projectSettings: ProjectSettings;
  currentTime: number;
  selectedClipId: string | null;
  selectedClipIds?: string[];
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null, isMultiSelect?: boolean) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onUpdateClipsBatch?: (
    updates: { id: string; start?: number; duration?: number }[],
    commitToHistory?: boolean
  ) => void;
  onDeleteClip: (clipId: string) => void;
  onDeleteSelectedClips?: () => void;
  onDuplicateClip: (clipId: string) => void;
  onDuplicateSelectedClips?: () => void;
  onCommitHistory?: () => void;
  onSplitClipAtPlayhead: () => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onToggleTrackVisible: (trackId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  projectSettings,
  currentTime,
  selectedClipId,
  selectedClipIds = [],
  onSeek,
  onSelectClip,
  onUpdateClip,
  onUpdateClipsBatch,
  onDeleteClip,
  onDeleteSelectedClips,
  onDuplicateClip,
  onDuplicateSelectedClips,
  onCommitHistory,
  onSplitClipAtPlayhead,
  onToggleTrackMute,
  onToggleTrackLock,
  onToggleTrackVisible,
}) => {
  // Pixels per second scale (zoom)
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(50);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [isScrubbingRuler, setIsScrubbingRuler] = useState(false);

  // Dragging clip state (supports group move)
  const [dragAction, setDragAction] = useState<{
    type: 'move' | 'trim-start' | 'trim-end';
    clipId: string;
    initialMouseX: number;
    initialStart: number;
    initialDuration: number;
    trackId: string;
    groupClips?: { id: string; initialStart: number; initialDuration: number }[];
    hasMoved?: boolean;
  } | null>(null);

  // Audio waveforms peak cache
  const [waveforms, setWaveforms] = useState<Record<string, number[]>>({});

  // Compute waveform peaks for audio clips
  useEffect(() => {
    tracks.forEach((track) => {
      if (track.type === 'audio') {
        track.clips.forEach((clip) => {
          if (clip.mediaAssetId && !waveforms[clip.id]) {
            const buf = audioEngine.getBuffer(clip.mediaAssetId);
            if (buf) {
              const peaks = audioEngine.extractWaveformPeaks(buf, 80);
              setWaveforms((prev) => ({ ...prev, [clip.id]: peaks }));
            }
          }
        });
      }
    });
  }, [tracks, waveforms]);

  // Overall timeline length in seconds
  const totalTimelineSec = projectSettings.duration || 60;
  const timelineContentWidth = totalTimelineSec * pixelsPerSecond;

  // Convert pixel offset to timeline seconds
  const pixelToTime = useCallback(
    (pixel: number) => {
      return Math.max(0, Math.min(totalTimelineSec, pixel / pixelsPerSecond));
    },
    [pixelsPerSecond, totalTimelineSec]
  );

  // Convert time to pixels
  const timeToPixel = (time: number) => {
    return time * pixelsPerSecond;
  };

  // Snapping logic (supports single ID or array of clip IDs to exclude)
  const snapTime = useCallback(
    (targetTime: number, excludeClipIds?: string | string[]): number => {
      if (!projectSettings.snap) return targetTime;
      const snapThreshold = 10 / pixelsPerSecond; // 10 pixels radius
      const excludes = Array.isArray(excludeClipIds)
        ? excludeClipIds
        : excludeClipIds
        ? [excludeClipIds]
        : [];

      // Snap to playhead
      if (Math.abs(targetTime - currentTime) < snapThreshold) {
        return currentTime;
      }

      // Snap to any clip boundary (excluding the moving clip or group)
      for (const t of tracks) {
        for (const c of t.clips) {
          if (excludes.includes(c.id)) continue;
          if (Math.abs(targetTime - c.start) < snapThreshold) {
            return c.start;
          }
          if (Math.abs(targetTime - (c.start + c.duration)) < snapThreshold) {
            return c.start + c.duration;
          }
        }
      }

      return targetTime;
    },
    [projectSettings.snap, pixelsPerSecond, currentTime, tracks]
  );

  // Ruler scrubbing handler
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = pixelToTime(clickX);
    onSeek(time);
    setIsScrubbingRuler(true);
  };

  // Mouse move and up handlers for dragging clips & scrubbing ruler
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isScrubbingRuler && timelineScrollRef.current) {
        const rect = timelineScrollRef.current.getBoundingClientRect();
        // 176px is track header sidebar width
        const scrollLeft = timelineScrollRef.current.scrollLeft;
        const clickX = e.clientX - rect.left - 176 + scrollLeft;
        onSeek(pixelToTime(clickX));
        return;
      }

      if (!dragAction) return;

      const deltaPixels = e.clientX - dragAction.initialMouseX;
      const deltaTime = deltaPixels / pixelsPerSecond;

      if (dragAction.type === 'move') {
        const group =
          dragAction.groupClips && dragAction.groupClips.length > 0
            ? dragAction.groupClips
            : [{ id: dragAction.clipId, initialStart: dragAction.initialStart, initialDuration: dragAction.initialDuration }];

        // Prevent ANY clip in the group from dropping below 0s start
        const minInitialStart = Math.min(...group.map((g) => g.initialStart));
        const clampedDelta = Math.max(-minInitialStart, deltaTime);

        // Snap the primary dragged clip against clips outside the group
        const excludeIds = group.map((g) => g.id);
        const targetPrimaryStart = dragAction.initialStart + clampedDelta;
        const snappedPrimaryStart = snapTime(targetPrimaryStart, excludeIds);
        const snappedDelta = snappedPrimaryStart - dragAction.initialStart;
        const effectiveDelta = Math.max(-minInitialStart, snappedDelta);

        if (Math.abs(deltaPixels) > 2) {
          dragAction.hasMoved = true;
        }

        // Apply shift to all clips in the group
        const updates = group.map((g) => ({
          id: g.id,
          start: Math.max(0, Math.round((g.initialStart + effectiveDelta) * 100) / 100),
        }));

        if (onUpdateClipsBatch) {
          onUpdateClipsBatch(updates, false);
        } else {
          onUpdateClip(dragAction.clipId, { start: updates[0]?.start ?? 0 });
        }
      } else if (dragAction.type === 'trim-start') {
        if (Math.abs(deltaPixels) > 2) dragAction.hasMoved = true;
        const potentialStart = Math.max(0, dragAction.initialStart + deltaTime);
        const snappedStart = snapTime(potentialStart, dragAction.clipId);
        const timeDiff = snappedStart - dragAction.initialStart;
        const newDuration = Math.max(0.3, dragAction.initialDuration - timeDiff);

        if (newDuration > 0.3) {
          onUpdateClip(dragAction.clipId, {
            start: Math.round(snappedStart * 100) / 100,
            duration: Math.round(newDuration * 100) / 100,
          });
        }
      } else if (dragAction.type === 'trim-end') {
        if (Math.abs(deltaPixels) > 2) dragAction.hasMoved = true;
        const potentialEnd = dragAction.initialStart + dragAction.initialDuration + deltaTime;
        const snappedEnd = snapTime(potentialEnd, dragAction.clipId);
        const newDuration = Math.max(0.3, snappedEnd - dragAction.initialStart);

        onUpdateClip(dragAction.clipId, {
          duration: Math.round(newDuration * 100) / 100,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragAction?.hasMoved) {
        onCommitHistory?.();
      }
      setIsScrubbingRuler(false);
      setDragAction(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isScrubbingRuler,
    dragAction,
    pixelsPerSecond,
    pixelToTime,
    snapTime,
    onSeek,
    onUpdateClip,
    onUpdateClipsBatch,
    onCommitHistory,
  ]);

  // Active selected IDs
  const activeSelectedIds =
    selectedClipIds && selectedClipIds.length > 0
      ? selectedClipIds
      : selectedClipId
      ? [selectedClipId]
      : [];

  // Primary selected clip object
  let selectedClipObj: Clip | null = null;
  const primaryId = selectedClipId || activeSelectedIds[activeSelectedIds.length - 1] || null;
  if (primaryId) {
    for (const t of tracks) {
      const c = t.clips.find((item) => item.id === primaryId);
      if (c) {
        selectedClipObj = c;
        break;
      }
    }
  }

  // Track icon helper
  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-sky-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case 'sticker':
        return <Smile className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Clip color styling helper
  const getClipStyle = (clip: Clip, isSelected: boolean) => {
    let bgGradient = 'from-sky-700/80 to-sky-900/90 border-sky-500/40 text-sky-100';
    if (clip.type === 'audio') {
      bgGradient = 'from-emerald-700/80 to-emerald-900/90 border-emerald-500/40 text-emerald-100';
    } else if (clip.type === 'text') {
      bgGradient = 'from-purple-700/80 to-purple-900/90 border-purple-500/40 text-purple-100';
    } else if (clip.type === 'sticker') {
      bgGradient = 'from-amber-700/80 to-amber-900/90 border-amber-500/40 text-amber-100';
    }

    if (isSelected) {
      return `${bgGradient} ring-2 ring-sky-400 shadow-lg shadow-sky-500/30 z-10 brightness-115`;
    }
    return `${bgGradient} hover:brightness-110`;
  };

  return (
    <div className="h-64 bg-[#0a0d13] border-t border-[#1a2230] flex flex-col select-none shrink-0">
      {/* Timeline Action Toolbar */}
      <div className="h-10 bg-[#0e121a] border-b border-[#1b2333] px-4 flex items-center justify-between gap-4 shrink-0 text-xs">
        {/* Left: Split, Delete, Duplicate tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSplitClipAtPlayhead}
            disabled={!selectedClipObj}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161c27] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 disabled:opacity-35 disabled:hover:bg-[#161c27] disabled:hover:text-slate-300 border border-[#222c3d] transition-colors"
            title="Split Clip at Playhead (Ctrl+B)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="font-medium">Split</span>
          </button>

          <button
            onClick={() => {
              if (onDeleteSelectedClips && activeSelectedIds.length > 0) {
                onDeleteSelectedClips();
              } else if (selectedClipId) {
                onDeleteClip(selectedClipId);
              }
            }}
            disabled={activeSelectedIds.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161c27] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 disabled:opacity-35 border border-[#222c3d] transition-colors"
            title="Delete Selected Clip(s) (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-medium">
              Delete{activeSelectedIds.length > 1 ? ` (${activeSelectedIds.length})` : ''}
            </span>
          </button>

          <button
            onClick={() => {
              if (onDuplicateSelectedClips && activeSelectedIds.length > 0) {
                onDuplicateSelectedClips();
              } else if (selectedClipId) {
                onDuplicateClip(selectedClipId);
              }
            }}
            disabled={activeSelectedIds.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161c27] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 disabled:opacity-35 border border-[#222c3d] transition-colors"
            title="Duplicate Selected Clip(s) (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="font-medium">
              Duplicate{activeSelectedIds.length > 1 ? ` (${activeSelectedIds.length})` : ''}
            </span>
          </button>

          {/* Quick info about selected clip or multi-selection status */}
          {activeSelectedIds.length > 1 ? (
            <div className="ml-3 px-2.5 py-1 rounded-md bg-sky-950/70 border border-sky-500/40 text-[11px] text-sky-200 flex items-center gap-2 shadow-sm animate-in fade-in duration-100">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-semibold">{activeSelectedIds.length} clips selected</span>
              <span className="text-slate-400 font-normal">· Drag to shift group</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectClip(null);
                }}
                className="ml-1 text-slate-400 hover:text-white text-xs px-1 rounded hover:bg-white/10"
                title="Deselect all clips (Esc)"
              >
                ✕
              </button>
            </div>
          ) : selectedClipObj ? (
            <div className="ml-3 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-[10px] text-sky-300 font-mono flex items-center gap-2">
              <span>{selectedClipObj.name}</span>
              <span>·</span>
              <span>Start: {selectedClipObj.start.toFixed(2)}s</span>
              <span>·</span>
              <span>Dur: {selectedClipObj.duration.toFixed(2)}s</span>
            </div>
          ) : (
            <div className="ml-3 text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
              <span>Hold <kbd className="px-1 py-0.5 rounded bg-[#161c27] text-slate-400 font-mono text-[9px] border border-slate-700">Ctrl / Cmd</kbd> + click to multi-select clips</span>
            </div>
          )}
        </div>

        {/* Right: Zoom slider */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={() => setPixelsPerSecond(Math.max(15, pixelsPerSecond - 10))}
            className="p-1 rounded hover:text-white"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="15"
            max="120"
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
            className="w-24 accent-sky-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
            title="Timeline Zoom"
          />

          <button
            onClick={() => setPixelsPerSecond(Math.min(120, pixelsPerSecond + 10))}
            className="p-1 rounded hover:text-white"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Timeline Scrollable Canvas & Track Headers */}
      <div className="flex-1 flex overflow-hidden relative" ref={timelineScrollRef}>
        {/* Left Track Headers (Sticky) */}
        <div className="w-44 bg-[#0a0e16] border-r border-[#1a2230] shrink-0 z-20 flex flex-col">
          {/* Header spacer aligned with ruler */}
          <div className="h-6 border-b border-[#1a2230] bg-[#0c1017] px-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>TRACKS</span>
            <span className="font-mono">{tracks.length}</span>
          </div>

          {/* Track Rows Info */}
          <div className="flex-1 overflow-hidden divide-y divide-[#151c28]">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 px-2.5 flex items-center justify-between gap-1 bg-[#0a0e16] hover:bg-[#0f1420] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {getTrackIcon(track.type)}
                  <span className="text-xs font-medium text-slate-300 truncate" title={track.name}>
                    {track.name}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Mute Track */}
                  <button
                    onClick={() => onToggleTrackMute(track.id)}
                    className={`p-1 rounded text-slate-500 hover:text-slate-200 ${
                      track.muted ? 'text-rose-400 bg-rose-500/15' : ''
                    }`}
                    title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  >
                    {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>

                  {/* Lock Track */}
                  <button
                    onClick={() => onToggleTrackLock(track.id)}
                    className={`p-1 rounded text-slate-500 hover:text-slate-200 ${
                      track.locked ? 'text-amber-400 bg-amber-500/15' : ''
                    }`}
                    title={track.locked ? 'Unlock Track' : 'Lock Track'}
                  >
                    {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  {/* Hide Track */}
                  <button
                    onClick={() => onToggleTrackVisible(track.id)}
                    className={`p-1 rounded text-slate-500 hover:text-slate-200 ${
                      !track.visible ? 'text-rose-400' : ''
                    }`}
                    title={track.visible ? 'Hide Track' : 'Show Track'}
                  >
                    {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#070a0f] flex flex-col">
          {/* Timeline Ruler */}
          <div
            onMouseDown={handleRulerMouseDown}
            style={{ width: timelineContentWidth }}
            className="h-6 bg-[#0c1017] border-b border-[#1a2230] relative cursor-pointer select-none"
          >
            {/* Seconds markers */}
            {Array.from({ length: Math.ceil(totalTimelineSec) + 1 }).map((_, sec) => {
              const x = timeToPixel(sec);
              const isMajor = sec % 5 === 0;
              return (
                <div key={sec} style={{ left: x }} className="absolute top-0 bottom-0 pointer-events-none">
                  <div
                    className={`w-px ${isMajor ? 'h-3.5 bg-slate-500' : 'h-2 bg-slate-700'} absolute top-0`}
                  />
                  {isMajor && (
                    <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-400 tabular-nums">
                      {Math.floor(sec / 60)}:{(sec % 60).toString().padStart(2, '0')}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline Tracks Lane Container */}
          <div
            style={{ width: timelineContentWidth }}
            className="flex-1 relative divide-y divide-[#151c28]"
            onClick={() => onSelectClip(null)}
          >
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`h-10 relative bg-[#090c12]/40 transition-opacity ${
                  !track.visible ? 'opacity-30' : ''
                }`}
              >
                {/* Track Clips */}
                {track.clips.map((clip) => {
                  const clipLeft = timeToPixel(clip.start);
                  const clipWidth = timeToPixel(clip.duration);
                  const isSelected = activeSelectedIds.includes(clip.id);

                  return (
                    <div
                      key={clip.id}
                      style={{
                        left: clipLeft,
                        width: Math.max(16, clipWidth),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isMulti = e.ctrlKey || e.metaKey;
                        onSelectClip(clip.id, isMulti);
                      }}
                      className={`absolute top-1 bottom-1 rounded-md border text-[11px] font-medium flex items-center px-2 cursor-grab active:cursor-grabbing transition-shadow overflow-hidden group select-none bg-gradient-to-r ${getClipStyle(
                        clip,
                        isSelected
                      )}`}
                    >
                      {/* Left Trim Handle */}
                      {!track.locked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id, false);
                            setDragAction({
                              type: 'trim-start',
                              clipId: clip.id,
                              initialMouseX: e.clientX,
                              initialStart: clip.start,
                              initialDuration: clip.duration,
                              trackId: track.id,
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-sky-400 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-20"
                          title="Trim in-point"
                        >
                          <div className="w-0.5 h-3 bg-white/80 rounded" />
                        </div>
                      )}

                      {/* Clip Body (Drag to Reposition / Group Shift) */}
                      <div
                        onMouseDown={(e) => {
                          if (track.locked) return;
                          e.stopPropagation();
                          const isMulti = e.ctrlKey || e.metaKey;

                          let effectiveSelected = activeSelectedIds;
                          if (isMulti) {
                            if (activeSelectedIds.includes(clip.id)) {
                              effectiveSelected = activeSelectedIds;
                            } else {
                              effectiveSelected = [...activeSelectedIds, clip.id];
                              onSelectClip(clip.id, true);
                            }
                          } else {
                            if (!activeSelectedIds.includes(clip.id)) {
                              effectiveSelected = [clip.id];
                              onSelectClip(clip.id, false);
                            }
                          }

                          // Build group list from currently unlocked tracks
                          const groupClips: { id: string; initialStart: number; initialDuration: number }[] = [];
                          tracks.forEach((t) => {
                            if (!t.locked) {
                              t.clips.forEach((c) => {
                                if (effectiveSelected.includes(c.id)) {
                                  groupClips.push({
                                    id: c.id,
                                    initialStart: c.start,
                                    initialDuration: c.duration,
                                  });
                                }
                              });
                            }
                          });

                          if (groupClips.length === 0) {
                            groupClips.push({
                              id: clip.id,
                              initialStart: clip.start,
                              initialDuration: clip.duration,
                            });
                          }

                          setDragAction({
                            type: 'move',
                            clipId: clip.id,
                            initialMouseX: e.clientX,
                            initialStart: clip.start,
                            initialDuration: clip.duration,
                            trackId: track.id,
                            groupClips,
                            hasMoved: false,
                          });
                        }}
                        className="flex-1 flex items-center gap-1.5 min-w-0 h-full relative"
                      >
                        {/* Audio Waveform visualization if audio clip */}
                        {clip.type === 'audio' && waveforms[clip.id] && (
                          <div className="absolute inset-0 flex items-center gap-[2px] opacity-40 pointer-events-none">
                            {waveforms[clip.id].map((peak, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${Math.max(15, peak * 100)}%` }}
                                className="w-[3px] bg-emerald-200 rounded-sm"
                              />
                            ))}
                          </div>
                        )}

                        {/* Keyframe diamond markers on clip body */}
                        {clip.keyframes && clip.keyframes.length > 0 && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                            {clip.keyframes.map((kf) => (
                              <div
                                key={kf.id}
                                style={{
                                  left: `${(kf.time / clip.duration) * 100}%`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSeek(clip.start + kf.time);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-sky-300 border border-black/60 rotate-45 shadow-sm pointer-events-auto cursor-pointer hover:scale-125 hover:bg-white transition-transform"
                                title={`Keyframe at ${kf.time.toFixed(2)}s`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Video thumbnail badge */}
                        {clip.url && (clip.type === 'video' || clip.type === 'image') && (
                          <img
                            src={clip.url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded object-cover border border-white/20 shrink-0 pointer-events-none"
                          />
                        )}

                        <span className="truncate text-[10px] font-semibold tracking-wide drop-shadow relative z-10">
                          {clip.name}
                        </span>

                        {clip.speed !== 1.0 && (
                          <span className="text-[9px] px-1 rounded bg-black/40 text-amber-300 font-mono shrink-0 ml-auto z-10">
                            {clip.speed}x
                          </span>
                        )}
                      </div>

                      {/* Right Trim Handle */}
                      {!track.locked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onSelectClip(clip.id, false);
                            setDragAction({
                              type: 'trim-end',
                              clipId: clip.id,
                              initialMouseX: e.clientX,
                              initialStart: clip.start,
                              initialDuration: clip.duration,
                              trackId: track.id,
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/20 hover:bg-sky-400 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-20"
                          title="Trim out-point"
                        >
                          <div className="w-0.5 h-3 bg-white/80 rounded" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Glowing Red Playhead Line & Needle */}
            <div
              style={{
                left: timeToPixel(currentTime),
              }}
              className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-30 playhead-needle"
            >
              {/* Diamond Head */}
              <div className="w-3 h-3 bg-red-500 rotate-45 -ml-1.5 -mt-1.5 shadow-md shadow-red-500/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
