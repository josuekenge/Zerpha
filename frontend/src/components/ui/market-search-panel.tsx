import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Mic, ArrowRight } from 'lucide-react';

interface MarketSearchPanelProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
}

function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);
  return ref;
}

export function MarketSearchPanel({ query, setQuery, onSearch }: MarketSearchPanelProps) {
  const textareaRef = useAutoResizeTextarea(query);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSearch();
      }
    },
    [onSearch],
  );

  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Subtle purple hint at top only */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(109,40,217,0.35) 0%, transparent 65%)' }} />
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 text-center mb-10"
      >
        <h2 className="font-display text-5xl md:text-6xl tracking-tight leading-[1.2] mb-4">
          <span className="text-white font-medium">What market are you </span>
          <span
            className="font-light italic bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #a78bfa, #c084fc, #7c3aed)' }}
          >
            scouting
          </span>
          <br />
          <span className="text-white font-medium">today?</span>
        </h2>
        <p className="text-white/40 text-base">
          Search verticals, competitors, or technologies.
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: 'rgba(18,18,22,0.90)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. B2B SaaS for Construction in Europe..."
            rows={3}
            autoFocus
            className="w-full resize-none bg-transparent px-6 pt-6 pb-4 text-base text-white placeholder:text-white/25 focus:outline-none font-body leading-relaxed min-h-[100px] max-h-[200px]"
          />

          <div className="flex items-center justify-between px-4 pb-4 pt-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Attach"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Voice"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onSearch}
              className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 transition-all"
            >
              Send
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
