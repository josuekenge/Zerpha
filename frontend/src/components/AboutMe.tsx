import { motion } from 'framer-motion';
import {
    Briefcase,
    ExternalLink,
    Github,
    Linkedin
} from 'lucide-react';

export function AboutMe() {
    return (
        <section id="about" className="py-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-slate-50/50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] opacity-60" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] opacity-60" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                Building Zerpha
                            </div>

                            <div className="mb-8 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white bg-white">
                                    <img
                                        src="/josue-profile-v2.png"
                                        alt="Josué Kenge"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>

                            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-2">
                                Josué Kenge
                            </h2>
                            <div className="text-xl font-medium text-indigo-600 mb-8">Founder & Full Stack Engineer</div>

                            <div className="flex gap-4 justify-center lg:justify-start">
                                <a
                                    href="https://www.linkedin.com/in/josu%C3%A9-kenge-760692223/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-[#0077b5] hover:ring-[#0077b5] hover:bg-[#0077b5]/5 transition-all"
                                >
                                    <Linkedin className="h-6 w-6" />
                                </a>
                                <a
                                    href="https://github.com/josuekenge"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900 hover:ring-slate-900 hover:bg-slate-50 transition-all"
                                >
                                    <Github className="h-6 w-6" />
                                </a>
                                <a
                                    href="mailto:contact@example.com"
                                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    Contact Me <ExternalLink className="h-4 w-4" />
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
                            className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm ring-1 ring-slate-200/60"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">My Story</h3>
                            </div>

                            <div className="prose prose-lg text-slate-600 space-y-8 leading-relaxed">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-3">The Origin of Zerpha</h4>
                                    <p>
                                        Zerpha wasn't born in a boardroom; it started as a spec-driven challenge from a mentor I deeply respect. They presented me with a complex problem: how to make high-level market intelligence accessible and actionable for everyone, not just industry giants.
                                    </p>
                                    <p className="mt-4">
                                        I took on the challenge and found myself completely immersed. What began as a technical exercise evolved into a passion project. I enjoyed every step of the process—from architecting the AI agents to refining the user experience. Building Zerpha allowed me to combine my love for cutting-edge technology with a tangible solution that empowers users to make smarter decisions.
                                    </p>
                                </div>

                                <div className="w-full h-px bg-slate-100 my-8" />

                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-3">A Journey of Innovation</h4>
                                    <p>
                                        My path has been defined by a relentless drive to build. During my time at <strong>Microsoft</strong> in Redmond, I had the unique opportunity to rotate between Software Engineering and Product Management roles. This dual perspective taught me that great software isn't just about clean code—it's about solving the right problems for the right people.
                                    </p>
                                    <p className="mt-4">
                                        That entrepreneurial spirit led me to co-found ventures like <strong>MobiSoins</strong>, where we're bridging gaps in healthcare mobility, and <strong>Ulife</strong>, leveraging AI to streamline operations in the solar industry. Whether I'm optimizing logistics at <strong>Kyeto</strong> or designing campaigns at <strong>Quantotech</strong>, I bring the same energy: a commitment to innovation, efficiency, and impact.
                                    </p>
                                </div>

                                <div className="bg-indigo-50 rounded-2xl p-6 mt-8 border border-indigo-100">
                                    <p className="text-indigo-900 font-medium italic">
                                        "I build because I believe technology should serve us, not complicate our lives. Zerpha is a testament to that belief—simple, powerful, and built with purpose."
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
