import React, { useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  ArrowRight, 
  Search, 
  Download, 
  Settings, 
  Sparkles, 
  FileText, 
  SearchCode, 
  Bot, 
  Presentation, 
  Check, 
  Database, 
  Cpu, 
  Code2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleEnterApp = () => {
    navigate('/login');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(100, 116, 139, ${this.opacity})`; // Slate-500 color
        context.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push(new Particle());
      }
      animate();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 selection:bg-gray-900 selection:text-white font-sans relative">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white shadow-lg ring-1 ring-black/5">
              <LayoutGrid className="h-4 w-4 stroke-[1.5]" />
            </div>
            <span className="text-lg font-medium tracking-tight text-gray-900">Zerpha</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#tech-stack" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Tech Stack</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleEnterApp} className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors sm:block">Sign in</button>
            <button onClick={handleEnterApp} className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">Get Started</button>
          </div>
        </div>
      </nav>

      <main className="relative isolate pt-14 overflow-hidden">
        {/* Particle Canvas */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10 opacity-60 pointer-events-none" />

        {/* Background Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-20 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
            style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
          />
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-xs leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 bg-white/50 backdrop-blur-sm">
                Powered by Claude 3.5 Sonnet & Gemini 2.0 Pro <a href="#" className="font-semibold text-blue-600 ml-1"><span className="absolute inset-0" aria-hidden="true"></span>Read API specs <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <h1 className="text-4xl font-medium tracking-tight text-gray-900 sm:text-6xl">
              Vertical SaaS Intelligence,<br/>
              <span className="text-gray-400">Automated.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl mx-auto">
              Instantly discover, analyze, and export insights on niche software markets. From scrape to slide deck in minutes.
            </p>
            
            {/* Search Simulation */}
            <div className="mt-10 flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 stroke-[1.5]" />
                </div>
                <input type="text" className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg shadow-gray-900/5 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white/90 backdrop-blur-sm" placeholder='Try "Home Healthcare CRM" or "Logistics Fleet Management"' />
                <div className="absolute inset-y-1 right-1 flex items-center">
                  <button type="button" className="inline-flex items-center rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-100">
                    <span className="mr-1">⌘</span>K
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-x-6">
              <button onClick={handleEnterApp} className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">Start 5x5 Search</button>
              <a href="#how-it-works" className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-1 group">
                See how it works <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Product Dashboard Mockup */}
          <div className="mt-16 flow-root sm:mt-24">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 bg-white/30 backdrop-blur-sm">
              <div className="rounded-xl bg-white ring-1 ring-gray-900/10 shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-medium text-gray-900">Search Results: "Logistics SaaS"</h3>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">5 Companies Found</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600"><Download className="h-4 w-4" /></button>
                    <button className="text-gray-400 hover:text-gray-600"><Settings className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Global Insights (Condensed) */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Market Opportunity</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-3xl">High demand for last-mile delivery optimization in emerging markets. Consolidation of fleet management and predictive maintenance is a key trend.</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-medium text-gray-500">Company</th>
                        <th scope="col" className="px-6 py-3 font-medium text-gray-500">Summary</th>
                        <th scope="col" className="px-6 py-3 font-medium text-gray-500">Acquisition Fit</th>
                        <th scope="col" className="px-6 py-3 font-medium text-gray-500">Est. Headcount</th>
                        <th scope="col" className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">FR</div>
                            <div>
                              <div className="font-medium text-gray-900">FleetRoute</div>
                              <div className="text-xs text-gray-500">fleetroute.io</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">AI-driven route optimization for heavy logistics.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 w-[90%]"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">9.0/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">50-200</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/80 transition-colors group cursor-pointer bg-blue-50/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-medium">TP</div>
                            <div>
                              <div className="font-medium text-gray-900">TrackPoint</div>
                              <div className="text-xs text-gray-500">trackpoint.net</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">Vertical SaaS for last-mile delivery tracking.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 w-[95%]"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">9.5/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">10-50</td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            Export PDF
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mx-auto mt-32 max-w-7xl px-6 lg:px-8 pb-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Workflow</h2>
            <p className="mt-2 text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">From niche search to M&A report.</p>
            <p className="mt-6 text-lg leading-8 text-gray-600">Designed for analysts and engineers who need structured data.</p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <SearchCode className="h-5 w-5 text-white" />
                  </div>
                  Smart Discovery
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">Input any niche like "Home Healthcare" or "Legal CRM". Zerpha intelligently finds up to 30+ Vertical SaaS candidates.</p>
                </dd>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  Claude 3.5 Extraction
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">We scrape key pages and use Claude 3.5 Sonnet to extract structured JSON: tech stack, pricing models, and acquisition fit scores.</p>
                </dd>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <Presentation className="h-5 w-5 text-white" />
                  </div>
                  Gemini Slide Generation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">One click turns raw JSON into a professional slide deck. Powered by Gemini 2.0 Pro and Google Slides API.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">Pricing Plans</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">Choose the depth of intelligence you need.</p>
            </div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
              
              {/* Tier 1: 5x5 */}
              <div className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 bg-white/60 backdrop-blur-sm relative">
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Limited Time Offer</span>
                </div>
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Starter</h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">Essential market mapping for quick analysis.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">Free</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Try Now</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> 5x5 Search Matrix</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Basic Company Profiles</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Web Export only</li>
                </ul>
              </div>

              {/* Tier 2: 15 Open Window */}
              <div className="rounded-3xl p-8 ring-2 ring-blue-600 xl:p-10 bg-white shadow-xl relative scale-105 z-10">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Pro Analyst</h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">For deep dives into specific verticals.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$49</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/mo</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Get Started</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> 15 Open Window searches</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Deep Dive Tech Stack</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> PDF Slide Export</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Acquisition Scoring</li>
                </ul>
              </div>

              {/* Tier 3: 30+ Results via Stripe */}
              <div className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 bg-white/60 backdrop-blur-sm">
                <h3 className="text-lg font-semibold leading-8 text-gray-900">Enterprise</h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">Comprehensive data for VC and M&A teams.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$199</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/mo</span>
                </p>
                <button onClick={handleEnterApp} className="mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-gray-900 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">Pay via Stripe</button>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> 30+ Results per SaaS search</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Secure Stripe Integration</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> API Access</li>
                  <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-blue-600" /> Priority Support</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div id="tech-stack" className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">Built on a Modern Stack</h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Reliable, fast, and type-safe. We use the best tools to ensure data accuracy.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
              <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-semibold leading-8 text-white">Supabase</h3>
                </div>
                <p className="text-base leading-7 text-gray-400">Managed Postgres database storing all search history, company data, and report metadata.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu className="h-6 w-6 text-orange-400" />
                  <h3 className="text-lg font-semibold leading-8 text-white">Claude 3.5 + Gemini 2.0</h3>
                </div>
                <p className="text-base leading-7 text-gray-400">Dual-model architecture. Claude handles structured extraction, Gemini powers slide generation.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Code2 className="h-6 w-6 text-cyan-400" />
                  <h3 className="text-lg font-semibold leading-8 text-white">React + TypeScript</h3>
                </div>
                <p className="text-base leading-7 text-gray-400">Type-safe frontend. No direct AI calls from client. Clean, responsive Tailwind UI.</p>
              </div>
            </div>
          </div>
          
          <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#gradient-tech)" fillOpacity="0.25"></circle>
            <defs>
              <radialGradient id="gradient-tech">
                <stop stopColor="#3B82F6"></stop>
                <stop offset="1" stopColor="#1E40AF"></stop>
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* CTA Section */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="relative isolate overflow-hidden bg-gray-50 px-6 py-24 text-center shadow-sm sm:rounded-3xl sm:px-16 border border-gray-100">
              <h2 className="mx-auto max-w-2xl text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
                Ready to analyze your market?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
                Get deep insights into vertical SaaS competitors in minutes.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button onClick={handleEnterApp} className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                  Get started for free
                </button>
                <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
                  View sample PDF <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white">
                <LayoutGrid className="h-3 w-3" />
              </div>
              <p className="text-xs leading-5 text-gray-500">© 2024 Zerpha Inc. All rights reserved.</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-xs leading-5 text-gray-500 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-xs leading-5 text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-xs leading-5 text-gray-500 hover:text-gray-900">API</a>
              <a href="#" className="text-xs leading-5 text-gray-500 hover:text-gray-900">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

