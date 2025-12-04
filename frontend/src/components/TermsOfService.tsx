import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfService() {
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-8">Terms of Service</h1>

                    <div className="prose prose-slate max-w-none">
                        <p className="lead text-lg text-slate-600 mb-8">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Agreement to Terms</h2>
                        <p className="text-slate-600 mb-4">
                            By accessing or using the Zerpha website and services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Use of Services</h2>
                        <p className="text-slate-600 mb-4">
                            You agree to use Zerpha only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Intellectual Property</h2>
                        <p className="text-slate-600 mb-4">
                            The Service and its original content, features, and functionality are and will remain the exclusive property of Zerpha and its licensors. The Service is protected by copyright, trademark, and other laws.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Termination</h2>
                        <p className="text-slate-600 mb-4">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Limitation of Liability</h2>
                        <p className="text-slate-600 mb-4">
                            In no event shall Zerpha, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Changes to Terms</h2>
                        <p className="text-slate-600 mb-4">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                        </p>

                        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">7. Contact Us</h2>
                        <p className="text-slate-600 mb-4">
                            If you have any questions about these Terms, please contact us at support@zerpha.com.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
