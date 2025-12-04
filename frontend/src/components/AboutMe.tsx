import { motion } from 'framer-motion';
import {
    Briefcase,
    GraduationCap,
    Code,
    ExternalLink,
    Github,
    Linkedin,
    Calendar,
    MapPin
} from 'lucide-react';

export function AboutMe() {
    const experiences = [
        {
            company: "Kyeto Logistic Group",
            role: "Chief Project Development Officer",
            date: "Jul 2025 - Present",
            location: "Remote",
            description: "I lead the strategic development of logistics solutions, overseeing the entire project lifecycle from conception to deployment. My focus is on optimizing operational workflows and integrating new technologies to drive efficiency and scalability across the organization.",
            color: "from-blue-500 to-cyan-500"
        },
        {
            company: "MobiSoins",
            role: "Co-Founder",
            date: "Nov 2024 - Present",
            location: "On-site",
            description: "I co-founded this healthcare mobility initiative to bridge the gap between patients and care providers. I am responsible for the technical architecture and product roadmap, ensuring our solution directly addresses the critical pain points in mobile health service delivery.",
            color: "from-emerald-500 to-teal-500"
        },
        {
            company: "Microsoft",
            role: "Explore Intern (SWE + PM)",
            date: "May 2024 - Aug 2024",
            location: "Redmond, WA",
            description: "During my time at Redmond, I rotated between Software Engineering and Product Management roles. I contributed to core product features, conducted user research to inform design decisions, and collaborated with cross-functional teams to ship high-quality software.",
            color: "from-orange-500 to-amber-500"
        },
        {
            company: "Ulife",
            role: "Co-Founder",
            date: "Dec 2024 - Mar 2025",
            location: "Ottawa, ON",
            description: "I spearheaded the integration of AI-driven technologies to streamline business operations in the solar industry. My work involved developing automated systems that significantly reduced manual overhead and unlocked new revenue channels for our clients.",
            color: "from-purple-500 to-pink-500"
        },
        {
            company: "Quantotech.ca",
            role: "Co-Founder",
            date: "Jan 2023 - Jan 2023",
            location: "Ottawa, ON",
            description: "I established and managed comprehensive client information systems to improve data accessibility. Additionally, I designed and executed targeted advertising campaigns that successfully increased brand visibility and client acquisition.",
            color: "from-indigo-500 to-violet-500"
        },
        {
            company: "ZESTO.C",
            role: "Chief Executive Officer",
            date: "Jul 2021 - May 2022",
            location: "Hybrid",
            description: "As CEO, I oversaw all financial operations and strategic planning. I implemented revenue growth strategies that stabilized the business and fostered a culture of innovation and accountability within the team.",
            color: "from-rose-500 to-red-500"
        }
    ];

    const skills = [
        "React", "TypeScript", "Node.js", "Next.js", "Tailwind CSS",
        "Python", "AI/ML", "Product Management", "Strategy", "Entrepreneurship"
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <section id="about" className="py-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 bg-slate-50/50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] opacity-60" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] opacity-60" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Left Column: Bio & Info */}
                    <div className="lg:col-span-5 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center text-center lg:items-start lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                Open to Opportunities
                            </div>

                            <div className="mb-8 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-white">
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
                            <div className="text-xl font-medium text-indigo-600 mb-6">Founder & Full Stack Engineer</div>

                            <div className="space-y-4 text-lg text-slate-600 leading-relaxed mb-8">
                                <p>
                                    I'm a builder at heart, driven by a vision to simplify complex market intelligence for vertical SaaS. With Zerpha, I'm leveraging the power of advanced AI agents like Claude and Gemini to democratize access to deep market insights that were previously reserved for large enterprises.
                                </p>
                                <p>
                                    My journey spans from interning at Microsoft to co-founding multiple ventures like Ulife and MobiSoins. This MVP represents the culmination of my experience in product strategy and software engineering—designed to be fast, intuitive, and ruthlessly efficient for analysts and founders alike.
                                </p>
                            </div>

                            <div className="flex gap-4">
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

                        {/* Education Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="p-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Education</h3>
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">Carleton University</div>
                                <div className="text-slate-600">Bachelor's degree, Computer Science</div>
                                <div className="text-sm text-slate-500 mt-1">Aug 2022 - May 2027</div>
                            </div>
                        </motion.div>

                        {/* Skills */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Code className="h-5 w-5 text-indigo-600" />
                                Technical Arsenal
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-600 hover:ring-indigo-200 transition-colors cursor-default"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Experience Timeline */}
                    <div className="lg:col-span-7">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Experience</h3>
                            </div>

                            {experiences.map((exp, index) => (
                                <motion.div
                                    key={index}
                                    variants={item}
                                    className="group relative pl-8 pb-8 last:pb-0 border-l-2 border-slate-200 last:border-l-0"
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[-9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-gradient-to-r ${exp.color} shadow-md group-hover:scale-125 transition-transform duration-300`} />

                                    <div className="relative -top-1.5 p-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200 transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {exp.role}
                                            </h4>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                                <Calendar className="h-3 w-3" />
                                                {exp.date}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                                            <span className="text-indigo-600">{exp.company}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <MapPin className="h-3 w-3" />
                                                {exp.location}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {exp.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
