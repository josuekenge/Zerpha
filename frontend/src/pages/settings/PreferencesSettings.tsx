import { useState } from 'react';
import { Moon, Sun, Layout, Eye } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';
import { useTheme } from '../../lib/theme';

export function PreferencesSettings() {
    const { theme, setTheme } = useTheme();
    const [compactMode, setCompactMode] = useState(false);
    const [showFavicons, setShowFavicons] = useState(true);

    const isDark = theme === 'dark';

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Appearance"
                description="Customize how Zerpha looks and feels."
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                {isDark ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Theme Mode</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isDark ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isDark ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Layout className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Table Density</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the spacing in data tables</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setCompactMode(false)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!compactMode ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Comfortable
                            </button>
                            <button
                                onClick={() => setCompactMode(true)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${compactMode ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Compact
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Show Favicons</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Display company logos in lists</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFavicons(!showFavicons)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${showFavicons ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showFavicons ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
