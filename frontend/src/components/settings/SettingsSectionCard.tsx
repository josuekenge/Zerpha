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
        <div className={cn("bg-[#0e0e11] rounded-xl border border-white/[0.06] overflow-hidden", className)}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-white/60 mt-1">{description}</p>
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
