import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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
    <div className="bg-[#09090b] text-white h-screen flex flex-col items-center justify-center antialiased selection:bg-indigo-400/20 selection:text-indigo-300 relative overflow-hidden font-body">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-indigo-400/[0.06] blur-[140px]" />
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[380px] z-10 px-4">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-indigo-400 mb-6">
            <span className="font-body font-extrabold text-[14px] text-[#09090b] leading-none">Z</span>
          </div>
          <h1 className="text-xl font-display font-medium tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-[13px] text-white/35 text-center leading-relaxed">
            Sign in to access your scouting workspace.
          </p>
        </div>

        {/* Card */}
        <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6 sm:p-8">

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-indigo-400/[0.06] border border-indigo-400/20 rounded-lg">
                <p className="text-sm text-white font-medium mb-1">Check your email</p>
                <p className="text-xs text-white/40">
                  We sent a magic link to <strong className="text-white/60">{email}</strong>. Click the link to sign in.
                </p>
              </div>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setError(null);
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
                className="group w-full flex items-center justify-center gap-3 bg-white text-[#09090b] hover:bg-white/90 px-4 py-2.5 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                  <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                  <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                  <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                </svg>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#09090b] px-3 text-white/20 font-medium tracking-widest">or</span>
                </div>
              </div>

              {/* Email Login */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[11px] font-medium text-white/40 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-indigo-400/40 focus:outline-none focus:ring-1 focus:ring-indigo-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-body"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white px-4 py-2.5 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign in with Email <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-[11px] text-white/20">
            <a href="/terms" className="hover:text-white/40 transition-colors">Terms</a>
            <span className="text-white/10">·</span>
            <a href="/privacy" className="hover:text-white/40 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
