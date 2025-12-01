import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LOADING_STEPS = [
  "Scanning the vertical",
  "Analyzing company signals",
  "Scoring acquisition fit"
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
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center text-text"
        >
          {/* Blue Pulsing Loader */}
          <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
             <span className="absolute inset-0 rounded-full bg-primary opacity-10 animate-ping"></span>
             <span className="absolute inset-4 rounded-full bg-primary opacity-20 animate-pulse"></span>
             <div className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/30"></div>
          </div>

          <div className="h-8 overflow-hidden relative w-full max-w-md text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-medium text-text tracking-wide"
              >
                {LOADING_STEPS[stepIndex]}...
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
