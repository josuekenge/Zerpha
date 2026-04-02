import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { AtSignIcon, ChevronLeftIcon } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, useAuth } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';

export function AuthPage() {
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
    <main className="relative bg-[#07070e] text-white md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left decorative panel */}
      <div className="relative hidden h-full flex-col border-r border-white/[0.06] bg-[#07070e] p-10 lg:flex">
        {/* All-around violet gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 120% 60% at 50% 0%, rgba(109,40,217,0.50) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(109,40,217,0.35) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 120% at 0% 50%, rgba(91,33,182,0.30) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 120% at 100% 50%, rgba(91,33,182,0.30) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(109,40,217,0.15) 0%, transparent 70%)'}} />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#07070e]/60 to-transparent" />
        <div className="z-10 flex items-center gap-2">
          <ZerphaLogo />
          <p className="font-display text-xl font-medium text-zinc-100">Zerpha</p>
        </div>
        <div className="z-10 mt-auto">
          <blockquote className="space-y-3">
            <p className="text-xl leading-relaxed text-white/90">
              &ldquo;We closed two platform deals in 90 days using Zerpha.
              The signal quality is unlike anything we&rsquo;ve seen from
              traditional databases.&rdquo;
            </p>
            <footer className="space-y-0.5">
              <p className="text-sm font-semibold text-white/80">Marcus Holt</p>
              <p className="font-mono text-xs text-white/35">Principal, Tier 1 PE Fund</p>
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-col justify-center p-4">
        {/* All-around violet gradient — right panel */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 120% 60% at 50% 0%, rgba(109,40,217,0.45) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(109,40,217,0.30) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 120% at 0% 50%, rgba(91,33,182,0.25) 0%, transparent 60%)'}} />
          <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 120% at 100% 50%, rgba(91,33,182,0.25) 0%, transparent 60%)'}} />
        </div>

        <Button
          variant="ghost"
          className="absolute left-5 top-7 text-white/60 hover:text-white"
          asChild
        >
          <a href="/">
            <ChevronLeftIcon className="me-2 size-4" />
            Home
          </a>
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-4">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <ZerphaLogo />
            <p className="font-display text-xl font-medium text-zinc-100">Zerpha</p>
          </div>

          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-medium tracking-tight text-zinc-100">
              Sign In or Join Now!
            </h1>
            <p className="text-sm text-zinc-400">
              login or create your zerpha account.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-400/20 bg-indigo-400/[0.06] p-4">
                <p className="mb-1 text-sm font-medium text-white">
                  Check your email
                </p>
                <p className="text-xs text-white/40">
                  We sent a magic link to{' '}
                  <strong className="text-white/60">{email}</strong>. Click the
                  link to sign in.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full text-indigo-400 hover:text-indigo-300"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                  setError(null);
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <GoogleIcon className="me-2 size-4" />
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>
              </div>

              <AuthSeparator />

              <form className="space-y-2" onSubmit={handleEmailSubmit}>
                <p className="text-start text-xs text-zinc-500">
                  Enter your email address to sign in or create an account
                </p>
                <div className="relative h-max">
                  <Input
                    placeholder="your.email@example.com"
                    className="peer ps-9"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-zinc-500 peer-disabled:opacity-50">
                    <AtSignIcon className="size-4" aria-hidden="true" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <span>{isLoading ? 'Sending...' : 'Continue With Email'}</span>
                </Button>
              </form>
            </>
          )}

          <p className="mt-8 text-sm text-zinc-400">
            By clicking continue, you agree to our{' '}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-white"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-white"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function ZerphaLogo() {
  return (
    <span className="text-2xl font-bold leading-none bg-gradient-to-r from-violet-400 via-purple-400 to-violet-600 bg-clip-text text-transparent">
      Z
    </span>
  );
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.05 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
      fill="#4285F4"
    />
    <path
      d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z"
      fill="#34A853"
    />
    <path
      d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z"
      fill="#FBBC05"
    />
    <path
      d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z"
      fill="#EA4335"
    />
  </svg>
);

const AuthSeparator = () => (
  <div className="flex w-full items-center justify-center">
    <div className="h-px w-full bg-zinc-800" />
    <span className="px-3 text-[11px] font-medium uppercase tracking-widest text-zinc-600">or</span>
    <div className="h-px w-full bg-zinc-800" />
  </div>
);
