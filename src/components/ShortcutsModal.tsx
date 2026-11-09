import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause playback' },
    { key: 'Ctrl / Cmd + Click', desc: 'Multi-select clips (drag as group)' },
    { key: 'Ctrl + B', desc: 'Split clip at playhead' },
    { key: 'Ctrl + D', desc: 'Duplicate selected clip(s)' },
    { key: 'Delete / Backspace', desc: 'Delete selected clip(s)' },
    { key: 'Esc', desc: 'Deselect all clips' },
    { key: '← / →', desc: 'Step 1 frame backward / forward' },
    { key: 'Shift + ← / →', desc: 'Step 1 second backward / forward' },
    { key: 'Home / End', desc: 'Jump to beginning / end of project' },
    { key: 'S', desc: 'Toggle magnetic timeline snapping' },
    { key: 'Ctrl + Z', desc: 'Undo last edit' },
    { key: 'Ctrl + Y', desc: 'Redo last edit' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0f141f] border border-[#232d40] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#1f283a] flex items-center justify-between bg-[#0b0e16]">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2232] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 divide-y divide-[#1b2333] text-xs">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#161c28] border border-[#26334a] font-mono text-[11px] text-sky-300 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[#1f283a] bg-[#0b0e16] text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
