import React from 'react';
import { cn } from '../../lib/utils';

interface SettingsSectionCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export function SettingsSectionCard({
    title,
    description,
    children,
    className,
    action,
}: SettingsSectionCardProps) {
    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", className)}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
