import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: string[]
  buttonText: string
  popular?: boolean
}

export function PricingCard({ title, price, description, features, buttonText, popular = false }: PricingCardProps) {
  return (
    <Card className={`flex flex-col ${popular ? "border-[hsl(var(--pantaneiro-lime))] shadow-lg" : ""}`}>
      {popular && (
        <div className="rounded-t-lg bg-[hsl(var(--pantaneiro-lime))] py-1 text-center text-sm font-medium text-primary-foreground">
          Mais Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--pantaneiro-lime))]" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={popular ? "default" : "outline"}
          className={
            popular
              ? "w-full bg-[hsl(var(--pantaneiro-lime))] text-primary-foreground hover:bg-[hsl(var(--pantaneiro-lime-hover))]"
              : "w-full"
          }
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}

