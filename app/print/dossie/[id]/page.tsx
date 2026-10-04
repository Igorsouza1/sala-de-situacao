import { DossieTemplate, DossieData } from "@/components/map/dossie-template"
import { loadPrintAcao } from "@/lib/print/loaders"
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

  const dossie = await loadPrintAcao(id)
  return <DossieTemplate dossie={dossie as unknown as DossieData} isPrintMode={true} />
}
