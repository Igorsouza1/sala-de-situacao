'use client'

import { useState } from 'react'
import { YearFilter } from './YearFilter'
import { RevenueChart } from './charts/revenue-chart'
import { UserGrowthChart } from './charts/user-growth-chart'
import { ProductSalesChart } from './charts/product-sales-chart'

export function DashboardContent() {
  const [selectedYear, setSelectedYear] = useState<string>('all')

  return (
    <div>
      <YearFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <RevenueChart selectedYear={selectedYear} />
        <UserGrowthChart selectedYear={selectedYear} />
        <ProductSalesChart selectedYear={selectedYear} />
      </div>
    </div>
  )
}
