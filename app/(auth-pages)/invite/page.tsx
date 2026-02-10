import Image from "next/image";
import { completeInviteAction } from "@/app/api/authentication/actions";
import { FormMessage, type Message } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InviteSession from "./invite-session";

export default async function Invite(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen w-full bg-brand-dark">
      <InviteSession />
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

      {/* Coluna da direita com formulário */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center min-h-screen bg-brand-dark border-l border-white/5">
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
              <h2 className="text-2xl font-semibold text-white tracking-tight text-center">
                Ative sua conta
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Nome
                </Label>
                <Input
                  name="full_name"
                  id="name"
                  placeholder="Seu nome"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border-white/10 text-white placeholder:text-slate-600 
                    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-md
                    transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Senha
                </Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border-white/10 text-white placeholder:text-slate-600 
                    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-md
                    transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Confirmar Senha
                </Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border-white/10 text-white placeholder:text-slate-600 
                    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-md
                    transition-all duration-200"
                />
              </div>
            </div>

            <SubmitButton
              formAction={completeInviteAction}
              className="w-full py-3 bg-brand-primary hover:bg-blue-600 text-white font-medium 
                transition-all duration-200 rounded-lg shadow-lg shadow-blue-900/20"
            >
              Salvar
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </div>
  );
}