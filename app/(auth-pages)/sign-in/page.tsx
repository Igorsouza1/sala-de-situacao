import Image from "next/image"
import Link from "next/link"
import { signInAction } from "@/app/api/authentication/actions"
import { FormMessage, type Message } from "@/components/auth/form-message"
import { SubmitButton } from "@/components/auth/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function Login(props: { searchParams: Promise<Message> }) {
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

      {/* Coluna da direita com formulário de login */}
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
              <h2 className="text-2xl font-medium text-white tracking-wide">Entre com sua conta</h2>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/90">
                    Senha
                  </Label>
                  <Link
                    className="text-sm text-white/80 hover:text-white transition-colors duration-200"
                    href="/forgot-password"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="w-full px-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-white/40 
                    focus:border-white/30 focus:ring-1 focus:ring-white/30 rounded-md
                    transition-all duration-200 hover:bg-white/[0.12]"
                />
              </div>
            </div>

            <SubmitButton
              pendingText="Entrando..."
              formAction={signInAction}
              className="w-full py-3 bg-pantaneiro-lime hover:bg-pantaneiro-lime-hover text-white font-medium 
                transition-all duration-200 rounded-md shadow-lg shadow-black/20
                hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
            >
              Entrar
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </div>
  )
}

