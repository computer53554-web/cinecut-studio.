import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { AspectRatio, Clip, ProjectSettings, Track } from '../types/editor';
import { canvasRenderer } from '../utils/canvasRenderer';

interface PlayerMonitorProps {
  tracks: Track[];
  projectSettings: ProjectSettings;
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onStepFrame: (direction: number) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClipTransform?: (clipId: string, transform: { x: number; y: number }) => void;
}

export const PlayerMonitor: React.FC<PlayerMonitorProps> = ({
  tracks,
  projectSettings,
  currentTime,
  isPlaying,
  selectedClipId,
  onSeek: _onSeek,
  onTogglePlay,
  onStepFrame,
  onJumpStart,
  onJumpEnd,
  onSelectClip: _onSelectClip,
  onUpdateClipTransform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialClipX: number; initialClipY: number } | null>(null);

  // Format time into HH:MM:SS:FF
  const formatTimecode = (seconds: number) => {
    const fps = projectSettings.fps || 30;
    const totalFrames = Math.floor(seconds * fps);
    const frames = totalFrames % fps;
    const totalSeconds = Math.floor(seconds);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = Math.floor(totalSeconds / 3600);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(frames)}`;
  };

  // Get total effective duration of project
  const getMaxProjectTime = useCallback(() => {
    let max = 5;
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        const end = c.start + c.duration;
        if (end > max) max = end;
      });
    });
    return Math.min(max, projectSettings.duration);
  }, [tracks, projectSettings.duration]);

  // Compute aspect ratio styles for container
  const getAspectRatioPadding = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-[16/9] max-h-full max-w-full';
      case '9:16':
        return 'aspect-[9/16] max-h-full max-w-full';
      case '1:1':
        return 'aspect-square max-h-full max-w-full';
      case '4:5':
        return 'aspect-[4/5] max-h-full max-w-full';
    }
  };

  // Draw current frame onto canvas
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
  }, [currentTime, tracks, projectSettings.aspectRatio, selectedClipId]);

  // Canvas interactive drag to reposition selected clip
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClipId || !onUpdateClipTransform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Find selected clip
    let selectedClip: Clip | undefined;
    for (const t of tracks) {
      const found = t.clips.find((c) => c.id === selectedClipId);
      if (found) {
        selectedClip = found;
        break;
      }
    }
    if (!selectedClip) return;

    setIsDraggingClip(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialClipX: selectedClip.transform.x,
      initialClipY: selectedClip.transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingClip || !dragStartRef.current || !selectedClipId || !onUpdateClipTransform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const deltaX = (e.clientX - dragStartRef.current.startX) * scaleX;
    const deltaY = (e.clientY - dragStartRef.current.startY) * scaleY;

    onUpdateClipTransform(selectedClipId, {
      x: Math.round(dragStartRef.current.initialClipX + deltaX),
      y: Math.round(dragStartRef.current.initialClipY + deltaY),
    });
  };

  const handleMouseUp = () => {
    setIsDraggingClip(false);
    dragStartRef.current = null;
  };

  const totalDuration = getMaxProjectTime();

  return (
    <div className="flex-1 bg-[#080b10] flex flex-col h-full min-w-0 select-none overflow-hidden">
      {/* Video Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-4 min-h-0 bg-[#07090e]"
      >
        <div
          className={`relative shadow-2xl rounded-lg overflow-hidden border border-[#1e2636] bg-black flex items-center justify-center transition-all ${getAspectRatioPadding(
            projectSettings.aspectRatio
          )}`}
          style={{
            maxHeight: zoomLevel === 'fit' ? 'calc(100% - 10px)' : '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-full object-contain ${
              selectedClipId ? 'cursor-move' : 'cursor-default'
            }`}
          />

          {/* Quick HUD Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-mono border border-white/10">
            <span>{projectSettings.aspectRatio}</span>
            <span>·</span>
            <span>{projectSettings.fps} FPS</span>
          </div>
        </div>
      </div>

      {/* Monitor Playback Transport Bar */}
      <div className="h-12 bg-[#0c1017] border-t border-[#1a2230] px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Left: Timecode readout */}
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
          <span className="text-sky-400 font-semibold">{formatTimecode(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-1">
          {/* Jump Start */}
          <button
            onClick={onJumpStart}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
            title="Jump to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Step Back 1 Frame */}
          <button
            onClick={() => onStepFrame(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
            title="Previous Frame (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 transition-all active:scale-95 mx-1"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            onClick={() => onStepFrame(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
            title="Next Frame (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump End */}
          <button
            onClick={onJumpEnd}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
            title="Jump to End (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Loop, Volume & Zoom options */}
        <div className="flex items-center gap-1">
          {/* Loop toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping
                ? 'text-sky-400 bg-sky-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#161c27]'
            }`}
            title="Loop Playback"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-lg transition-colors ${
              isMuted
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c27]'
            }`}
            title="Mute Audio Preview (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* View Zoom */}
          <button
            onClick={() => setZoomLevel(zoomLevel === 'fit' ? '100%' : 'fit')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
            title={`Zoom: ${zoomLevel}`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
