import { Download, History, AlertTriangle } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';

export function PrivacySettings() {
    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Data Management"
                description="Control your data and export options."
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Download className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Export All Data</h4>
                                <p className="text-sm text-slate-500">Download a copy of all your saved companies and reports</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                            Export CSV
                        </button>
                    </div>

                    <div className="border-t border-slate-100" />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <History className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Clear Search History</h4>
                                <p className="text-sm text-slate-500">Remove all past searches from your account</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
                            Clear History
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Active Sessions"
                description="Manage devices where you're currently logged in."
            >
                <div className="space-y-4">
                    {[
                        { device: 'Chrome on Windows', location: 'New York, USA', time: 'Current Session', active: true },
                        { device: 'Safari on iPhone', location: 'New York, USA', time: 'Last active 2 hours ago', active: false },
                    ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-900">{session.device}</p>
                                    {session.active && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">{session.location} • {session.time}</p>
                            </div>
                            {!session.active && (
                                <button className="text-xs text-slate-500 hover:text-red-600">Revoke</button>
                            )}
                        </div>
                    ))}
                </div>
            </SettingsSectionCard>

            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-700 mt-1 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
