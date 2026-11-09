import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ExportSettings, ProjectSettings, Track } from '../types/editor';
import { exportEngine, ExportProgress } from '../utils/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  projectSettings: ProjectSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  projectSettings,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 30,
    quality: 'high',
    format: 'webm',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(null);
    setExportError(null);
    setExportedVideoUrl(null);

    try {
      const blob = await exportEngine.exportVideo(
        tracks,
        projectSettings,
        settings,
        (prog) => setProgress(prog)
      );

      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);
      setIsExporting(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('cancelled')) {
        setIsExporting(false);
        setProgress(null);
        return;
      }
      setExportError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    exportEngine.cancel();
    setIsExporting(false);
    setProgress(null);
  };

  const handleDownloadFile = () => {
    if (!exportedVideoUrl) return;
    const link = document.createElement('a');
    link.href = exportedVideoUrl;
    link.download = `${projectSettings.title.replace(/\s+/g, '_').toLowerCase()}_${settings.resolution}.webm`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f141f] border border-[#232d40] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f283a] flex items-center justify-between bg-[#0b0e16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Video Project</h3>
              <p className="text-[11px] text-slate-400">{projectSettings.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2232] disabled:opacity-30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status: Ready to Export Settings */}
          {!isExporting && !exportedVideoUrl && (
            <div className="space-y-4">
              {/* Resolution options */}
              <div>
                <label className="text-slate-300 font-semibold mb-2 block">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '720p', label: '720p HD', sub: 'Fast render' },
                    { id: '1080p', label: '1080p FHD', sub: 'Recommended' },
                    { id: '4k', label: '4K UHD', sub: 'Ultra clarity' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      onClick={() =>
                        setSettings({ ...settings, resolution: res.id as ExportSettings['resolution'] })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.resolution === res.id
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-[#141b27] border-[#222c3e] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{res.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{res.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate & Bitrate Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1.5 block">Frame Rate</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[30, 60].map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setSettings({ ...settings, fps: fps as 30 | 60 })}
                        className={`py-1.5 rounded-lg border font-semibold text-xs transition-colors ${
                          settings.fps === fps
                            ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                            : 'bg-[#141b27] border-[#222c3e] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1.5 block">Quality</label>
                  <select
                    value={settings.quality}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quality: e.target.value as ExportSettings['quality'],
                      })
                    }
                    className="w-full bg-[#141b27] border border-[#222c3e] rounded-lg p-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="standard">Standard (4 Mbps)</option>
                    <option value="high">High Bitrate (8 Mbps)</option>
                    <option value="ultra">Ultra Studio (12 Mbps)</option>
                  </select>
                </div>
              </div>

              {/* Summary card */}
              <div className="p-3 rounded-xl bg-[#0b0e16] border border-[#1b2333] space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Aspect Ratio</span>
                  <span className="font-mono text-slate-200">{projectSettings.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeline Tracks</span>
                  <span className="font-mono text-slate-200">{tracks.length} active tracks</span>
                </div>
                <div className="flex justify-between">
                  <span>Format</span>
                  <span className="font-mono text-slate-200">WebM / VP9 with Opus Audio</span>
                </div>
              </div>
            </div>
          )}

          {/* Status: Active Export Rendering */}
          {isExporting && (
            <div className="py-6 space-y-4 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-sky-400 font-mono">
                  {progress?.progressPercent || 0}%
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-white">Rendering Video Canvas...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Encoding frames and synthesizing multi-track audio
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#161c28] h-2.5 rounded-full overflow-hidden border border-[#232c3f]">
                <div
                  style={{ width: `${progress?.progressPercent || 0}%` }}
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-150"
                />
              </div>

              {/* Frame stats */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>
                  Frame {progress?.currentFrame || 0} / {progress?.totalFrames || 0}
                </span>
                <span>
                  {progress?.estimatedRemainingSec !== undefined
                    ? `${progress.estimatedRemainingSec}s remaining`
                    : 'Calculating...'}
                </span>
              </div>

              <button
                onClick={handleCancelExport}
                className="px-4 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors mt-2"
              >
                Cancel Export
              </button>
            </div>
          )}

          {/* Status: Finished Video Ready */}
          {exportedVideoUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs">Video render complete! Ready to download.</span>
              </div>

              {/* Preview Player */}
              <div className="rounded-xl overflow-hidden border border-[#222c3d] bg-black aspect-video flex items-center justify-center">
                <video
                  src={exportedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadFile}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video File</span>
                </button>
                <button
                  onClick={() => {
                    setExportedVideoUrl(null);
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#161c28] hover:bg-[#202738] text-slate-300 font-semibold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {exportError && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isExporting && !exportedVideoUrl && (
          <div className="px-5 py-3.5 border-t border-[#1f283a] bg-[#0b0e16] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartExport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Render</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
