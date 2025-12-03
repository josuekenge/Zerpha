import { motion } from 'framer-motion';
import {
  LayoutGrid,
  ArrowRight,
  Search,
  Download,
  Settings,
  Sparkles,
  FileText,
  Zap,
  Target,
  TrendingUp,
  Check,
  ShieldCheck,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  const handleEnterApp = () => {
    navigate('/login');
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <LayoutGrid className="h-6 w-6 stroke-[2]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Zerpha</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Vision</a>
            <a href="#capabilities" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Capabilities</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleEnterApp} className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block">Sign in</button>
            <button
              onClick={handleEnterApp}
              className="text-sm font-medium bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              Get Started
            </button>
          </div>
        </div>
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
              className="text-6xl font-bold tracking-tight text-slate-900 sm:text-8xl mb-6"
            >
              Build the Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">Vertical SaaS.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-8 text-xl leading-8 text-slate-600 max-w-2xl mx-auto font-medium">
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
                    onFocus={handleEnterApp}
                    className="block w-full rounded-xl border-0 py-5 pl-14 pr-20 text-slate-900 shadow-2xl shadow-indigo-900/10 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6 bg-white/95 backdrop-blur-xl transition-all font-medium cursor-pointer"
                    placeholder='What market will you disrupt today?'
                    readOnly
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={handleEnterApp}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center gap-x-8">
              <button
                onClick={handleEnterApp}
                className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-500 hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Start Your Journey
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
                <div className="border-b border-slate-100 bg-white/50 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-bold text-slate-900">Market Intelligence: "Sustainable Logistics"</h3>
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
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">See what others miss.</p>
            <p className="mt-6 text-xl leading-8 text-slate-600">
              In the race for vertical dominance, speed and clarity are everything. Zerpha is your unfair advantage.
            </p>
          </motion.div>

          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-3">
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

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col bg-white p-10 rounded-[2.5rem] shadow-sm ring-1 ring-slate-200/60 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 group"
              >
                <dt className="flex items-center gap-x-4 text-xl font-bold leading-7 text-slate-900">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  Gemini 3 Pro Storytelling
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">Turn raw data into board-ready narratives instantly. Gemini 3 Pro crafts compelling slide decks that sell your vision for you.</p>
                </dd>
              </motion.div>
            </dl>
          </div>
        </div>

        {/* Trust/Vision Section (Replaces Tech Stack) */}
        <div id="vision" className="relative isolate overflow-hidden bg-slate-900 py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-slate-900 shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Built for the Bold.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                We believe the next decade belongs to Vertical SaaS. Zerpha is the operating system for the visionaries who will build it. Secure, scalable, and relentlessly accurate.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-bold leading-8 text-white">Uncompromising Security</h3>
                </div>
                <p className="text-base leading-7 text-slate-400">Your strategic data is your most valuable asset. We protect it with enterprise-grade encryption and isolation.</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="h-6 w-6 text-indigo-400" />
                  <h3 className="text-lg font-bold leading-8 text-white">Velocity at Scale</h3>
                </div>
                <p className="text-base leading-7 text-slate-400">Move faster than the market. Our dual-engine AI architecture processes thousands of data points in seconds.</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Check className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-bold leading-8 text-white">Precision Guaranteed</h3>
                </div>
                <p className="text-base leading-7 text-slate-400">Hallucinations have no place in business strategy. We use multi-step verification to ensure every insight is grounded in reality.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-24 sm:py-32 relative overflow-hidden bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl sm:text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Invest in Your Edge</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Simple, transparent pricing for every stage of your journey.</p>
            </motion.div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">

              {/* Tier 1: Starter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl p-8 ring-1 ring-slate-200 xl:p-10 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-bold leading-8 text-slate-900">Explorer</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">For the curious minds mapping the landscape.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">Free</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-xl py-2.5 px-3 text-center text-sm font-bold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 hover:bg-indigo-50 transition-all">Start Exploring</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> 5-15 Search Results</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Company Names & Summaries</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Verified Emails</li>
                </ul>
              </motion.div>

              {/* Tier 2: Pro */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl p-8 ring-2 ring-indigo-600 xl:p-10 bg-white shadow-2xl shadow-indigo-900/10 relative scale-105 z-10"
              >
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-lg">Most Popular</span>
                </div>
                <h3 className="text-lg font-bold leading-8 text-slate-900">Visionary</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">For builders ready to dominate their niche.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">$29</span>
                  <span className="text-sm font-semibold leading-6 text-slate-600">/mo</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-bold leading-6 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Get Started</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> 25 Deep Dive Searches</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Company Locations</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Direct Email Access</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Acquisition Scoring</li>
                </ul>
              </motion.div>

              {/* Tier 3: Enterprise */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl p-8 ring-1 ring-slate-200 xl:p-10 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-bold leading-8 text-slate-900">Empire</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">For VC firms and M&A teams.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">$60</span>
                  <span className="text-sm font-semibold leading-6 text-slate-600">/mo</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-xl py-2.5 px-3 text-center text-sm font-bold leading-6 text-slate-900 ring-1 ring-inset ring-slate-200 hover:ring-slate-300 hover:bg-slate-50 transition-all">Contact Sales</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Phone Numbers & Contact Info</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> PDF Slide Export</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Faster Search Speed</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-indigo-600" /> Priority Support</li>
                </ul>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <p className="text-xs leading-5 text-slate-500">© 2024 Zerpha Inc. All rights reserved.</p>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-xs leading-5 text-slate-500 hover:text-indigo-600 transition-colors">Privacy</a>
                <a href="#" className="text-xs leading-5 text-slate-500 hover:text-indigo-600 transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
