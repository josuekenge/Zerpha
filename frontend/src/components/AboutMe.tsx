import { motion } from 'framer-motion';
import {
    Briefcase,
    ExternalLink,
    Github,
    Linkedin
} from 'lucide-react';

export function AboutMe() {
    return (
        <section id="about" className="py-24 sm:py-32 bg-[#09090b] border-t border-white/[0.04] relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-purple-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Founder Profile */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center text-center lg:items-start lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 text-xs font-semibold uppercase tracking-wider mb-8">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                Building Zerpha
                            </div>

                            <div className="mb-8 relative">
                                <div className="relative w-72 h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden ring-1 ring-white/[0.08] bg-[#111113]">
                                    <img
                                        src="/josue-profile-v2.png"
                                        alt="Josué Kenge"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white mb-2 font-display">
                                Josué Kenge
                            </h2>
                            <div className="text-base font-medium text-white/40 mb-8 font-body">Founder & Full Stack Engineer</div>

                            <div className="flex gap-3 justify-center lg:justify-start">
                                <a
                                    href="https://www.linkedin.com/in/josu%C3%A9-kenge-760692223/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-all"
                                >
                                    <Linkedin className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://github.com/josuekenge"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <Github className="h-5 w-5" />
                                </a>
                                <a
                                    href="mailto:contact@example.com"
                                    className="px-5 py-2.5 rounded-lg bg-white text-[#09090b] text-sm font-medium hover:bg-white/90 transition-all flex items-center gap-2 font-body"
                                >
                                    Contact Me <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Narrative Biography */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="rounded-2xl p-8 lg:p-10 border border-white/[0.06] bg-white/[0.02] relative overflow-hidden"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-lg bg-white/[0.06] text-white/50">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-semibold text-white font-display">My Story</h3>
                            </div>

                            <div className="text-white/40 space-y-8 leading-relaxed font-body text-[15px]">
                                <div>
                                    <h4 className="text-lg font-semibold text-white/90 mb-3 font-display">The Origin of Zerpha</h4>
                                    <p>
                                        Zerpha wasn't born in a boardroom; it started as a spec-driven challenge from a mentor I deeply respect. They presented me with a complex problem: how to make high-level market intelligence accessible and actionable for everyone, not just industry giants.
                                    </p>
                                    <p className="mt-4">
                                        I took on the challenge and found myself completely immersed. What began as a technical exercise evolved into a passion project. I enjoyed every step of the process — from architecting the intelligence engine to refining the user experience. Building Zerpha allowed me to combine my love for cutting-edge technology with a tangible solution that empowers users to make smarter decisions.
                                    </p>
                                </div>

                                <div className="w-full h-px bg-white/[0.06]" />

                                <div>
                                    <h4 className="text-lg font-semibold text-white/90 mb-3 font-display">A Journey of Innovation</h4>
                                    <p>
                                        My path has been defined by a relentless drive to build. During my time at <strong className="text-white/70">Microsoft</strong> in Redmond, I had the unique opportunity to rotate between Software Engineering and Product Management roles. This dual perspective taught me that great software isn't just about clean code — it's about solving the right problems for the right people.
                                    </p>
                                    <p className="mt-4">
                                        That entrepreneurial spirit led me to co-found ventures like <strong className="text-white/70">MobiSoins</strong>, where we're bridging gaps in healthcare mobility, and <strong className="text-white/70">Ulife</strong>, streamlining operations in the solar industry. Whether I'm optimizing logistics at <strong className="text-white/70">Kyeto</strong> or designing campaigns at <strong className="text-white/70">Quantotech</strong>, I bring the same energy: a commitment to innovation, efficiency, and impact.
                                    </p>
                                </div>

                                <div className="rounded-xl p-6 border border-indigo-500/10 bg-indigo-500/[0.04]">
                                    <p className="text-white/60 font-medium italic font-display text-base">
                                        "I build because I believe technology should serve us, not complicate our lives. Zerpha is a testament to that belief — simple, powerful, and built with purpose."
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
