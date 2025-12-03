import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

export function DashboardParticles() {
    // Generate random particles with stable random values
    const particles = useMemo(() => {
        return Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            width: Math.random() * 200 + 50, // 50-250px
            height: Math.random() * 200 + 50,
            x: Math.random() * 120 - 10, // -10% to 110%
            y: Math.random() * 120 - 10, // -10% to 110%
            duration: Math.random() * 20 + 10, // 10-30s
            delay: Math.random() * 5,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className={cn(
                        "absolute rounded-full blur-2xl mix-blend-normal",
                        particle.id % 3 === 0 ? "bg-indigo-300/40" :
                            particle.id % 3 === 1 ? "bg-purple-300/40" : "bg-blue-300/40"
                    )}
                    style={{
                        width: particle.width,
                        height: particle.height,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay,
                    }}
                />
            ))}
        </div>
    );
}
