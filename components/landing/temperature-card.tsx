"use client"

import { Cloud } from "lucide-react"
import { motion } from "framer-motion"

interface TemperatureCardProps {
  value?: string;
  feelsLike?: string;
  className?: string;
  delay?: number;
}

export default function TemperatureCard({
  value = "15.4°C",
  feelsLike = "Sensação Térmica 15.4°C",
  className = "",
  delay = 0,
}: TemperatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, rotate: -1.5 }}
      animate={{ 
        opacity: 1, 
        y: [0, -12, 0],
        x: [0, 6, 0],
        rotate: [-1.5, -0.5, -1.5],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        },
        x: {
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }
      }}
      whileHover={{ scale: 1.04, rotate: -0.5, zIndex: 50 }}
      className={`flex items-center justify-between bg-white/85 backdrop-blur-lg border border-black/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[24px] p-6 w-full max-w-[320px] transition-shadow duration-300 ${className}`}
    >
      <div className="flex flex-col">
        <span className="text-[54px] font-light tracking-[-0.03em] leading-none text-[#1d1d1f]">
          {value}
        </span>
        <span className="text-[12px] text-[#1d1d1f]/40 font-medium mt-2.5">
          {feelsLike}
        </span>
      </div>

      <div className="relative w-16 h-10 flex items-center justify-center">
        {/* Back cloud (softer, lighter) */}
        <Cloud className="absolute top-0 right-4 w-9 h-9 text-[#1d1d1f]/10" />
        {/* Front cloud (darker, solid fill) */}
        <Cloud className="absolute bottom-0 right-1 w-11 h-11 text-[#1d1d1f]/75 fill-current" />
      </div>
    </motion.div>
  )
}
