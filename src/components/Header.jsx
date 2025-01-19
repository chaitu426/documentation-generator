import React, { useState } from 'react'
import { MoveUpRight } from 'lucide-react';
import { motion,useInView, AnimatePresence } from 'framer-motion';


const Header = () => {
    const [activeTab, setActiveTab] = useState('work');
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });
const words = ["frontend dev", "Backend dev", "C++ DSA"];
const [index, setIndex] = React.useState(0);

React.useEffect(() => {
    const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 5000);
    return () => clearInterval(interval);
}, [words.length]);

    return (
        <>
        <nav className='sticky top-0 glow-container'>
            <div className='flex  glow-effect h-36'>
                <div className='m-9 px-3 '>
                    <motion.h1
                    ref={ref}
                    initial={{ filter: 'blur(20px)', opacity: 0 }}
                    animate={isInView ? { filter: 'blur(0px)', opacity: 1 } : {}}
                    transition={{ duration: 1.2 }}
                     className='text-lg font-semibold'>Chaitanya</motion.h1>
                     <AnimatePresence mode="wait">
                    <motion.h3
                    key={words[index]}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.5 }}
                     className='text-gray-400 font-sans'>{words[index]}</motion.h3>
                     </AnimatePresence>
                </div>


                <div className="mt-11 m-80 hover:bg-zinc-900 bg-zinc-800 h-12 w-44 rounded-full relative shadow-lg overflow-hidden">
                    {/* Toggle bar with lamp effect */}
                    <div
                        className={`absolute top-0 left-6 h-0.5 w-12 rounded-full bg-white shadow-[2px_1px_18px_4px_rgba(255,255,255,0.8)] transition-all duration-400 ${activeTab === 'work' ? 'translate-x-0' : 'translate-x-[80px]'
                            }`}
                    ></div>

                    <div className="flex gap-9 content-center justify-center py-3 relative z-10">
                        {/* WORK Tab */}
                        <h1
                            className={`cursor-pointer font-medium transition-all duration-300 ${activeTab === 'work'
                                    ? 'text-white bg-opacity-30 '
                                    : 'text-gray-300 '
                                }`}
                            onClick={() => setActiveTab('work')}
                        >
                            WORK
                        </h1>
                        {/* INFO Tab */}
                        <h1
                            className={`cursor-pointer font-semibold transition-all duration-300 ${activeTab === 'info'
                                    ? 'text-white bg-opacity-30 '
                                    : 'text-gray-300'
                                }`}
                            onClick={() => setActiveTab('info')}
                        >
                            INFO
                        </h1>
                    </div>
                </div>
                <div className='flex gap-10 m-10 h-7 '>
                    <a href="/"><h1 className='flex gap-1 hover:text-zinc-400 hover:translate-x-1 transition-all'>Linkedin <MoveUpRight/></h1></a>
                    <a href="/"><h1 className='flex gap-1 hover:text-zinc-400 hover:translate-x-1 transition-all'>github <MoveUpRight/></h1></a>
                </div>



            </div>
            </nav>
        </>
    )
}

export default Header