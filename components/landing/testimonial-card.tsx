import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatarSrc: string
  className?: string
}

export function TestimonialCard({ quote, author, role, avatarSrc, className }: TestimonialCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
      <CardContent className="p-8">
        <Quote className="h-8 w-8 text-[#003C2C]/20 mb-6" />
        <blockquote className="text-slate-700 leading-relaxed mb-6">"{quote}"</blockquote>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={author} />
            <AvatarFallback className="bg-[#003C2C] text-white">
              {author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-slate-900">{author}</div>
            <div className="text-sm text-slate-600">{role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
