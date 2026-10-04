import { PropriedadeDossieTemplate, PropriedadeData } from "@/components/map/propriedade-dossie-template"
import { loadPrintPropriedade } from "@/lib/print/loaders"
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

  const rawData = await loadPrintPropriedade(id)
  const data: PropriedadeData = JSON.parse(JSON.stringify(rawData))
  return <PropriedadeDossieTemplate data={data} isPrintMode={true} />
}
