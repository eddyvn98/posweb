import React from 'react'

/**
 * CatFamilyWalk - Cute animated SVG mother cat and kittens parade
 */
export default function CatFamilyWalk() {
    return (
        <div className="w-full max-w-md mx-auto my-2 py-4 overflow-hidden relative select-none">
            {/* Inline CSS animation styles for walking, tail wagging, legs stepping */}
            <style>{`
                @keyframes catWalkParade {
                    0% { transform: translateX(-110%) scaleX(1); }
                    48% { transform: translateX(110%) scaleX(1); }
                    50% { transform: translateX(110%) scaleX(-1); }
                    98% { transform: translateX(-110%) scaleX(-1); }
                    100% { transform: translateX(-110%) scaleX(1); }
                }

                @keyframes legStepFront {
                    0%, 100% { transform: rotate(-18deg); }
                    50% { transform: rotate(18deg); }
                }

                @keyframes legStepBack {
                    0%, 100% { transform: rotate(18deg); }
                    50% { transform: rotate(-18deg); }
                }

                @keyframes tailWag {
                    0%, 100% { transform: rotate(-8deg); }
                    50% { transform: rotate(15deg); }
                }

                @keyframes bodyBob {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-3px); }
                }

                @keyframes kittenBounce {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(3deg); }
                }

                @keyframes heartFloat {
                    0% { transform: translateY(0) scale(0.6); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-20px) scale(1.1); opacity: 0; }
                }

                .animate-cat-parade {
                    animation: catWalkParade 16s ease-in-out infinite;
                }
                .animate-leg-front {
                    transform-origin: top center;
                    animation: legStepFront 0.4s ease-in-out infinite;
                }
                .animate-leg-back {
                    transform-origin: top center;
                    animation: legStepBack 0.4s ease-in-out infinite;
                }
                .animate-tail {
                    transform-origin: bottom left;
                    animation: tailWag 0.8s ease-in-out infinite;
                }
                .animate-body-bob {
                    animation: bodyBob 0.4s ease-in-out infinite;
                }
                .animate-kitten-1 {
                    animation: kittenBounce 0.45s ease-in-out infinite 0.1s;
                }
                .animate-kitten-2 {
                    animation: kittenBounce 0.4s ease-in-out infinite 0.2s;
                }
                .animate-kitten-3 {
                    animation: kittenBounce 0.5s ease-in-out infinite 0.05s;
                }
                .animate-heart-1 {
                    animation: heartFloat 2s ease-out infinite 0.2s;
                }
                .animate-heart-2 {
                    animation: heartFloat 2.4s ease-out infinite 1.1s;
                }
            `}</style>

            {/* Parade Container */}
            <div className="relative h-24 flex items-end justify-center">
                {/* Walking Parade SVG */}
                <div className="animate-cat-parade absolute bottom-2 left-0 flex items-end gap-2.5 cursor-pointer hover:scale-105 transition-transform">

                    {/* --- 1. MOTHER CAT (MÈO MẸ) --- */}
                    <div className="relative animate-body-bob">
                        {/* Floating heart above mother cat */}
                        <span className="absolute -top-5 left-5 text-rose-400 text-xs font-bold animate-heart-1">♥</span>
                        <svg width="64" height="56" viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Shadows */}
                            <ellipse cx="36" cy="60" rx="30" ry="3" fill="#000" fillOpacity="0.08" />

                            {/* Tail */}
                            <path
                                className="animate-tail"
                                d="M12 40 C 4 38, 2 24, 8 18 C 10 16, 13 18, 11 22 C 7 28, 10 34, 16 38 Z"
                                fill="#FB923C"
                            />

                            {/* Back Legs */}
                            <g className="animate-leg-back">
                                <rect x="18" y="44" width="7" height="16" rx="3.5" fill="#E5E7EB" />
                                <rect x="42" y="44" width="7" height="16" rx="3.5" fill="#E5E7EB" />
                            </g>

                            {/* Body (Orange & White Calico/Tabby) */}
                            <rect x="14" y="26" width="44" height="24" rx="12" fill="#F97316" />
                            {/* White belly patch */}
                            <ellipse cx="36" cy="40" rx="16" ry="8" fill="#FFF" />
                            {/* Tabby stripes */}
                            <path d="M26 26 L29 32 M34 26 L36 33 M42 26 L43 32" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Front Legs */}
                            <g className="animate-leg-front">
                                <rect x="23" y="45" width="7" height="16" rx="3.5" fill="#FFF" />
                                <rect x="47" y="45" width="7" height="16" rx="3.5" fill="#FFF" />
                            </g>

                            {/* Head */}
                            <circle cx="52" cy="22" r="15" fill="#F97316" />

                            {/* Ears */}
                            <path d="M42 12 L46 2 L52 10 Z" fill="#F97316" />
                            <path d="M44 11 L47 4 L51 9 Z" fill="#FCA5A5" />

                            <path d="M56 10 L63 3 L65 13 Z" fill="#F97316" />
                            <path d="M57 11 L62 5 L64 12 Z" fill="#FCA5A5" />

                            {/* Face */}
                            {/* Eyes (Happy Closed Archs) */}
                            <path d="M48 20 Q51 16 54 20" stroke="#431407" strokeWidth="2" strokeLinecap="round" fill="none" />
                            <path d="M58 20 Q61 16 64 20" stroke="#431407" strokeWidth="2" strokeLinecap="round" fill="none" />

                            {/* Cute Pink Nose & Mouth */}
                            <polygon points="56,23 58,23 57,25" fill="#F43F5E" />
                            <path d="M55 25 Q57 27 57 25 Q57 27 59 25" stroke="#431407" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                            {/* Cheeks */}
                            <circle cx="47" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
                            <circle cx="64" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />

                            {/* Whiskers */}
                            <path d="M64 22 L71 20 M64 24 L70 25" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M45 22 L38 20 M45 24 L39 25" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />

                            {/* Collar with Little Yellow Bell */}
                            <path d="M44 32 Q54 36 60 30" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
                            <circle cx="53" cy="34" r="3" fill="#FACC15" />
                        </svg>
                    </div>


                    {/* --- 2. KITTEN 1 (MÈO CON 1 - ORANGE TABBY) --- */}
                    <div className="relative animate-kitten-1">
                        <svg width="42" height="38" viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="24" cy="41" rx="18" ry="2.5" fill="#000" fillOpacity="0.08" />

                            {/* Tail */}
                            <path className="animate-tail" d="M8 28 C 3 24, 2 16, 6 12 C 7 11, 9 13, 8 15 C 5 19, 6 24, 10 26 Z" fill="#F97316" />

                            {/* Legs */}
                            <g className="animate-leg-back">
                                <rect x="12" y="30" width="5" height="11" rx="2.5" fill="#E5E7EB" />
                                <rect x="28" y="30" width="5" height="11" rx="2.5" fill="#E5E7EB" />
                            </g>
                            {/* Body */}
                            <rect x="10" y="18" width="28" height="16" rx="8" fill="#FB923C" />
                            <ellipse cx="24" cy="27" rx="10" ry="5" fill="#FFF" />

                            <g className="animate-leg-front">
                                <rect x="15" y="31" width="5" height="11" rx="2.5" fill="#FFF" />
                                <rect x="31" y="31" width="5" height="11" rx="2.5" fill="#FFF" />
                            </g>

                            {/* Head */}
                            <circle cx="34" cy="15" r="10" fill="#FB923C" />
                            {/* Ears */}
                            <path d="M28 8 L30 1 L35 7 Z" fill="#FB923C" />
                            <path d="M29 7 L30 3 L34 6 Z" fill="#FCA5A5" />
                            <path d="M37 7 L42 2 L43 9 Z" fill="#FB923C" />

                            {/* Face */}
                            <circle cx="32" cy="14" r="1.5" fill="#431407" />
                            <circle cx="38" cy="14" r="1.5" fill="#431407" />
                            <polygon points="34,16 36,16 35,17.5" fill="#F43F5E" />
                            <circle cx="30" cy="16" r="1.5" fill="#FDA4AF" opacity="0.8" />
                            <circle cx="40" cy="16" r="1.5" fill="#FDA4AF" opacity="0.8" />
                        </svg>
                    </div>


                    {/* --- 3. KITTEN 2 (MÈO CON 2 - WHITE & PINK WITH FISH) --- */}
                    <div className="relative animate-kitten-2">
                        {/* Tiny floating fish item above kitten 2 */}
                        <span className="absolute -top-4 left-3 text-[10px] animate-heart-2">🐟</span>
                        <svg width="38" height="35" viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="22" cy="38" rx="16" ry="2" fill="#000" fillOpacity="0.08" />

                            {/* Tail */}
                            <path className="animate-tail" d="M6 26 C 2 22, 2 15, 6 11 C 7 10, 8 12, 7 14 C 4 17, 5 21, 8 24 Z" fill="#9CA3AF" />

                            {/* Legs */}
                            <g className="animate-leg-back">
                                <rect x="10" y="28" width="4.5" height="10" rx="2" fill="#D1D5DB" />
                                <rect x="25" y="28" width="4.5" height="10" rx="2" fill="#D1D5DB" />
                            </g>

                            {/* Body (White with gray patch) */}
                            <rect x="8" y="16" width="26" height="15" rx="7.5" fill="#F9FAFB" />
                            <circle cx="16" cy="22" r="5" fill="#9CA3AF" />

                            <g className="animate-leg-front">
                                <rect x="13" y="29" width="4.5" height="10" rx="2" fill="#FFF" />
                                <rect x="28" y="29" width="4.5" height="10" rx="2" fill="#FFF" />
                            </g>

                            {/* Head */}
                            <circle cx="30" cy="14" r="9.5" fill="#F9FAFB" />
                            <path d="M24 7 L26 1 L30 6 Z" fill="#9CA3AF" />
                            <path d="M33 6 L38 1 L39 8 Z" fill="#F9FAFB" />

                            {/* Face */}
                            <circle cx="28" cy="13" r="1.3" fill="#1F2937" />
                            <circle cx="34" cy="13" r="1.3" fill="#1F2937" />
                            <polygon points="30,15 32,15 31,16.5" fill="#F43F5E" />
                            <circle cx="26" cy="15" r="1.5" fill="#FDA4AF" />
                            <circle cx="36" cy="15" r="1.5" fill="#FDA4AF" />
                        </svg>
                    </div>


                    {/* --- 4. KITTEN 3 (MÈO CON 3 - LITTLE YELLOW BABY) --- */}
                    <div className="relative animate-kitten-3">
                        <svg width="34" height="31" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="20" cy="34" rx="14" ry="2" fill="#000" fillOpacity="0.08" />

                            {/* Tail */}
                            <path className="animate-tail" d="M6 23 C 2 20, 2 13, 5 10 C 6 9, 7 11, 6 12 C 4 15, 4 19, 7 21 Z" fill="#F59E0B" />

                            {/* Legs */}
                            <g className="animate-leg-back">
                                <rect x="9" y="25" width="4" height="9" rx="2" fill="#FDE68A" />
                                <rect x="23" y="25" width="4" height="9" rx="2" fill="#FDE68A" />
                            </g>

                            {/* Body (Yellow Tabby) */}
                            <rect x="7" y="14" width="24" height="13" rx="6.5" fill="#FBBF24" />
                            <ellipse cx="19" cy="21" rx="8" ry="4" fill="#FFF" />

                            <g className="animate-leg-front">
                                <rect x="12" y="26" width="4" height="9" rx="2" fill="#FFF" />
                                <rect x="26" y="26" width="4" height="9" rx="2" fill="#FFF" />
                            </g>

                            {/* Head */}
                            <circle cx="27" cy="12" r="8.5" fill="#FBBF24" />
                            <path d="M22 6 L24 0 L27 5 Z" fill="#FBBF24" />
                            <path d="M30 5 L34 1 L35 7 Z" fill="#FBBF24" />

                            {/* Face */}
                            <path d="M24 11 Q26 9 27 11" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                            <path d="M29 11 Q30 9 32 11" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                            <polygon points="27,13 29,13 28,14" fill="#F43F5E" />
                        </svg>
                    </div>

                </div>
            </div>

            {/* Grass & Footprints Trail Line */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-200/60 to-transparent rounded-full mt-1 relative opacity-60">
                <div className="absolute inset-0 flex justify-around text-[9px] text-amber-400/80 select-none">
                    <span>🐾</span>
                    <span>🐾</span>
                    <span>🐾</span>
                    <span>🐾</span>
                </div>
            </div>
        </div>
    )
}
