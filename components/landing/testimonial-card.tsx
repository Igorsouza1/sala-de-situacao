import Image from "next/image"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatarSrc: string
}

export function TestimonialCard({ quote, author, role, avatarSrc }: TestimonialCardProps) {
  return (
    <div className="flex flex-col p-6 bg-white rounded-lg shadow-sm border border-[#003C2C]/10 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <svg
          className="h-6 w-6 text-[#478D4F]"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="text-[#003C2C] mb-4">{quote}</p>
      <div className="mt-auto flex items-center">
        <Image
          src={avatarSrc || "/placeholder.svg"}
          alt={author}
          width={40}
          height={40}
          className="rounded-full mr-3 border-2 border-[#D2E5B0]"
        />
        <div>
          <h4 className="font-semibold text-[#003C2C]">{author}</h4>
          <p className="text-xs text-[#003C2C]/70">{role}</p>
        </div>
      </div>
    </div>
  )
}

