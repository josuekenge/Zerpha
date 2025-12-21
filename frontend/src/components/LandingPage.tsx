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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-body bg-noise relative overflow-x-hidden">
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
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 p-2">
                <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-medium tracking-tight text-xl leading-none text-slate-900">Zerpha</span>
                <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase leading-none mt-1">Intelligence</span>
              </div>
            </motion.div>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors font-body">Vision</a>
            <a href="#capabilities" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors font-body">Capabilities</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors font-body">About</a>
            <a href="#mission" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors font-body">Mission</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/workspace')}
                className="text-sm font-medium bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 font-body"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block">Sign in</button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-semibold bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 font-body"
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
                    className="w-full text-center text-sm font-medium bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-body"
                  >
                    Go to Workspace
                  </button>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Sign in</button>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full text-center text-sm font-medium bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-body"
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
        {/* Refined Ambient Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-rose-200/25 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
          <div className="absolute top-20 right-1/4 w-[600px] h-[500px] bg-violet-200/30 rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px] opacity-40 mix-blend-multiply" />
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto max-w-4xl text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-display font-medium tracking-tight text-slate-900 lg:text-8xl mb-6 leading-[1.1]"
            >
              Build the Future of <br />
              <TypewriterEffect
                words={["Vertical SaaS.", "Market Intelligence.", "Deal Sourcing.", "Private Equity."]}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
                cursorClassName="bg-indigo-600"
              />
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-10 text-lg sm:text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto font-body px-4">
              Don't just find companies. Discover ecosystems. Zerpha transforms chaotic market signals into clear, actionable strategies for the boldest builders.
            </motion.p>

            {/* Search Simulation - Emotional/Visionary */}
            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center">
              <div className="relative w-full max-w-xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 stroke-[2]" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isAuthLoading && void handleSearch()}
                    className="block w-full rounded-2xl border-0 py-5 pl-14 pr-20 text-slate-900 shadow-xl shadow-indigo-900/5 ring-1 ring-inset ring-slate-200/50 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-lg sm:leading-6 bg-white transition-all font-body font-normal"
                    placeholder='What market will you disrupt today?'
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={handleArrowClick}
                      disabled={!searchQuery.trim() || isAuthLoading}
                      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-white transition-all shadow-sm ${searchQuery.trim() && !isAuthLoading
                        ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                        : 'bg-slate-200 cursor-not-allowed text-slate-400'
                        }`}
                    >
                      {isAuthLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
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
                className={`w-full sm:w-auto rounded-xl px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-600/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 font-body ${isAuthLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01]'
                  }`}
              >
                {isAuthLoading ? 'Connecting...' : 'Start Your Journey'}
              </button>
            </motion.div>
          </motion.div>

          {/* Product Dashboard Mockup - Clean & Focused */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="mt-24 flow-root sm:mt-32 perspective-1000"
          >
            <div className="-m-2 rounded-2xl bg-gradient-to-br from-indigo-100/50 to-purple-100/50 p-2 ring-1 ring-inset ring-indigo-900/5 lg:-m-4 lg:rounded-3xl lg:p-4 backdrop-blur-xl shadow-2xl shadow-indigo-600/10">
              <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
                {/* Dashboard Header */}
                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-sm sm:text-base font-display font-semibold text-slate-900">Market Intelligence</h3>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm">Sustainable Logistics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Download className="h-4 w-4" /></button>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Settings className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Simple Company Cards */}
                <div className="p-6 space-y-4">
                  {/* Company 1 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-600/20">EL</div>
                      <div>
                        <div className="font-bold text-slate-900 font-display">EcoLogistics</div>
                        <div className="text-sm text-slate-500">AI-first carbon tracking for heavy freight</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-1">Acquisition Fit</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[92%] rounded-full"></div>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">9.2</span>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-all">
                        <FileText className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>

                  {/* Company 2 */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white border-2 border-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">GR</div>
                      <div>
                        <div className="font-bold text-slate-900 font-display">GreenRoute</div>
                        <div className="text-sm text-slate-500">Last-mile EV fleet management SaaS</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-1">Acquisition Fit</div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[85%] rounded-full"></div>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">8.5</span>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-200 transition-all opacity-0 group-hover:opacity-100">
                        <FileText className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vision/Capabilities Section */}
        <div id="capabilities" className="relative mt-32 pb-24 overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-rose-100/40 rounded-full blur-[80px] opacity-50 mix-blend-multiply" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-violet-100/30 rounded-full blur-[100px] opacity-40 mix-blend-multiply" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-sm font-medium text-indigo-600 tracking-widest uppercase font-body mb-4">The Zerpha Advantage</p>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl font-display">See what others miss.</h2>
              <p className="mt-6 text-lg sm:text-xl leading-8 text-slate-600 font-body">
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
                  className="flex flex-col bg-white p-10 rounded-2xl shadow-sm ring-1 ring-slate-200/60 hover:shadow-lg hover:ring-slate-300 hover:-translate-y-1 transition-all duration-500 group"
                >
                  <dt className="flex items-center gap-x-4 text-xl font-semibold leading-7 text-slate-900 font-display">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                      <Target className="h-6 w-6" />
                    </div>
                    Market X-Ray
                  </dt>
                  <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-600 font-body">
                    <p className="flex-auto">Stop guessing. Zerpha penetrates deep into niche markets to uncover the hidden gems and rising stars that traditional databases overlook.</p>
                  </dd>
                </motion.div>

                {/* Feature 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col bg-slate-900 p-10 rounded-2xl shadow-xl shadow-slate-900/10 hover:-translate-y-1 transition-all duration-500 group"
                >
                  <dt className="flex items-center gap-x-4 text-xl font-semibold leading-7 text-white font-display">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-white group-hover:bg-slate-700 transition-colors duration-500">
                      <Zap className="h-6 w-6" />
                    </div>
                    Claude 4.5 Intelligence
                  </dt>
                  <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-300 font-body">
                    <p className="flex-auto">Powered by the reasoning of Claude 4.5, we don't just scrape data—we understand it. Get human-level strategic analysis at machine speed.</p>
                  </dd>
                </motion.div>


              </dl>
            </div>
          </div>
        </div>

        {/* Built for Serial Acquirers - Refined & Professional */}
        <div className="py-24 sm:py-32 relative overflow-hidden">
          {/* Refined gradient background */}
          <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-white via-slate-50 to-white">
            <div className="absolute top-1/4 left-0 w-[700px] h-[500px] bg-rose-100/30 rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-violet-100/25 rounded-full blur-[80px] opacity-40 mix-blend-multiply" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] opacity-30 mix-blend-multiply" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-sm font-medium text-indigo-600 tracking-widest uppercase mb-4 font-body"
              >
                Enterprise Solutions
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-slate-900 mb-6"
              >
                Built for Serial Acquirers
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg leading-relaxed text-slate-600 font-body max-w-2xl mx-auto"
              >
                Purpose-built for <span className="font-semibold text-slate-900">Volaris Group</span>, <span className="font-semibold text-slate-900">Constellation Software</span>, and growth-focused investors seeking vertical SaaS opportunities.
              </motion.p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200/60 hover:shadow-lg hover:ring-slate-300 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-display mb-3">Minutes, Not Months</h3>
                <p className="text-slate-600 font-body leading-relaxed">
                  Discover vertical SaaS targets instantly. Replace months of manual research with AI-powered market intelligence.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200/60 hover:shadow-lg hover:ring-slate-300 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-display mb-3">AI-Powered Fit Scores</h3>
                <p className="text-slate-600 font-body leading-relaxed">
                  Proprietary algorithms score acquisition fit based on your portfolio strategy and investment criteria.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-slate-200/60 hover:shadow-lg hover:ring-slate-300 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-display mb-3">Direct Outreach</h3>
                <p className="text-slate-600 font-body leading-relaxed">
                  Access verified decision-maker contacts and company insights to start meaningful conversations immediately.
                </p>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <button
                onClick={() => void handleSearch()}
                disabled={isAuthLoading}
                className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition-all duration-200 font-body ${isAuthLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl'
                  }`}
              >
                {isAuthLoading ? 'Connecting...' : 'Start Discovering Targets'}
                {!isAuthLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.div>
          </div>
        </div>

        {/* About Me Section */}
        <AboutMe />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white p-1.5 shadow-sm">
                  <img src="/zerpha.svg" alt="Zerpha" className="w-full h-full" />
                </div>
                <span className="text-sm font-semibold text-slate-900 font-display">Zerpha</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500 font-body">
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

