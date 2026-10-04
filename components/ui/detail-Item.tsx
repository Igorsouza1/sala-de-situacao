import { ReactNode } from "react";




export const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: ReactNode }) => (
    <div className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-xs">
      <div className="shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-600 mb-1">{label}</span>
        <span className="text-base font-semibold text-gray-900 break-words">{value || "Não informado"}</span>
      </div>
    </div>
  )

  