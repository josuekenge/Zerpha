import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, FileText, Loader2, Download } from 'lucide-react';
import { useState } from 'react';
import { InfographicPage } from '../types';
import { downloadInfographicPdf } from '../lib/utils';

interface InfographicModalProps {
  isOpen: boolean;
  isLoading: boolean;
  data: InfographicPage | null;
  onClose: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export function InfographicModal({ isOpen, isLoading, data, onClose, error, onRetry }: InfographicModalProps) {
  const [copied, setCopied] = useState(false);
  const resolvedErrorMessage =
    error === 'infographic_provider_unavailable'
      ? 'Infographic temporarily unavailable due to AI provider load, please try again.'
      : error;

  const handleCopyMarkdown = () => {
    if (!data) return;
    
    const md = `# ${data.title}
${data.subtitle}

## Key Metrics
${data.key_metrics.map(m => `- **${m.label}**: ${m.value}`).join('\n')}

## Strategic Analysis
${data.bullets.map(b => `- ${b}`).join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!data) return;
    downloadInfographicPdf(data);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-text/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background shadow-2xl flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primarySoft text-primary rounded-lg">
                    <FileText className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-text">Infographic Preview</h2>
                    <p className="text-xs text-muted">AI Generated One-Pager</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted hover:text-text hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {isLoading ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="font-medium text-sm text-muted">Drafting infographic...</p>
                 </div>
              ) : error ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <p className="text-danger font-medium text-center px-6">{resolvedErrorMessage}</p>
                    <button onClick={onRetry} className="px-4 py-2 bg-text text-white rounded-lg text-sm font-medium hover:bg-text/90">
                      Try Again
                    </button>
                 </div>
              ) : data ? (
                <div className="bg-surface shadow-card rounded-xl overflow-hidden border border-border">
                   <div className="p-8 border-b border-border bg-gradient-to-r from-white to-primarySoft/30">
                      <h1 className="text-2xl font-bold text-primary mb-2">{data.title}</h1>
                      <p className="text-muted text-lg font-light leading-relaxed">{data.subtitle}</p>
                   </div>
                   
                   <div className="p-8 space-y-8">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                         {data.key_metrics.map((m, i) => (
                            <div key={i} className="p-4 bg-surface rounded-lg border border-border shadow-sm">
                               <dt className="text-xs font-bold uppercase tracking-wider text-muted mb-1">{m.label}</dt>
                               <dd className="text-xl font-bold text-text">{m.value}</dd>
                            </div>
                         ))}
                      </div>

                      {/* Bullets */}
                      <div>
                         <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Strategic Analysis</h3>
                         <ul className="space-y-3">
                            {data.bullets.map((b, i) => (
                               <li key={i} className="flex items-start gap-3 text-text leading-relaxed">
                                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span>{b}</span>
                               </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            {!isLoading && !error && data && (
               <div className="flex-shrink-0 p-6 border-t border-border bg-surface flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-border hover:bg-background text-muted font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primarySoft transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy Markdown'}
                  </button>
               </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
