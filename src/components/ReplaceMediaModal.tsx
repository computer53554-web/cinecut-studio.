import React, { useRef } from 'react';
import { X, RefreshCw, Upload, Image as ImageIcon, Video, Check, Film } from 'lucide-react';
import { Clip, MediaAsset } from '../types/editor';
import { DEFAULT_SAMPLE_MEDIA } from '../utils/assetsData';

interface ReplaceMediaModalProps {
  isOpen: boolean;
  clip: Clip | null;
  mediaAssets: MediaAsset[];
  onClose: () => void;
  onReplaceWithAsset: (asset: MediaAsset) => void;
  onReplaceWithFile: (file: File) => void;
}

export const ReplaceMediaModal: React.FC<ReplaceMediaModalProps> = ({
  isOpen,
  clip,
  mediaAssets,
  onClose,
  onReplaceWithAsset,
  onReplaceWithFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !clip) return null;

  // Combine project media assets with default sample media (avoiding duplicates)
  const allAvailableAssets: MediaAsset[] = [...mediaAssets];
  DEFAULT_SAMPLE_MEDIA.forEach((sample) => {
    if (!allAvailableAssets.some((a) => a.id === sample.id || a.url === sample.url)) {
      allAvailableAssets.push(sample);
    }
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onReplaceWithFile(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#0f141f] border border-[#232d40] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1f283a] flex items-center justify-between bg-[#0b0e16]">
          <div className="flex items-center gap-2 text-white">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold">Replace Media Clip</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2232] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Clip Banner */}
        <div className="px-5 py-3 bg-[#131926] border-b border-[#1e2637] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {clip.url && (
              <img
                src={clip.url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">Current Clip (Preserves timing & cuts):</span>
              <span className="text-xs font-bold text-white truncate block">{clip.name}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30 shrink-0">
            {clip.duration.toFixed(2)}s
          </span>
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl border-2 border-dashed border-[#28354c] hover:border-sky-400/80 bg-[#121824]/60 hover:bg-sky-950/20 flex items-center justify-center gap-2.5 text-xs font-semibold text-sky-300 transition-all group"
          >
            <Upload className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Upload New Video / Photo from Device</span>
          </button>

          {/* Available Media Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Or Choose from Media Library:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allAvailableAssets
                .filter((asset) => asset.type === 'video' || asset.type === 'image')
                .map((asset) => {
                  const isCurrent = clip.mediaAssetId === asset.id || clip.url === asset.url;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onReplaceWithAsset(asset);
                        onClose();
                      }}
                      className={`group relative rounded-xl overflow-hidden border p-1 cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-sky-400 bg-sky-950/30 ring-1 ring-sky-400'
                          : 'border-[#1f293d] bg-[#111724] hover:border-sky-500/50 hover:bg-[#161f30]'
                      }`}
                    >
                      <div className="h-20 w-full rounded-lg bg-black/60 overflow-hidden relative">
                        {asset.url && (
                          <img
                            src={asset.thumbnail || asset.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        <span className="absolute top-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-slate-300 uppercase">
                          {asset.type}
                        </span>
                        {isCurrent && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white shadow">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <span className="text-[11px] font-semibold text-slate-200 truncate block group-hover:text-sky-300">
                          {asset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {asset.duration}s
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f283a] bg-[#0b0e16] flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500">
            Applied filters, audio volume, keyframes, and cuts are preserved.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1a2233] hover:bg-[#253147] text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
