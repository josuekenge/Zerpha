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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "circOut" }}
        className="fixed top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 cursor-pointer">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/');
              }}
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 p-2">
                <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-xl leading-none text-slate-900">Zerpha</span>
                <span className="text-slate-500 text-[10px] font-medium leading-none mt-1">Intelligence</span>
              </div>
            </motion.div>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Vision</a>
            <a href="#capabilities" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Capabilities</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">About</a>
            <a href="#mission" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Mission</a>
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
                  className="text-sm font-medium bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
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
        {/* Emotional Gradient Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-indigo-300/20 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-blob" />
          <div className="absolute top-0 right-0 w-[900px] h-[700px] bg-purple-300/20 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-0 w-[900px] h-[700px] bg-blue-300/20 rounded-full blur-[120px] opacity-60 mix-blend-multiply animate-blob animation-delay-4000" />
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
              <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-indigo-500/30 bg-white/60 backdrop-blur-md shadow-sm transition-all hover:shadow-md cursor-default">
                Powered by <span className="font-bold text-indigo-600">Claude 4.5</span> & <span className="font-bold text-purple-600">Gemini 3 Pro</span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 lg:text-8xl mb-6"
            >
              Build the Future of <br />
              <TypewriterEffect
                words={["Vertical SaaS.", "Market Intelligence.", "Deal Sourcing.", "Private Equity."]}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x"
                cursorClassName="bg-indigo-600"
              />
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-8 text-lg sm:text-xl leading-8 text-slate-600 max-w-2xl mx-auto font-medium px-4">
              Don't just find companies. Discover ecosystems. Zerpha transforms chaotic market signals into clear, actionable strategies for the boldest builders.
            </motion.p>

            {/* Search Simulation - Emotional/Visionary */}
            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center">
              <div className="relative w-full max-w-xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 stroke-[2.5]" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAuthLoading && void handleSearch()}
                    className="block w-full rounded-xl border-0 py-5 pl-14 pr-20 text-slate-900 shadow-2xl shadow-indigo-900/10 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6 bg-white/95 backdrop-blur-xl transition-all font-medium"
                    placeholder='What market will you disrupt today?'
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={handleArrowClick}
                      disabled={!searchQuery.trim() || isAuthLoading}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-white transition-all shadow-md ${searchQuery.trim() && !isAuthLoading
                        ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                        }`}
                    >
                      {isAuthLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                className={`w-full sm:w-auto rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${isAuthLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
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
            <div className="-m-2 rounded-2xl bg-gradient-to-b from-slate-900/5 to-slate-900/0 p-2 ring-1 ring-inset ring-slate-900/10 lg:-m-4 lg:rounded-3xl lg:p-4 bg-white/30 backdrop-blur-2xl shadow-2xl">
              <div className="rounded-xl bg-white/80 ring-1 ring-slate-900/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* Dashboard Header */}
                <div className="border-b border-slate-100 bg-white/50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between backdrop-blur-sm gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Market Intelligence: "Sustainable Logistics"</h3>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">High Opportunity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Download className="h-4 w-4" /></button>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Settings className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Global Insights (Condensed) */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-slate-100">
                  <div className="flex gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm ring-1 ring-slate-100">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">The Zerpha Insight</h4>
                      <p className="text-sm text-slate-600 mt-1 max-w-4xl font-medium">
                        The market is shifting from general fleet tracking to <span className="text-indigo-700 font-bold">carbon-aware routing</span>.
                        Incumbents are slow to adapt, creating a $4B opening for vertical-specific solutions in the EU market.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white/60">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-bold text-slate-500">Disruptor</th>
                        <th scope="col" className="px-6 py-3 font-bold text-slate-500">Value Proposition</th>
                        <th scope="col" className="px-6 py-3 font-bold text-slate-500">Acquisition Fit</th>
                        <th scope="col" className="px-6 py-3 font-bold text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="hover:bg-indigo-50/40 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/20">EL</div>
                            <div>
                              <div className="font-bold text-slate-900">EcoLogistics</div>
                              <div className="text-xs text-slate-500 font-medium">ecologistics.io</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">AI-first carbon tracking for heavy freight.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[92%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-700">9.2/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:ring-indigo-200 transition-all">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            Analysis
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-indigo-50/40 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">GR</div>
                            <div>
                              <div className="font-bold text-slate-900">GreenRoute</div>
                              <div className="text-xs text-slate-500 font-medium">greenroute.tech</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">Last-mile EV fleet management SaaS.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[85%] rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-700">8.5/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
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
            <h2 className="text-base font-bold leading-7 text-indigo-600 tracking-wide uppercase">The Zerpha Advantage</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">See what others miss.</p>
            <p className="mt-6 text-lg sm:text-xl leading-8 text-slate-600">
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
                className="flex flex-col bg-white p-10 rounded-[2.5rem] shadow-sm ring-1 ring-slate-200/60 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-2 transition-all duration-500 group"
              >
                <dt className="flex items-center gap-x-4 text-xl font-bold leading-7 text-slate-900">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                    <Target className="h-7 w-7" />
                  </div>
                  Market X-Ray
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">Stop guessing. Zerpha penetrates deep into niche markets to uncover the hidden gems and rising stars that traditional databases overlook.</p>
                </dd>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col bg-white p-10 rounded-[2.5rem] shadow-sm ring-1 ring-slate-200/60 hover:shadow-2xl hover:shadow-purple-900/10 hover:-translate-y-2 transition-all duration-500 group"
              >
                <dt className="flex items-center gap-x-4 text-xl font-bold leading-7 text-slate-900">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
                    <Zap className="h-7 w-7" />
                  </div>
                  Claude 4.5 Intelligence
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-600">
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
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">
                Built for Serial Acquirers
              </h2>
              <p className="text-lg leading-8 text-slate-600">
                Zerpha is purpose-built to help <span className="font-semibold text-indigo-600">Volaris Group</span>, <span className="font-semibold text-indigo-600">Constellation Software</span>, and other serial acquirers discover and evaluate B2B vertical SaaS companies faster than ever before.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* The Challenge Card - Dark Purple */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[2.5rem] bg-[#1e1b4b] p-10 shadow-xl shadow-indigo-900/20"
              >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-rose-300 backdrop-blur-sm">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">The Challenge</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-indigo-100/80">
                    Finding high-quality B2B software acquisition targets is time-consuming. Traditional methods involve endless manual research, fragmented data sources, and missed opportunities in niche verticals.
                  </p>
                </div>
              </motion.div>

              {/* Our Solution Card - Vibrant Indigo */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-10 shadow-xl shadow-indigo-600/20"
              >
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Our Solution</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-indigo-100">
                    Zerpha uses AI to instantly discover, analyze, and score vertical SaaS companies across any industry. Get acquisition-ready insights, contact information, and fit scores in seconds—not weeks.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Why Choose Zerpha - Deepest Purple */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] bg-[#0F0529] px-6 py-16 sm:px-12 lg:px-16 shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>

              <div className="relative z-10">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-white">Why Acquirers Choose Zerpha</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-indigo-300 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Faster Discovery</h4>
                    <p className="text-sm leading-6 text-slate-400">
                      Find vertical SaaS targets in minutes instead of months of manual research.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-indigo-300 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Acquisition Scoring</h4>
                    <p className="text-sm leading-6 text-slate-400">
                      AI-powered fit scores help prioritize the best opportunities for your portfolio.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-indigo-300 ring-1 ring-white/10 mb-6">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Direct Outreach</h4>
                    <p className="text-sm leading-6 text-slate-400">
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
                className={`group relative inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition-all duration-200 ${isAuthLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5'
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
        <footer className="bg-white border-t border-slate-200" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white p-1.5">
                  <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Zerpha</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                <p>&copy; {new Date().getFullYear()} Zerpha Inc.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
