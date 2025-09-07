
import ProtectedPage from "@/app/protected/client-page";

export default async function Page() {

  async function getAcoesProps(){
    const acoes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/acoes?view=map`);
    const responseData = await acoes.json();

    // Verificação de sucesso
    if (!responseData.success) {
      // Se a API retornar erro, lançamos um erro para o Next.js
      throw new Error("Falha ao buscar dados de ações.");
    }
    // Retornamos apenas a parte de dados que o componente precisa
    
    return responseData.data;
  }


    const acoesProps = await getAcoesProps();

  return (
    <div>
      <ProtectedPage acoesProps={acoesProps} />
    </div>
  );
}
