import { useState, useEffect } from 'react';
import { Camera, Shield, Key } from 'lucide-react';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';
import { useAuth } from '../../lib/auth';

export function AccountSettings() {
    const { user } = useAuth();
    const isGoogleUser = user?.app_metadata?.provider === 'google';

    const [name, setName] = useState(user?.user_metadata?.full_name || 'Josue Kenge');
    const [email, setEmail] = useState(user?.email || 'josue@zerpha.com');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    // Update state when user loads (if initially null or changed)
    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || user.email?.split('@')[0] || name);
            setEmail(user.email || email);
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Profile Information"
                description="Update your personal information and profile photo."
            >
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-semibold text-slate-400">
                                        {name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    readOnly={isGoogleUser}
                                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isGoogleUser ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Security"
                description="Manage your password and security preferences."
            >
                <div className="space-y-6">
                    {isGoogleUser && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-blue-900">Account Secured by Google</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    Your account is secured by Google. Manage passwords and 2FA in your Google Account.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-center justify-between py-1 ${isGoogleUser ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Key className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Password</h4>
                                <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                            </div>
                        </div>
                        <button
                            disabled={isGoogleUser}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Change Password
                        </button>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    <div className={`flex items-center justify-between py-1 ${isGoogleUser ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Shield className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Two-Factor Authentication</h4>
                                <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            disabled={isGoogleUser}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
