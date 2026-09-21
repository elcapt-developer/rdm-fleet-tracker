import React, { useState } from 'react';
import { Aircraft } from '../types';
import { X, Copy, Check, MessageSquare } from 'lucide-react';

interface TeamsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: Aircraft[];
}

export const TeamsExportModal: React.FC<TeamsExportModalProps> = ({
  isOpen,
  onClose,
  fleet,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const madrasPlanes = fleet.filter((p) => p.location === 'Madras');
  const skyServicePlanes = fleet.filter((p) => p.location === 'Sky Service');
  const campusPlanes = fleet.filter((p) => p.location === 'HAA Campus');

  // Generate markdown table matching Teams format
  const generateMarkdownTable = () => {
    let text = `### Aircraft Location and Status (Updated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\n\n`;
    text += `Hi RDM Student Community General\n`;
    text += `Consider this the running post for our tail number locations and each aircraft's status in terms of its airworthiness. Keep flying safe!\n\n`;

    text += `| Madras | | | Sky Service | | | HAA Campus | | |\n`;
    text += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    text += `| **Type** | **Tail** | **Status** | **Type** | **Tail** | **Status** | **Type** | **Tail** | **Status** |\n`;

    const maxRows = Math.max(madrasPlanes.length, skyServicePlanes.length, campusPlanes.length);

    for (let i = 0; i < maxRows; i++) {
      const m = madrasPlanes[i];
      const s = skyServicePlanes[i];
      const c = campusPlanes[i];

      const mType = m ? m.type : '';
      const mTail = m ? m.tailNumber : '';
      const mStatus = m ? m.status : '';

      const sType = s ? s.type : '';
      const sTail = s ? s.tailNumber : '';
      const sStatus = s ? s.status : '';

      const cType = c ? c.type : '';
      const cTail = c ? c.tailNumber : '';
      const cStatus = c ? c.status : '';

      text += `| ${mType} | ${mTail} | ${mStatus} | ${sType} | ${sTail} | ${sStatus} | ${cType} | ${cTail} | ${cStatus} |\n`;
    }

    return text;
  };

  const markdownContent = generateMarkdownTable();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Export to Microsoft Teams Post
              </h3>
              <p className="text-xs text-slate-400">
                1-Click formatted Markdown table matching Shayla & Daryl's channel post format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Preview (Formatted Table)
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
            {markdownContent}
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-300">
            💡 <strong>Tip</strong>: You can paste directly into Microsoft Teams, Discord, Slack, or send via email. Teams automatically renders this markdown table cleanly!
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
