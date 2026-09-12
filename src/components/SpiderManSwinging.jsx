import React from 'react'

/**
 * SpiderManSwinging - Animated Spider-Man swinging back and forth across the screen
 */
export default function SpiderManSwinging() {
    return (
        <div className="w-full max-w-lg mx-auto my-2 py-4 overflow-hidden relative select-none pointer-events-none">
            {/* Inline CSS animations for Spider-Man swinging arc */}
            <style>{`
                @keyframes spiderSwingArc {
                    0% {
                        transform: translateX(-140px) translateY(-10px) rotate(-28deg);
                    }
                    50% {
                        transform: translateX(140px) translateY(-10px) rotate(28deg);
                    }
                    100% {
                        transform: translateX(-140px) translateY(-10px) rotate(-28deg);
                    }
                }

                @keyframes webFlex {
                    0%, 100% { stroke-dashoffset: 0; transform: scaleY(1); }
                    50% { stroke-dashoffset: 10; transform: scaleY(1.05); }
                }

                @keyframes spiderPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                }

                .animate-spider-swing {
                    transform-origin: top center;
                    animation: spiderSwingArc 4s ease-in-out infinite;
                }

                .animate-spider-body {
                    animation: spiderPulse 2s ease-in-out infinite;
                }
            `}</style>

            {/* Swing Container */}
            <div className="relative h-44 flex items-start justify-center pt-2">
                
                {/* Ceiling Anchor Point */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-300/40 border border-slate-400/30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></div>
                </div>

                {/* Pendulum Swinging Wrapper */}
                <div className="animate-spider-swing relative flex flex-col items-center origin-top">

                    {/* Web Line (White Glowing Thread) */}
                    <svg className="w-1 h-24 overflow-visible" viewBox="0 0 2 96" fill="none">
                        <line 
                            x1="1" y1="0" x2="1" y2="96" 
                            stroke="#FFFFFF" 
                            strokeWidth="2.5" 
                            strokeDasharray="4 2"
                            className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" 
                        />
                        <line 
                            x1="1" y1="0" x2="1" y2="96" 
                            stroke="#38BDF8" 
                            strokeWidth="1" 
                            opacity="0.6"
                        />
                    </svg>

                    {/* Spider-Man Figure */}
                    <div className="animate-spider-body relative -mt-1 cursor-pointer pointer-events-auto hover:scale-110 transition-transform">
                        
                        {/* Web Splat Particle */}
                        <span className="absolute -top-3 -right-4 text-xs font-black text-sky-400 opacity-80 select-none animate-bounce">
                            🕸️
                        </span>

                        <svg width="84" height="96" viewBox="0 0 84 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Shadow under Spidey */}
                            <ellipse cx="42" cy="92" rx="20" ry="3" fill="#000" fillOpacity="0.12" />

                            {/* Left Arm Holding Web Line */}
                            <path d="M42 28 L42 2 L38 2" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
                            <path d="M38 4 L44 4" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />

                            {/* Right Arm Extended with Web Shooter Pose */}
                            <path d="M52 32 C 64 28, 74 20, 78 14" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
                            {/* Hand shooting web */}
                            <circle cx="79" cy="13" r="3.5" fill="#EF4444" />
                            {/* Web burst lines from hand */}
                            <path d="M80 12 L84 8 M81 15 L85 17 M78 10 L81 5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

                            {/* Torso & Suit */}
                            {/* Blue Side Panels */}
                            <path d="M32 30 C 30 40, 32 50, 34 54 L50 54 C 52 50, 54 40, 52 30 Z" fill="#0284C7" />
                            {/* Red Chest & Abdomen */}
                            <path d="M34 26 C 34 20, 50 20, 50 26 L48 52 C 45 54, 39 54, 36 52 Z" fill="#EF4444" />

                            {/* Spider Web Pattern on Suit */}
                            <path d="M42 24 L42 50 M36 30 L48 30 M35 38 L49 38 M37 46 L47 46" stroke="#1E293B" strokeWidth="1" strokeOpacity="0.4" />

                            {/* Iconic Black Spider Logo on Chest */}
                            <ellipse cx="42" cy="34" rx="2.5" ry="4" fill="#0F172A" />
                            <path d="M42 32 L36 28 M42 32 L48 28 M42 34 L35 34 M42 34 L49 34 M42 36 L36 40 M42 36 L48 40 M42 37 L37 43 M42 37 L47 43" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />

                            {/* Legs in Mid-Air Athletic Pose */}
                            {/* Bent Left Leg */}
                            <path d="M36 52 L24 64 L16 58" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 58 L12 62" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />

                            {/* Extended Right Leg */}
                            <path d="M48 52 L58 68 L68 80" stroke="#0284C7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M68 80 L74 84" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />

                            {/* Spider-Man Head & Mask */}
                            <ellipse cx="42" cy="18" rx="13" ry="14" fill="#EF4444" />

                            {/* Web Net on Mask */}
                            <path d="M42 4 L42 32 M30 18 L54 18 M33 10 L51 26 M33 26 L51 10" stroke="#1E293B" strokeWidth="0.8" strokeOpacity="0.35" />

                            {/* Iconic White Mask Eyes with Thick Black Border */}
                            {/* Left Eye */}
                            <path d="M32 14 C 33 10, 39 12, 40 18 C 37 19, 33 18, 32 14 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />
                            {/* Right Eye */}
                            <path d="M52 14 C 51 10, 45 12, 44 18 C 47 19, 51 18, 52 14 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />

                        </svg>
                    </div>

                </div>
            </div>

            {/* Background Web Motif */}
            <div className="w-full text-center text-xs font-bold text-slate-400/60 mt-1 flex items-center justify-center gap-1">
                <span>🕸️ Spider-Man đang sẵn sàng! 🕸️</span>
            </div>
        </div>
    )
}
