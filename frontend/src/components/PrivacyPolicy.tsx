import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <button
                    onClick={() => navigate('/')}
                    className="group mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-8">Privacy Policy</h1>

                    <div className="prose prose-slate max-w-none">
                        <p className="lead text-lg text-slate-600 mb-8">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Introduction</h2>
                        <p className="text-slate-600 mb-4">
                            Zerpha ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Data We Collect</h2>
                        <p className="text-slate-600 mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-5 text-slate-600 mb-4 space-y-2">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. How We Use Your Data</h2>
                        <p className="text-slate-600 mb-4">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-5 text-slate-600 mb-4 space-y-2">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Data Security</h2>
                        <p className="text-slate-600 mb-4">
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
                        <p className="text-slate-600 mb-4">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at support@zerpha.com.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
