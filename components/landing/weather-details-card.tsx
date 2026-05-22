"use client"

import { motion } from "framer-motion"
import { Thermometer, CloudRain, Gauge, Droplet, CloudDownload, Sun } from "lucide-react"

interface WeatherStatProps {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}

function WeatherStatItem({ label, value, icon: Icon }: WeatherStatProps) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-[12px] bg-black/[0.03] border border-black/[0.01] flex items-center justify-center text-[#1d1d1f]/75 flex-shrink-0">
        <Icon className="w-5 h-5 stroke-[1.75]" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-semibold tracking-wider text-[#1d1d1f]/40 uppercase truncate">
          {label}
        </span>
        <span className="text-[14px] font-semibold text-[#1d1d1f] mt-0.5 truncate">
          {value}
        </span>
      </div>
    </div>
  )
}

interface WeatherDetailsCardProps {
  className?: string;
  delay?: number;
  data?: {
    dewPoint?: string;
    precipRate?: string;
    pressure?: string;
    humidity?: string;
    precipAccum?: string;
    uv?: string;
  };
}

export default function WeatherDetailsCard({
  className = "",
  delay = 0.3,
  data = {},
}: WeatherDetailsCardProps) {
  const stats = [
    {
      label: "PONTO DE ORVALHO",
      value: data.dewPoint || "10.0 °C",
      icon: Thermometer,
    },
    {
      label: "TAXA DE PRECIP.",
      value: data.precipRate || "2.54 mm/hr",
      icon: CloudRain,
    },
    {
      label: "PRESSÃO",
      value: data.pressure || "1,044.94 hPa",
      icon: Gauge,
    },
    {
      label: "UMIDADE",
      value: data.humidity || "71%",
      icon: Droplet,
    },
    {
      label: "PRECIP. ACUM.",
      value: data.precipAccum || "12.3 mm",
      icon: CloudDownload,
    },
    {
      label: "UV",
      value: data.uv || "5.0",
      icon: Sun,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, rotate: -0.5 }}
      animate={{ 
        opacity: 1, 
        y: [0, -10, 0],
        x: [0, 4, 0],
        rotate: [-0.5, 0.5, -0.5],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: {
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        },
        x: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }
      }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50 }}
      className={`bg-white/85 backdrop-blur-lg border border-black/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[24px] p-6 w-full max-w-[440px] md:max-w-[480px] transition-shadow duration-300 ${className}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6 md:gap-x-10">
        {stats.map((stat, idx) => (
          <WeatherStatItem
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>
    </motion.div>
  )
}
