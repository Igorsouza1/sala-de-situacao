import { MapPin, Layers, BarChart2, FileText, Database, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FeatureCardProps {
  title: string
  description: string
  icon: string
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const getIcon = (iconName: string) => {
    const iconClass = "h-10 w-10 text-[hsl(var(--pantaneiro-lime))]"
    switch (iconName) {
      case "MapPin":
        return <MapPin className={iconClass} />
      case "Layers":
        return <Layers className={iconClass} />
      case "BarChart2":
        return <BarChart2 className={iconClass} />
      case "FileText":
        return <FileText className={iconClass} />
      case "Database":
        return <Database className={iconClass} />
      case "Shield":
        return <Shield className={iconClass} />
      default:
        return <MapPin className={iconClass} />
    }
  }

  return (
    <Card className="flex flex-col items-center text-center">
      <CardHeader>
        {getIcon(icon)}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

