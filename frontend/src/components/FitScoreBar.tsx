import { cn } from '../lib/utils';

interface FitScoreBarProps {
    score: number | null;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

/**
 * FitScoreBar - A progress bar style fit score indicator
 * Colors:
 * - High (7.5+): Teal #0D9488
 * - Medium (5-7.4): Amber #D97706
 * - Low (<5): Coral #DC2626
 * - No score (0): Gray #94A3B8
 */
export function FitScoreBar({ score, size = 'md' }: FitScoreBarProps) {
    const displayScore = score ?? 0;
    const percentage = Math.min((displayScore / 10) * 100, 100);

    // Determine color based on score tier
    let barColor = 'bg-slate-300'; // No score / 0
    let textColor = 'text-slate-500';

    if (score !== null && score > 0) {
        if (score >= 7.5) {
            barColor = 'bg-teal-500';
            textColor = 'text-slate-700';
        } else if (score >= 5) {
            barColor = 'bg-amber-500';
            textColor = 'text-slate-700';
        } else {
            barColor = 'bg-red-500';
            textColor = 'text-slate-700';
        }
    }

    const barHeight = size === 'sm' ? 'h-1' : 'h-1.5';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    const barWidth = size === 'sm' ? 'w-[50px]' : 'w-[70px]';

    return (
        <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className={cn("bg-slate-100 rounded-full overflow-hidden", barHeight, barWidth)}>
                <div
                    className={cn("h-full rounded-full transition-all duration-300", barColor)}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Score number */}
            <span className={cn("font-medium tabular-nums", textSize, textColor)}>
                {score !== null ? score.toFixed(1) : '0.0'}
            </span>
        </div>
    );
}
