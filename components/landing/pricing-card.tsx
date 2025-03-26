import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

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
    <div
      className={`flex flex-col p-6 bg-white rounded-lg shadow-sm border ${
        popular ? "border-[#478D4F] ring-2 ring-[#478D4F] ring-opacity-50" : "border-[#D2E5B0]"
      } hover:shadow-md transition-shadow`}
    >
      {popular && (
        <div className="py-1 px-3 bg-[#478D4F] text-white text-xs font-semibold rounded-full w-fit mx-auto -mt-10 mb-4">
          Mais Popular
        </div>
      )}
      <h3 className="text-xl font-bold text-[#003C2C]">{title}</h3>
      <div className="mt-4 mb-2">
        <span className="text-3xl font-bold text-[#003C2C]">{price}</span>
        <span className="text-[#003C2C]/70 ml-1">/mês</span>
      </div>
      <p className="text-[#003C2C]/80 text-sm mb-6">{description}</p>
      <Button
        className={`w-full mb-6 ${
          popular ? "bg-[#478D4F] text-white hover:bg-[#569052]" : "bg-[#003C2C] text-white hover:bg-[#003C2C]/90"
        }`}
      >
        {buttonText}
      </Button>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-[#478D4F] mr-2 shrink-0" />
            <span className="text-sm text-[#003C2C]">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

