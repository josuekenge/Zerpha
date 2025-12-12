import { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';

export function WorkspaceSettings() {
    const [workspaceName, setWorkspaceName] = useState('Zerpha Intelligence');
    const [inviteEmail, setInviteEmail] = useState('');

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Workspace Details"
                description="Manage your workspace identity and branding."
            >
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg bg-indigo-600 flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-2xl font-bold text-white">Z</span>
                        </div>
                        <button className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center w-full gap-1">
                            <Upload className="w-3 h-3" />
                            Upload Logo
                        </button>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Workspace Name</label>
                            <input
                                type="text"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Team Members"
                description="Manage access and roles for your team."
                action={
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">2 / 5 seats used</span>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Invite
                        </button>
                    </div>

                    <div className="space-y-3">
                        {[
                            { name: 'Josue Kenge', email: 'josue@zerpha.com', role: 'Owner', initial: 'J' },
                            { name: 'Sarah Miller', email: 'sarah@zerpha.com', role: 'Admin', initial: 'S' },
                        ].map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                        {member.initial}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        className="text-xs font-medium text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                                        defaultValue={member.role}
                                    >
                                        <option>Owner</option>
                                        <option>Admin</option>
                                        <option>Member</option>
                                        <option>Viewer</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
