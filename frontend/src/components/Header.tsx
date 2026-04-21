import React from 'react';
import { ShieldCheck, Github, BookOpen, Command, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
    return (
        <header className="border-b border-white/[0.05] bg-black/50 backdrop-blur-3xl sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-6"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                            <ShieldCheck className="w-6 h-6 text-black" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight flex items-center">
                            FAIRSIM <span className="text-slate-600 mx-2 text-xs font-medium">/</span> 
                            <span className="text-primary font-black">CORE</span>
                        </h1>
                        <div className="flex items-center space-x-3 mt-1">
                            <span className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <Activity className="w-3 h-3 mr-1.5 text-emerald-500" />
                                Synchronized
                            </span>
                            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                            <span className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                <Globe className="w-3 h-3 mr-1.5 text-primary" />
                                Global Node 01
                            </span>
                        </div>
                    </div>
                </motion.div>
                
                <div className="flex items-center space-x-6">
                    <nav className="hidden md:flex items-center space-x-6 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {['Architecture', 'Registry', 'Audits'].map((item) => (
                            <a key={item} className="hover:text-white transition-colors cursor-pointer flex items-center group">
                                {item}
                                <div className="w-1 h-1 bg-white rounded-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </a>
                        ))}
                    </nav>
                    <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
                    <div className="flex items-center space-x-3">
                        <button className="secondary-button !p-2 rounded-xl">
                            <Github className="w-4 h-4" />
                        </button>
                        <button className="primary-button text-[10px] uppercase tracking-widest flex items-center">
                            <Command className="w-3.5 h-3.5 mr-2" />
                            Terminal
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
