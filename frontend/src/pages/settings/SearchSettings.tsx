import { useState } from 'react';
import { Search, Layers } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';

export function SearchSettings() {
    const [maxCompanies, setMaxCompanies] = useState('10');
    const [allowDuplicates, setAllowDuplicates] = useState(false);
    const [preferSaaS, setPreferSaaS] = useState(true);
    const [randomness, setRandomness] = useState(30);

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Search Configuration"
                description="Fine-tune how the discovery engine finds companies."
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Companies per Search</label>
                            <select
                                value={maxCompanies}
                                onChange={(e) => setMaxCompanies(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-white"
                            >
                                <option value="5">5 Companies</option>
                                <option value="10">10 Companies</option>
                            </select>
                            <p className="text-xs text-slate-500 dark:text-slate-400">More results may take longer to generate.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Discovery Randomness</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={randomness}
                                    onChange={(e) => setRandomness(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8">{randomness}%</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Higher randomness finds more niche/unexpected results.</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Layers className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Allow Duplicates</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Show companies you've already seen in new searches</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAllowDuplicates(!allowDuplicates)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${allowDuplicates ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowDuplicates ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Prefer Vertical SaaS</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Prioritize Vertical SaaS companies in results</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferSaaS(!preferSaaS)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${preferSaaS ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferSaaS ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
