import { useState } from 'react';
import { Mail, Calendar, BarChart } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';

export function NotificationSettings() {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(true);
    const [monthlyInsights, setMonthlyInsights] = useState(false);

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Email Notifications"
                description="Manage what emails you receive from Zerpha."
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Report Ready Alerts</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when your PDF reports are ready</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEmailAlerts(!emailAlerts)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${emailAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Weekly Summary</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">A weekly digest of new companies in your sector</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setWeeklySummary(!weeklySummary)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${weeklySummary ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weeklySummary ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <BarChart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Monthly Insights</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Deep dive analysis of market trends</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMonthlyInsights(!monthlyInsights)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${monthlyInsights ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${monthlyInsights ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
