import { DossieTemplate, DossieData } from "@/components/map/dossie-template"
import { getAcaoDossie } from "@/lib/service/acoesService"
import { notFound } from "next/navigation"

interface PrintDossiePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PrintDossiePage(props: PrintDossiePageProps) {
  const params = await props.params;
  const id = Number(params.id)

  if (isNaN(id)) {
    return notFound()
  }

  try {
    const dossie = await getAcaoDossie(id)
    
    // getAcaoDossie returns an object similar to DossieData but heavily "any" typed inside the service.
    // The service ensures the structure matches mostly what we want.
    // We cast it to ensure Typescript is happy passing to the template.
    
    return <DossieTemplate dossie={dossie as unknown as DossieData} isPrintMode={true} />
  } catch (error) {
    console.error(error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Erro ao gerar dossiê</h1>
        <p className="text-slate-600 mt-2">Não foi possível carregar os dados para impressão.</p>
        <p className="text-sm text-slate-500 mt-4 font-mono">{(error as Error).message}</p>
      </div>
    )
  }
}
