"use client"

import { motion } from "framer-motion"

interface WindCardProps {
  direction?: string;
  speed?: string;
  gust?: string;
  className?: string;
  delay?: number;
}

export default function WindCard({
  direction = "SE",
  speed = "3.2",
  gust = "4.8",
  className = "",
  delay = 0.15,
}: WindCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, rotate: 2 }}
      animate={{ 
        opacity: 1, 
        y: [0, -15, 0],
        x: [0, -8, 0],
        rotate: [2, 0, 2],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          duration: 8.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
        x: {
          duration: 6.8,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }
      }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 50 }}
      className={`flex flex-col justify-between items-center bg-white/85 backdrop-blur-lg border border-black/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[24px] p-5 w-full max-w-[160px] aspect-square transition-shadow duration-300 ${className}`}
    >
      {/* Dial SVG */}
      <div className="relative w-[72px] h-[72px] flex items-center justify-center">
        <svg width="72" height="72" viewBox="0 0 80 80" className="text-[#1d1d1f]">
          {/* Dial Ticks */}
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="1.5 2.5"
            fill="none"
            className="opacity-25"
          />
          {/* Center text */}
          <text
            x="40"
            y="43"
            textAnchor="middle"
            className="text-[11px] font-semibold fill-current font-sans tracking-tight"
          >
            {direction}
          </text>
          {/* Southeast Pointer Arrow */}
          <path
            d="M 52 56 L 61 61 L 56 52 Z"
            fill="currentColor"
            className="opacity-90"
          />
        </svg>
      </div>

      {/* Label and values */}
      <div className="text-center mt-3">
        <span className="block text-[9px] font-semibold tracking-wider text-[#1d1d1f]/40 uppercase mb-0.5">
          VENTO & RAJADA
        </span>
        <span className="text-[14px] font-medium text-[#1d1d1f]">
          {speed} / {gust} km/h
        </span>
      </div>
    </motion.div>
  )
}
