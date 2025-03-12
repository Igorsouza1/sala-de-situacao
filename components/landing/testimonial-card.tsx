import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatarSrc: string
}

export function TestimonialCard({ quote, author, role, avatarSrc }: TestimonialCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="pt-6">
        <div className="mb-4 text-2xl text-[hsl(var(--pantaneiro-lime))]">"</div>
        <p className="mb-4 text-muted-foreground">{quote}</p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-4">
          <Image src={avatarSrc || "/placeholder.svg"} alt={author} width={40} height={40} className="rounded-full" />
          <div>
            <p className="font-medium">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

