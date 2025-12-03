import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
    words: string[];
    className?: string;
    cursorClassName?: string;
}

export function TypewriterEffect({
    words,
    className = "",
    cursorClassName = "bg-indigo-600"
}: TypewriterEffectProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                setCurrentText(word.substring(0, currentText.length + 1));

                // Finished typing
                if (currentText.length === word.length) {
                    setTimeout(() => setIsDeleting(true), 2000); // Wait before deleting
                }
            } else {
                // Deleting
                setCurrentText(word.substring(0, currentText.length - 1));

                // Finished deleting
                if (currentText.length === 0) {
                    setIsDeleting(false);
                    setCurrentWordIndex((prev) => (prev + 1) % words.length);
                }
            }
        }, isDeleting ? 50 : 100); // Typing speed vs deleting speed

        return () => clearTimeout(timeout);
    }, [currentText, isDeleting, currentWordIndex, words]);

    return (
        <span className={className}>
            {currentText}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className={`inline-block w-[3px] h-[1em] ml-1 align-middle ${cursorClassName}`}
            />
        </span>
    );
}
