import Image from "next/image"
import Link from "next/link"
import { forgotPasswordAction } from "@/app/api/authentication/actions"
import { FormMessage, type Message } from "@/components/auth/form-message"
import { SubmitButton } from "@/components/auth/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A]">
      {/* Coluna da esquerda com imagem */}
      <div className="hidden lg:flex lg:w-1/4 relative h-full bg-slate-900">
        <Image
          src="/signin_novo.png"
          alt="Rio da Prata"
          layout="fill"
          objectFit="cover"
          priority
          className="object-center"
        />
      </div>

      {/* Coluna da direita com formulário de recuperação de senha */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center min-h-screen bg-[#0F172A] border-l border-white/5">
        <div className="w-full max-w-sm space-y-10 px-8">
          <div className="flex flex-col items-center space-y-2">
             <div className="mb-4">
               <Image 
                 src="/logo.png" 
                 alt="Logo Prisma" 
                 width={180} 
                 height={60} 
                 className="h-auto w-auto"
               />
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight text-center">Recuperar Senha</h2>
              <p className="text-sm text-slate-400 mt-2 text-center">
                Já tem uma conta?{" "}
                <Link
                  className="text-blue-500 hover:text-blue-400 transition-colors duration-200"
                  href="/sign-in"
                >
                  Entrar
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  name="email"
                  id="email"
                  placeholder="nome@organizacao.gov.br"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border-white/10 text-white placeholder:text-slate-600 
                    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-md
                    transition-all duration-200"
                />
              </div>
            </div>

            <SubmitButton
              formAction={forgotPasswordAction}
              className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-medium 
                transition-all duration-200 rounded-lg shadow-lg shadow-blue-900/20"
            >
              Recuperar Senha
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </div>
  )
}

