import { PropriedadeDossieTemplate, PropriedadeData } from "@/components/map/propriedade-dossie-template"
import { findPropriedadeDossieData } from "@/lib/repositories/propriedadesRepository"
import { notFound } from "next/navigation"

interface PrintPropriedadePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PrintPropriedadePage(props: PrintPropriedadePageProps) {
  const params = await props.params;
  const id = Number(params.id)

  if (isNaN(id)) {
    return notFound()
  }

  try {
    const rawData = await findPropriedadeDossieData(id)
    
    if (!rawData) {
        return notFound()
    }

    // Sanitize data for Client Component (convert Dates to strings)
    // Using JSON parse/stringify is a quick way to ensure serializable payload
    const data: PropriedadeData = JSON.parse(JSON.stringify(rawData))

    return <PropriedadeDossieTemplate data={data} isPrintMode={true} />
    
  } catch (error) {
    console.error(error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Erro ao gerar relatório</h1>
        <p className="text-slate-600 mt-2">Não foi possível carregar os dados da propriedade.</p>
        <p className="text-sm text-slate-500 mt-4 font-mono">{(error as Error).message}</p>
      </div>
    )
  }
}
