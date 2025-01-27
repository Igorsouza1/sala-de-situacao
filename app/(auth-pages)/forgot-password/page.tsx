import Image from "next/image"
import Link from "next/link"
import { forgotPasswordAction } from "@/app/actions/authentication/actions"
import { FormMessage, type Message } from "@/components/auth/form-message"
import { SubmitButton } from "@/components/auth/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex min-h-screen w-full">
      {/* Coluna da esquerda com imagem */}
      <div className="hidden lg:flex lg:w-1/3 relative h-full">
        <Image
          src="/signin.png"
          alt="Rio da Prata"
          layout="fill"
          objectFit="cover"
          priority
          className="object-center"
        />
      </div>

      {/* Coluna da direita com formulário de recuperação de senha */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center min-h-screen bg-pantaneiro-green">
        <div className="w-full max-w-md space-y-12 px-8">
          <div className="flex justify-center">
            <Image
              src="/ihp-vertical-logo-2.png"
              alt="Logo Instituto Homem Pantaneiro"
              width={200}
              height={48}
              className="h-32 w-auto"
            />
          </div>

          <form className="space-y-8">
            <div>
              <h2 className="text-2xl font-medium text-white tracking-wide">Recuperar Senha</h2>
              <p className="text-sm text-white/80 mt-2">
                Já tem uma conta?{" "}
                <Link
                  className="text-pantaneiro-lime hover:text-pantaneiro-lime-hover underline transition-colors duration-200"
                  href="/sign-in"
                >
                  Entrar
                </Link>
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/90">
                  Email
                </Label>
                <Input
                  name="email"
                  id="email"
                  placeholder="joao@example.com"
                  required
                  className="w-full px-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-white/40 
                    focus:border-white/30 focus:ring-1 focus:ring-white/30 rounded-md
                    transition-all duration-200 hover:bg-white/[0.12]"
                />
              </div>
            </div>

            <SubmitButton
              formAction={forgotPasswordAction}
              className="w-full py-3 bg-pantaneiro-lime hover:bg-pantaneiro-lime-hover text-white font-medium 
                transition-all duration-200 rounded-md shadow-lg shadow-black/20
                hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
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

