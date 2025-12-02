import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, Search, Database, Brain } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LOADING_STEPS = [
  { text: "Scanning the vertical", icon: Search },
  { text: "Reading company signals", icon: Database },
  { text: "Analyzing with Claude 3.5", icon: Brain },
  { text: "Scoring acquisition fit", icon: Sparkles }
];

export function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center"
        >
          {/* Elegant Pulse Animation */}
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <span className="absolute w-full h-full border-2 border-indigo-100 rounded-full animate-[ping_3s_linear_infinite]"></span>
            <span className="absolute w-24 h-24 border-2 border-indigo-200 rounded-full animate-[ping_3s_linear_infinite_1s]"></span>
            <div className="relative w-4 h-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 z-10">
              <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
            </div>
            
            {/* Rotating Ring */}
            <div className="absolute w-16 h-16 border-2 border-transparent border-t-indigo-600/30 border-l-indigo-600/30 rounded-full animate-spin"></div>
          </div>

          <div className="h-12 relative w-full max-w-md flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute flex items-center gap-3 text-slate-900 font-medium text-lg"
              >
                {(() => {
                  const StepIcon = LOADING_STEPS[stepIndex].icon;
                  return <StepIcon className="w-5 h-5 text-indigo-600 animate-pulse" />;
                })()}
                <span className="tracking-tight">{LOADING_STEPS[stepIndex].text}...</span>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            className="mt-8 flex gap-1.5"
          >
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
