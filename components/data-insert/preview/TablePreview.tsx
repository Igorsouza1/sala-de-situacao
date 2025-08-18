"use client"

interface TablePreviewProps {
  data: Record<string, any>
}

export function TablePreview({ data }: TablePreviewProps) {
  const entries = Object.entries(data).filter(([key]) => key !== "validated")

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-2 text-left font-medium">Campo</th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {value === null || value === undefined ? (
                  <span className="text-gray-400 italic">Não informado</span>
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
