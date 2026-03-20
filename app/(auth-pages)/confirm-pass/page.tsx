import { completeInviteAction } from "@/app/api/authentication/actions";
import { FormMessage, type Message } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Invite(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <>
      <div className="flex flex-col space-y-1.5 mb-8">
        <div className="mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600">
            <path d="M12 5v14M18.364 8.636l-12.728 12.728M18.364 15.364 5.636 2.636" />
          </svg>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">
          Ative sua conta
        </h1>
      </div>

      <form className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[13px] font-bold text-slate-800">
              Nome
            </Label>
            <Input
              name="name"
              id="name"
              placeholder="Seu nome"
              required
              className="w-full px-4 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-bold text-slate-800">
              Senha
            </Label>
            <Input
              type="password"
              name="password"
              id="password"
              required
              placeholder="••••••••"
              className="w-full px-4 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-slate-800">
              Confirmar Senha
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              placeholder="••••••••"
              className="w-full px-4 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>
        </div>

        <SubmitButton
          formAction={completeInviteAction}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px]
            transition-all duration-200 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.25)]"
        >
          Salvar
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </>
  );
}