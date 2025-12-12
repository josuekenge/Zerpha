import { useState } from 'react';
import { FileText, CheckSquare } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';

export function ReportSettings() {
    const [theme, setTheme] = useState('detailed');
    const [includeStrengths, setIncludeStrengths] = useState(true);
    const [includeRisks, setIncludeRisks] = useState(true);
    const [includeCompetitors, setIncludeCompetitors] = useState(true);
    const [autoSave, setAutoSave] = useState(false);

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Report Generation"
                description="Customize the content and style of your generated reports."
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Default Slide Deck Theme</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setTheme('simple')}
                                className={`p-4 border rounded-xl text-left transition-all ${theme === 'simple'
                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="h-20 bg-white border border-slate-100 rounded mb-3 p-2">
                                    <div className="w-1/2 h-2 bg-slate-100 rounded mb-2"></div>
                                    <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                                </div>
                                <p className="text-sm font-medium text-slate-900">Simple & Clean</p>
                                <p className="text-xs text-slate-500">Minimalist design focused on data</p>
                            </button>

                            <button
                                onClick={() => setTheme('detailed')}
                                className={`p-4 border rounded-xl text-left transition-all ${theme === 'detailed'
                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="h-20 bg-slate-900 border border-slate-800 rounded mb-3 p-2">
                                    <div className="w-1/2 h-2 bg-slate-700 rounded mb-2"></div>
                                    <div className="w-3/4 h-2 bg-slate-700 rounded"></div>
                                </div>
                                <p className="text-sm font-medium text-slate-900">Detailed Dark</p>
                                <p className="text-xs text-slate-500">Rich visuals with dark mode style</p>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900">Content Sections</h4>

                        <div className="space-y-3">
                            {[
                                { label: 'Include Strengths Analysis', checked: includeStrengths, set: setIncludeStrengths },
                                { label: 'Include Risk Assessment', checked: includeRisks, set: setIncludeRisks },
                                { label: 'Include Competitor Landscape', checked: includeCompetitors, set: setIncludeCompetitors },
                            ].map((item, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                        }`}>
                                        {item.checked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={item.checked}
                                        onChange={() => item.set(!item.checked)}
                                    />
                                    <span className="text-sm text-slate-700">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Auto-save Reports</h4>
                                <p className="text-sm text-slate-500">Automatically save generated reports to workspace</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAutoSave(!autoSave)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${autoSave ? 'bg-indigo-600' : 'bg-slate-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
