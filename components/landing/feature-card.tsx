import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Layers, BarChart3, Database, FileText, Shield, TrendingUp, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap = {
  MapPin,
  Layers,
  BarChart3,
  Database,
  FileText,
  Shield,
  TrendingUp,
  Lock,
}

interface FeatureCardProps {
  title: string
  description: string
  icon: keyof typeof iconMap
  className?: string
}

export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  const IconComponent = iconMap[icon]

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
      <CardContent className="p-8">
        <div className="w-12 h-12 bg-[#003C2C]/10 rounded-xl flex items-center justify-center mb-6">
          <IconComponent className="h-6 w-6 text-[#003C2C]" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
