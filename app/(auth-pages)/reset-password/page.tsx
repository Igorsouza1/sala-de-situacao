import { resetPasswordAction } from "@/app/api/authentication/actions";
import { FormMessage, type Message } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <>
      <div className="flex flex-col space-y-1.5 mb-8">
        <div className="mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Nova senha</h1>
        <p className="text-[15px] text-slate-500 font-medium">
          Escolha uma senha segura para sua conta.
        </p>
      </div>

      <form className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-bold text-slate-800">
              Nova senha
            </Label>
            <Input
              type="password"
              name="password"
              id="password"
              placeholder="••••••••"
              required
              className="w-full px-4 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-bold text-slate-800">
              Confirmar nova senha
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              placeholder="••••••••"
              required
              className="w-full px-4 h-11 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl
                transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>
        </div>

        <SubmitButton
          formAction={resetPasswordAction}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px]
            transition-all duration-200 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.25)]"
        >
          Redefinir senha
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </>
  );
}
