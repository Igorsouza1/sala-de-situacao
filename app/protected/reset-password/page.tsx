import { resetPasswordAction } from "@/app/api/authentication/actions";
import { FormMessage, Message } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex flex-col w-full max-w-md p-4 gap-2 [&>input]:mb-4">
      <h1 className="text-2xl font-medium">Resetar a senha</h1>
      <p className="text-sm text-foreground/60">
        Por favor escolha sua nova senha a baixo
      </p>
      <Label htmlFor="password">Nova Senha</Label>
      <Input
        type="password"
        name="password"
        placeholder="Nova password"
        required
      />
      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirme a senha"
        required
      />
      <SubmitButton formAction={resetPasswordAction}>
        Resetar Senha
      </SubmitButton>
      <FormMessage message={searchParams} />
    </form>
  );
}
