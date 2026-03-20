import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1500px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 flex flex-col lg:flex-row p-2.5 min-h-[600px]">
        {/* Left Side - Image matching the requested aesthetic */}
        <div className="hidden lg:flex lg:w-1/2 relative rounded-[1.5rem] overflow-hidden bg-slate-900">
          <Image
            src="/signin_novo.jpg"
            alt="Prisma Auth Background"
            fill
            className="object-cover"
            priority
          />
       
          {/* Asterisk top-left matching the design mockup */}
          <div className="absolute top-10 left-10 text-white">
            <Image
              src="/logo.png"
              alt="Prisma Logo"
              width={100}
              height={100}
            />
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-6 sm:px-12 bg-white rounded-r-[2rem]">
          <div className="w-full max-w-[340px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
