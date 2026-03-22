import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Search,
  Crosshair,
  BarChart3,
  Users,
  Layers,
  FileOutput,
  GitBranch,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, signInWithGoogle } from '../lib/auth';
import { TypewriterEffect } from './TypewriterEffect';

const PENDING_SEARCH_KEY = 'pendingSearchQuery';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSearch = async () => {
    if (user) {
      if (searchQuery.trim()) {
        navigate(`/workspace?q=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate('/workspace');
      }
    } else {
      if (searchQuery.trim()) {
        try {
          sessionStorage.setItem(PENDING_SEARCH_KEY, searchQuery.trim());
        } catch {
          // sessionStorage might be unavailable
        }
      }
      setIsAuthLoading(true);
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Failed to initiate Google sign-in:', error);
        setIsAuthLoading(false);
        navigate('/login');
      }
    }
  };

  const handleArrowClick = () => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-indigo-400/30 selection:text-white font-body relative overflow-x-hidden">

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'circOut' }}
        className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-indigo-400">
              <span className="font-body font-extrabold text-[13px] text-[#09090b] leading-none">Z</span>
            </div>
            <span className="font-display font-medium text-lg text-white tracking-tight">Zerpha</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#capabilities" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">Capabilities</a>
            <a href="#how-it-works" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">How it works</a>
            <a href="#mission" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">Mission</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/workspace')}
                className="text-[13px] font-medium bg-white text-[#09090b] px-5 py-2 rounded-lg hover:bg-white/90 transition-all"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">Sign in</button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-[13px] font-medium bg-white text-[#09090b] px-5 py-2 rounded-lg hover:bg-white/90 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white/60 hover:text-white p-2"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-0 w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-white/[0.06] md:hidden"
          >
            <div className="flex flex-col p-6 space-y-3">
              <a href="#capabilities" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-white/50 hover:text-white py-2">Capabilities</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-white/50 hover:text-white py-2">How it works</a>
              <a href="#mission" onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-white/50 hover:text-white py-2">Mission</a>
              <div className="pt-4 border-t border-white/[0.06]">
                {user ? (
                  <button onClick={() => navigate('/workspace')} className="w-full text-center text-sm font-medium bg-white text-[#09090b] px-5 py-3 rounded-lg">
                    Go to Workspace
                  </button>
                ) : (
                  <button onClick={() => navigate('/login')} className="w-full text-center text-sm font-medium bg-white text-[#09090b] px-5 py-3 rounded-lg">
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ━━ HERO ━━ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-indigo-400/[0.07] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/50 mb-10"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Now in private beta
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-6xl lg:text-[5.5rem] font-display font-medium tracking-tight text-white leading-[1.05] mb-8"
          >
            The unfair advantage in{' '}
            <br className="hidden sm:block" />
            <TypewriterEffect
              words={["vertical SaaS.", "market intelligence.", "deal sourcing.", "private equity."]}
              className="text-indigo-400"
              cursorClassName="bg-indigo-400"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base sm:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed mb-14 px-4"
          >
            Discover, analyze, and score acquisition targets in minutes — not months.
            Purpose-built for the world's most ambitious serial acquirers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative w-full max-w-xl mx-auto"
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Search className="h-5 w-5 text-white/20" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAuthLoading && void handleSearch()}
              className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 pl-14 pr-16 text-white placeholder:text-white/20 focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/20 focus:bg-white/[0.06] sm:text-base transition-all outline-none font-body"
              placeholder="Search any vertical market..."
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <button
                type="button"
                onClick={handleArrowClick}
                disabled={!searchQuery.trim() || isAuthLoading}
                className={`inline-flex items-center justify-center rounded-lg px-3 py-2.5 transition-all ${searchQuery.trim() && !isAuthLoading
                  ? 'bg-indigo-400 hover:bg-indigo-300 text-[#09090b] cursor-pointer'
                  : 'bg-white/[0.06] text-white/20 cursor-not-allowed'
                  }`}
              >
                {isAuthLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8"
          >
            <button
              onClick={() => void handleSearch()}
              disabled={isAuthLoading}
              className={`inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-all font-body ${isAuthLoading
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white text-[#09090b] hover:bg-white/90'
                }`}
            >
              {isAuthLoading ? 'Connecting...' : 'Start discovering'}
              {!isAuthLoading && <ChevronRight className="h-4 w-4" />}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 flex items-center justify-center gap-6 text-[13px] text-white/25 font-body"
          >
            <span>Vertical SaaS discovery</span>
            <span className="text-white/10">·</span>
            <span>Acquisition fit scoring</span>
            <span className="text-white/10">·</span>
            <span>Pipeline & diligence</span>
          </motion.div>
        </div>
      </section>

      {/* ━━ PRODUCT PREVIEW — monospace / terminal-inspired ━━ */}
      <section className="relative pb-32 -mt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-400/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-3xl px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-xl border border-white/[0.06] bg-[#0f0f12] overflow-hidden font-mono text-[13px]"
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.07]" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.07]" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.07]" />
              </div>
              <span className="text-[11px] text-white/20 ml-2">zerpha — market intelligence</span>
            </div>

            {/* Terminal content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Query */}
              <div>
                <span className="text-white/25">$</span>
                <span className="text-indigo-400 ml-2">zerpha search</span>
                <span className="text-white/60 ml-2">"sustainable logistics"</span>
              </div>

              {/* Divider */}
              <div className="text-white/[0.06]">{'─'.repeat(50)}</div>

              {/* Results */}
              <div className="space-y-3">
                <div className="text-white/20 text-[11px] uppercase tracking-widest">Results · 3 targets found</div>

                {[
                  { name: 'EcoLogistics', domain: 'ecologistics.io', vertical: 'Carbon tracking · Freight', score: '9.2' },
                  { name: 'GreenRoute', domain: 'greenroute.com', vertical: 'EV fleet management', score: '8.5' },
                  { name: 'CargoFlow', domain: 'cargoflow.io', vertical: 'Supply chain visibility', score: '7.8' },
                ].map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.12 }}
                    className="flex items-baseline justify-between gap-4 py-2 border-b border-white/[0.03] last:border-0"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="text-white/70 font-medium shrink-0">{r.name}</span>
                      <span className="text-white/15 hidden sm:inline truncate">{r.domain}</span>
                    </div>
                    <div className="flex items-baseline gap-4 shrink-0">
                      <span className="text-white/20 hidden sm:inline text-[12px]">{r.vertical}</span>
                      <span className="text-indigo-400 font-medium">{r.score}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cursor */}
              <div className="pt-1">
                <span className="text-white/25">$</span>
                <span className="inline-block w-2 h-4 bg-indigo-400/60 ml-2 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━ CAPABILITIES ━━ */}
      <section id="capabilities" className="relative py-32 border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-20"
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em] mb-5 font-body">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-white leading-[1.1]">
              Find, evaluate, close.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Crosshair className="h-5 w-5" />,
                title: 'Market X-Ray',
                description: 'Surface hidden gems and rising players in any niche vertical that traditional databases miss.',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: 'Fit Scoring',
                description: 'Every target scored 0–10. Product overlap, market position, tech stack — all factored in.',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: 'Direct Outreach',
                description: 'Verified decision-maker contacts and extracted company intelligence. Start conversations immediately.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/20 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:bg-indigo-400 group-hover:text-[#09090b] transition-all duration-300 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white font-display mb-2">{feature.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed font-body">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ HOW IT WORKS ━━ */}
      <section id="how-it-works" className="relative py-32 border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-indigo-400/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-20"
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em] mb-5 font-body">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-white leading-[1.1]">
              Three steps. Full pipeline.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                icon: <Search className="h-5 w-5" />,
                title: 'Search a market',
                description: 'Type any niche. Zerpha maps the full competitive landscape and surfaces targets you won\'t find on Crunchbase.',
              },
              {
                step: '02',
                icon: <Layers className="h-5 w-5" />,
                title: 'Review scored targets',
                description: 'Deep profiles with product analysis, pricing, tech stack, headcount, strengths, risks, and acquisition fit scores.',
              },
              {
                step: '03',
                icon: <GitBranch className="h-5 w-5" />,
                title: 'Build your pipeline',
                description: 'Save targets, drag through diligence stages, extract contacts, and export reports for your investment committee.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 -right-6 w-12 h-px bg-white/[0.06]" />
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400 ring-1 ring-indigo-400/20">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-mono text-white/15 uppercase tracking-widest">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white font-display mb-2">{item.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed font-body">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ BUILT FOR SERIAL ACQUIRERS ━━ */}
      <section id="mission" className="relative py-32 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-400/[0.05] rounded-full blur-[150px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em] mb-6 font-body">For serious acquirers</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-white leading-[1.1] mb-8">
                Built for teams at{' '}
                <span className="text-indigo-400">Constellation</span>,{' '}
                <span className="text-indigo-400">Volaris</span>, and beyond.
              </h2>
              <p className="text-base text-white/35 leading-relaxed mb-10 font-body max-w-lg">
                When you're evaluating hundreds of vertical SaaS targets a year, speed and signal quality are everything.
                Zerpha replaces months of manual screening with structured intelligence you can act on.
              </p>
              <button
                onClick={() => void handleSearch()}
                disabled={isAuthLoading}
                className={`inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-semibold transition-all font-body ${isAuthLoading
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white text-[#09090b] hover:bg-white/90'
                  }`}
              >
                {isAuthLoading ? 'Connecting...' : 'Start Discovering Targets'}
                {!isAuthLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {[
                {
                  icon: <Crosshair className="h-4 w-4" />,
                  title: 'Minutes, not months',
                  description: 'Enter a niche. Get 5–20 scored, analyzed targets with full competitive context.',
                },
                {
                  icon: <GitBranch className="h-4 w-4" />,
                  title: 'Pipeline built-in',
                  description: 'Drag targets through diligence stages. Notes, history, everything tracked.',
                },
                {
                  icon: <Users className="h-4 w-4" />,
                  title: 'Team workspaces',
                  description: 'Share research, pipeline, and insights across your acquisition team.',
                },
                {
                  icon: <FileOutput className="h-4 w-4" />,
                  title: 'Export-ready reports',
                  description: 'Presentation-quality company profiles ready for your IC deck.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400/60 group-hover:text-indigo-400 transition-colors mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white font-display mb-1">{item.title}</h3>
                    <p className="text-sm text-white/25 leading-relaxed font-body">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━ FINAL CTA ━━ */}
      <section className="relative py-32 border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-400/[0.06] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-white leading-[1.1] mb-6">
              Ready to move faster?
            </h2>
            <p className="text-base text-white/35 leading-relaxed mb-10 font-body">
              Join the acquirers who are already using Zerpha to find their next platform investment.
            </p>
            <button
              onClick={() => void handleSearch()}
              disabled={isAuthLoading}
              className={`inline-flex items-center gap-2 rounded-lg px-8 py-4 text-sm font-semibold transition-all font-body ${isAuthLoading
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white text-[#09090b] hover:bg-white/90'
                }`}
            >
              {isAuthLoading ? 'Connecting...' : 'Get started for free'}
              {!isAuthLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ━━ FOOTER ━━ */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-400">
                <span className="font-body font-extrabold text-[11px] text-[#09090b] leading-none">Z</span>
              </div>
              <span className="text-sm font-medium text-white font-display">Zerpha</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30 font-body">
              <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a>
              <p>&copy; {new Date().getFullYear()} Zerpha Inc.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
