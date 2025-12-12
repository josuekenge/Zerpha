import {
    User,
    Building2,
    Settings,
    Search,
    FileText,
    Bell,
    Shield,
    ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SettingsTab =
    | 'account'
    | 'workspace'
    | 'preferences'
    | 'search'
    | 'reports'
    | 'notifications'
    | 'privacy';

interface SettingsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
    const menuItems = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'workspace', label: 'Workspace', icon: Building2 },
        { id: 'preferences', label: 'Preferences', icon: Settings },
        { id: 'search', label: 'Search Behavior', icon: Search },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ] as const;

    return (
        <nav className="w-64 flex-shrink-0">
            <div className="space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                                {item.label}
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4 text-indigo-500" />}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
