import { Moon, Sun, Eye } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';
import { useTheme } from '../../lib/theme';
import { useState } from 'react';

export function PreferencesSettings() {
    const { theme, setTheme } = useTheme();
    const [showFavicons, setShowFavicons] = useState(true);

    const isDark = theme === 'dark';

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Appearance"
                description="Customize how Zerpha looks and feels."
            >
                <div className="space-y-4">
                    {/* Theme Mode */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/[0.06] rounded-lg">
                                {isDark ? <Moon className="w-5 h-5 text-white/60" /> : <Sun className="w-5 h-5 text-white/60" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">Theme Mode</h4>
                                <p className="text-sm text-white/60">Switch between light and dark themes</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-white/[0.06] rounded-lg p-1">
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isDark ? 'bg-white/[0.1] text-white' : 'text-white/30 hover:text-white/60'
                                    }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isDark ? 'bg-white/[0.1] text-white' : 'text-white/30 hover:text-white/60'
                                    }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06]" />

                    {/* Show Favicons */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/[0.06] rounded-lg">
                                <Eye className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">Show Favicons</h4>
                                <p className="text-sm text-white/60">Display company logos in lists</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFavicons(!showFavicons)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#09090b] ${showFavicons ? 'bg-indigo-600' : 'bg-white/[0.12]'
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
