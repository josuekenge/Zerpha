import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Search,
  Download,
  Settings,
  Sparkles,
  FileText,
  Zap,
  Target,
  Check,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, signInWithGoogle } from '../lib/auth';
import { TypewriterEffect } from './TypewriterEffect';
import { AboutMe } from './AboutMe';

// Storage key for pending search query (used to persist search across auth flow)
const PENDING_SEARCH_KEY = 'pendingSearchQuery';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSearch = async () => {
    if (user) {
      // User is authenticated - navigate directly to workspace with query
      if (searchQuery.trim()) {
        navigate(`/workspace?q=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate('/workspace');
      }
    } else {
      // User is NOT authenticated - save query and trigger Google OAuth
      if (searchQuery.trim()) {
        try {
          sessionStorage.setItem(PENDING_SEARCH_KEY, searchQuery.trim());
        } catch {
          // sessionStorage might be unavailable in some contexts, proceed anyway
        }
      }

      setIsAuthLoading(true);
      try {
        await signInWithGoogle();
        // Note: signInWithGoogle redirects to Google OAuth, so we won't reach here normally
      } catch (error) {
        console.error('Failed to initiate Google sign-in:', error);
        setIsAuthLoading(false);
        // Fallback: navigate to login page if OAuth fails
        navigate('/login');
      }
    }
  };

  const handleArrowClick = () => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-stone-800 selection:text-white font-body bg-noise relative overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "circOut" }}
        className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 cursor-pointer">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/');
              }}
            >
              <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-xl shadow-stone-900/10 p-2">
                <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full invert brightness-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-medium tracking-tight text-xl leading-none text-stone-900">Zerpha</span>
                <span className="text-stone-500 text-[10px] font-bold tracking-widest uppercase leading-none mt-1">Intelligence</span>
              </div>
            </motion.div>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors font-body">Vision</a>
            <a href="#capabilities" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors font-body">Capabilities</a>
            <a href="#about" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors font-body">About</a>
            <a href="#mission" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors font-body">Mission</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/workspace')}
                className="text-sm font-medium bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block">Sign in</button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold bg-stone-900 text-stone-50 px-6 py-2.5 rounded-lg hover:bg-stone-800 transition-all hover:shadow-lg hover:shadow-stone-900/25 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 font-body"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl md:hidden z-40"
          >
            <div className="flex flex-col p-6 space-y-4">
              <a href="#vision" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-100">Vision</a>
              <a href="#capabilities" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-100">Capabilities</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-100">About</a>
              <a href="#mission" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-100">Mission</a>

              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <button
                    onClick={() => navigate('/workspace')}
                    className="w-full text-center text-sm font-medium bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    Go to Workspace
                  </button>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Sign in</button>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full text-center text-sm font-medium bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      <main className="relative isolate pt-20">
        {/* Emotional Gradient Background - More Organic/Subtle */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-sky-200/20 rounded-full blur-[120px] opacity-40 mix-blend-multiply animate-blob" />
          <div className="absolute top-0 right-0 w-[900px] h-[700px] bg-stone-200/40 rounded-full blur-[120px] opacity-40 mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-0 w-[900px] h-[700px] bg-orange-100/30 rounded-full blur-[120px] opacity-40 mix-blend-multiply animate-blob animation-delay-4000" />
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
              <div className="relative rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-stone-500 ring-1 ring-stone-900/5 bg-stone-50/50 backdrop-blur-md shadow-sm cursor-default">
                Powered by <span className="font-bold text-stone-800">Claude 4.5</span> & <span className="font-bold text-stone-800">Gemini 3 Pro</span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-display font-medium tracking-tight text-stone-900 lg:text-8xl mb-6 leading-[1.1]"
            >
              Build the Future of <br />
              <TypewriterEffect
                words={["Vertical SaaS.", "Market Intelligence.", "Deal Sourcing.", "Private Equity."]}
                className="text-stone-400"
                cursorClassName="bg-stone-900"
              />
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-10 text-lg sm:text-xl leading-relaxed text-stone-600 max-w-2xl mx-auto font-body px-4">
              Don't just find companies. Discover ecosystems. Zerpha transforms chaotic market signals into clear, actionable strategies for the boldest builders.
            </motion.p>

            {/* Search Simulation - Emotional/Visionary */}
            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center">
              <div className="relative w-full max-w-xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Search className="h-5 w-5 text-stone-400 stroke-[2]" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAuthLoading && void handleSearch()}
                    className="block w-full rounded-2xl border-0 py-5 pl-14 pr-20 text-stone-900 shadow-xl shadow-stone-900/5 ring-1 ring-inset ring-stone-200/50 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-400 sm:text-lg sm:leading-6 bg-white transition-all font-body font-normal"
                    placeholder='What market will you disrupt today?'
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={handleArrowClick}
                      disabled={!searchQuery.trim() || isAuthLoading}
                      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-white transition-all shadow-sm ${searchQuery.trim() && !isAuthLoading
                        ? 'bg-stone-900 hover:bg-stone-800 cursor-pointer'
                        : 'bg-stone-200 cursor-not-allowed text-stone-400'
                        }`}
                    >
                      {isAuthLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-8 px-4">
              <button
                onClick={() => void handleSearch()}
                disabled={isAuthLoading}
                className={`w-full sm:w-auto rounded-xl px-8 py-4 text-base font-semibold text-white shadow-xl shadow-stone-900/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${isAuthLoading ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800 hover:scale-[1.01]'
                  }`}
              >
                {isAuthLoading ? 'Connecting...' : 'Start Your Journey'}
              </button>
            </motion.div>
          </motion.div>

          {/* Product Dashboard Mockup - Floating & Glassy */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="mt-24 flow-root sm:mt-32 perspective-1000"
          >
            <div className="-m-2 rounded-2xl bg-stone-100/50 p-2 ring-1 ring-inset ring-stone-900/5 lg:-m-4 lg:rounded-3xl lg:p-4 bg-white/40 backdrop-blur-xl shadow-2xl">
              <div className="rounded-xl bg-white ring-1 ring-stone-200 shadow-sm overflow-hidden">
                {/* Dashboard Header */}
                <div className="border-b border-stone-100 bg-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-sm sm:text-base font-display font-semibold text-stone-900">Market Intelligence: "Sustainable Logistics"</h3>
                    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-200">High Opportunity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-stone-400 hover:text-stone-900 transition-colors"><Download className="h-4 w-4" /></button>
                    <button className="text-stone-400 hover:text-stone-900 transition-colors"><Settings className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Global Insights (Condensed) */}
                <div className="px-6 py-5 bg-stone-50/50 border-b border-stone-100">
                  <div className="flex gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm ring-1 ring-stone-100">
                      <Sparkles className="h-5 w-5 text-stone-900" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 font-display">The Zerpha Insight</h4>
                      <p className="text-sm text-stone-600 mt-1 max-w-4xl font-medium leading-relaxed">
                        The market is shifting from general fleet tracking to <span className="text-stone-900 font-bold underline decoration-stone-300 underline-offset-2">carbon-aware routing</span>.
                        Incumbents are slow to adapt, creating a $4B opening for vertical-specific solutions in the EU market.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-semibold text-stone-500 font-display">Disruptor</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-stone-500 font-display">Value Proposition</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-stone-500 font-display">Acquisition Fit</th>
                        <th scope="col" className="px-6 py-3 font-semibold text-stone-500 text-right font-display">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      <tr className="hover:bg-stone-50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-stone-900/10">EL</div>
                            <div>
                              <div className="font-bold text-stone-900 font-display">EcoLogistics</div>
                              <div className="text-xs text-stone-500 font-medium">ecologistics.io</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-stone-600 font-medium">AI-first carbon tracking for heavy freight.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-stone-800 w-[92%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-stone-700">9.2/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 hover:bg-stone-50 hover:ring-stone-400 transition-all">
                            <FileText className="h-3.5 w-3.5 text-stone-600" />
                            Analysis
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-stone-50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white border border-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold">GR</div>
                            <div>
                              <div className="font-bold text-stone-900 font-display">GreenRoute</div>
                              <div className="text-xs text-stone-500 font-medium">greenroute.tech</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-stone-600 font-medium">Last-mile EV fleet management SaaS.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-stone-400 w-[85%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-stone-700">8.5/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-stone-900 hover:text-stone-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vision/Capabilities Section */}
        <div id="capabilities" className="mx-auto mt-32 max-w-7xl px-6 lg:px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-base font-bold leading-7 text-stone-900 tracking-wide uppercase font-display">The Zerpha Advantage</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-light tracking-tight text-stone-900 sm:text-5xl font-display">See what others miss.</p>
            <p className="mt-6 text-lg sm:text-xl leading-8 text-stone-600 font-body">
              In the race for vertical dominance, speed and clarity are everything. Zerpha is your unfair advantage.
            </p>
          </motion.div>

          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col bg-white p-10 rounded-[2rem] shadow-sm ring-1 ring-stone-200 hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-1 transition-all duration-500 group"
              >
                <dt className="flex items-center gap-x-4 text-xl font-bold leading-7 text-stone-900 font-display">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-900 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors duration-500">
                    <Target className="h-6 w-6" />
                  </div>
                  Market X-Ray
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-stone-600 font-body">
                  <p className="flex-auto">Stop guessing. Zerpha penetrates deep into niche markets to uncover the hidden gems and rising stars that traditional databases overlook.</p>
                </dd>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col bg-stone-900 p-10 rounded-[2rem] shadow-xl shadow-stone-900/10 hover:-translate-y-1 transition-all duration-500 group"
              >
                <dt className="flex items-center gap-x-4 text-xl font-bold leading-7 text-white font-display">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-white group-hover:bg-stone-700 transition-colors duration-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  Claude 4.5 Intelligence
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-stone-300 font-body">
                  <p className="flex-auto">Powered by the reasoning of Claude 4.5, we don't just scrape data—we understand it. Get human-level strategic analysis at machine speed.</p>
                </dd>
              </motion.div>


            </dl>
          </div>
        </div>

        {/* Built for Serial Acquirers - Consistent White & Purple Theme */}
        <div className="py-24 sm:py-32 bg-white relative overflow-hidden">
          {/* Aurora Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-200/30 rounded-full blur-[100px] opacity-60 mix-blend-multiply pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px] opacity-60 mix-blend-multiply pointer-events-none" />

          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-stone-900 sm:text-5xl mb-6">
                Built for Serial Acquirers
              </h2>
              <p className="text-lg leading-8 text-stone-600 font-body">
                Zerpha is purpose-built to help <span className="font-bold text-stone-900">Volaris Group</span>, <span className="font-bold text-stone-900">Constellation Software</span>, and other serial acquirers discover and evaluate B2B vertical SaaS companies faster than ever before.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* The Challenge Card - White */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[2rem] bg-white p-10 shadow-xl shadow-stone-900/5 ring-1 ring-stone-200"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 font-display">The Challenge</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-stone-600 font-body">
                    Finding high-quality B2B software acquisition targets is time-consuming. Traditional methods involve endless manual research, fragmented data sources, and missed opportunities in niche verticals.
                  </p>
                </div>
              </motion.div>

              {/* Our Solution Card - Dark */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[2rem] bg-stone-900 p-10 shadow-xl shadow-stone-900/20 text-white"
              >
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-stone-800/50 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-800 text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white font-display">Our Solution</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-stone-300 font-body">
                    Zerpha uses AI to instantly discover, analyze, and score vertical SaaS companies across any industry. Get acquisition-ready insights, contact information, and fit scores in seconds—not weeks.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Why Choose Zerpha - Light Stone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2rem] bg-[#292524] px-6 py-16 sm:px-12 lg:px-16 shadow-2xl"
            >
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-white font-display">Why Acquirers Choose Zerpha</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-stone-200 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 font-display">Faster Discovery</h4>
                    <p className="text-sm leading-6 text-stone-400 font-body">
                      Find vertical SaaS targets in minutes instead of months of manual research.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-stone-200 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 font-display">Acquisition Scoring</h4>
                    <p className="text-sm leading-6 text-stone-400 font-body">
                      AI-powered fit scores help prioritize the best opportunities for your portfolio.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-stone-200 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2 font-display">Direct Outreach</h4>
                    <p className="text-sm leading-6 text-stone-400 font-body">
                      Get verified emails and decision-maker contacts to start conversations immediately.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-16 flex justify-center">
              <button
                onClick={() => void handleSearch()}
                disabled={isAuthLoading}
                className={`group relative inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-xl shadow-stone-900/10 transition-all duration-200 ${isAuthLoading ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800 hover:-translate-y-0.5'
                  }`}
              >
                {isAuthLoading ? 'Connecting...' : 'Start Discovering Targets'}
                {!isAuthLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </div>
          </div>
        </div>



        {/* About Me Section */}
        <AboutMe />

        {/* Footer */}
        <footer className="bg-white border-t border-stone-100" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white p-1.5 shadow-sm">
                  <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full invert brightness-0" />
                </div>
                <span className="text-sm font-semibold text-stone-900 font-display">Zerpha</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-stone-500 font-body">
                <a href="/privacy" className="hover:text-stone-900 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-stone-900 transition-colors">Terms of Service</a>
                <p>&copy; {new Date().getFullYear()} Zerpha Inc.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
