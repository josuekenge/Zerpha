import { useState, useEffect } from 'react';
import { Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '../lib/auth';
import { useAuth } from '../lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const redirectTarget =
    (location.state as { from?: string } | null)?.from ?? '/workspace';

  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // OAuth redirect will happen, so onSuccess won't be called here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim());
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 h-screen flex flex-col items-center justify-center antialiased selection:bg-indigo-100 selection:text-indigo-700 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[400px] z-10 px-4">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-6 p-2">
            <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            Enter your credentials to access your<br />scouting workspace.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/40 p-6 sm:p-8">

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-900 font-medium mb-1">Check your email</p>
                <p className="text-xs text-indigo-700">
                  We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
                </p>
              </div>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setError(null);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google Login Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="group w-full flex items-center justify-center gap-3 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
                  <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"></path>
                  <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
                  <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"></path>
                </svg>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">Or with email</span>
                </div>
              </div>

              {/* Email Login */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign in with Email <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-slate-500">
            Don't have an account?
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors ml-1">Request access</a>
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* Bottom Corner Help */}
      <button className="absolute bottom-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-200 hover:text-slate-600 hover:border-slate-300 transition-all">
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

