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
export function FitScoreBar({ score, showLabel = false, size = 'md' }: FitScoreBarProps) {
    const displayScore = score ?? 0;
    const percentage = Math.min((displayScore / 10) * 100, 100);

    // Determine color based on score tier
    let barColor = 'bg-slate-300'; // No score / 0
    let textColor = 'text-slate-400';
    let label = '';

    if (score !== null && score > 0) {
        if (score >= 7.5) {
            barColor = 'bg-teal-600';
            textColor = 'text-teal-700';
            label = 'High';
        } else if (score >= 5) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-600';
            label = 'Medium';
        } else {
            barColor = 'bg-red-500';
            textColor = 'text-red-600';
            label = 'Low';
        }
    }

    const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

    return (
        <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className={cn("flex-1 bg-slate-100 rounded-full overflow-hidden", barHeight, size === 'sm' ? 'min-w-[40px] max-w-[60px]' : 'min-w-[60px] max-w-[80px]')}>
                <div
                    className={cn("h-full rounded-full transition-all duration-300", barColor)}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Score number */}
            <span className={cn("font-semibold tabular-nums", textSize, textColor)}>
                {score !== null ? score.toFixed(1) : '0.0'}
            </span>

            {/* Optional label */}
            {showLabel && label && (
                <span className={cn("text-xs font-medium", textColor)}>
                    {label}
                </span>
            )}
        </div>
    );
}
