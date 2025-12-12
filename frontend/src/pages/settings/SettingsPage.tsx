import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SettingsSidebar, SettingsTab } from '../../components/settings/SettingsSidebar';
import { AccountSettings } from './AccountSettings';
import { WorkspaceSettings } from './WorkspaceSettings';
import { PreferencesSettings } from './PreferencesSettings';
import { SearchSettings } from './SearchSettings';
import { ReportSettings } from './ReportSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';

export function SettingsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return <AccountSettings />;
            case 'workspace':
                return <WorkspaceSettings />;
            case 'preferences':
                return <PreferencesSettings />;
            case 'search':
                return <SearchSettings />;
            case 'reports':
                return <ReportSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'privacy':
                return <PrivacySettings />;
            default:
                return <AccountSettings />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="flex-1 min-w-0">
                        <div className="max-w-3xl">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
