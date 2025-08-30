import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useProductStore } from '@/store/products'
import type { ChartData } from '@/types'
import { TrendingUp } from 'lucide-react'

export const DataChart = () => {
  const { getSelectedProductsData } = useProductStore()
  const selectedProducts = getSelectedProductsData()

  const { chartData, maxDays } = useMemo(() => {
    if (selectedProducts.length === 0) return { chartData: [], maxDays: 3 }

    // Figure out the max days from all selected products
    const maxDaysValue = selectedProducts.reduce((max, product) => {
      const productMaxDay = Math.max(
        ...product.procurementData.map(p => p.day),
        ...product.salesData.map(s => s.day),
        3 // minimum 3 days
      );
      return Math.max(max, productMaxDay);
    }, 3);

    // Combine data from all products for each day
    const aggregatedData: ChartData[] = []
    
    for (let day = 1; day <= maxDaysValue; day++) {
      let totalInventory = 0
      let totalProcurement = 0
      let totalSales = 0

      selectedProducts.forEach(product => {
        // Calculate inventory for this day
        let currentInventory = product.openingInventory
        
        // Add procurement and subtract sales up to current day
        for (let d = 1; d <= day; d++) {
          const procurement = product.procurementData.find(p => p.day === d)
          const sales = product.salesData.find(s => s.day === d)
          
          if (procurement) currentInventory += procurement.quantity
          if (sales) currentInventory -= sales.quantity
        }

        totalInventory += currentInventory

        // Get procurement and sales amounts for current day
        const dayProcurement = product.procurementData.find(p => p.day === day)
        const daySales = product.salesData.find(s => s.day === day)

        if (dayProcurement) totalProcurement += dayProcurement.amount
        if (daySales) totalSales += daySales.amount
      })

      aggregatedData.push({
        day,
        inventory: totalInventory,
        procurement: totalProcurement,
        sales: totalSales
      })
    }

    return { chartData: aggregatedData, maxDays: maxDaysValue }
  }, [selectedProducts])

  if (selectedProducts.length === 0) {
    return (
      <Card className="border border-gray-200/60 shadow-sm bg-gradient-to-br from-white to-gray-50/30">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Select Products to Analyze</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Choose one or more products from the sidebar to visualize their procurement, sales, and inventory trends
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-gray-900 mb-3 text-base">{`Day ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-3 mb-2 last:mb-0">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.dataKey === 'inventory' && `Inventory: ${entry.value.toLocaleString()} units`}
                {entry.dataKey === 'procurement' && `Procurement: $${entry.value.toLocaleString()}`}
                {entry.dataKey === 'sales' && `Sales: $${entry.value.toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border border-gray-200/60 shadow-sm bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <CardTitle className="text-gray-900">Analytics Overview</CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Tracking {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} across {maxDays} day{maxDays !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      
      <CardContent className="pb-8">
        <div className="h-96 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="day" 
                tickFormatter={(value) => `Day ${value}`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px', color: '#374151' }}
              />
              
              {/* Inventory Line */}
              <Line
                type="monotone"
                dataKey="inventory"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                name="Inventory (Units)"
              />
              
              {/* Procurement Line */}
              <Line
                type="monotone"
                dataKey="procurement"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 0, r: 6 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                name="Procurement ($)"
              />
              
              {/* Sales Line */}
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 0, r: 6 }}
                activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                name="Sales ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50/60 rounded-lg p-4 text-center border border-blue-200/60 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {chartData[chartData.length - 1]?.inventory.toLocaleString() || 0}
            </div>
            <div className="text-sm text-blue-700 font-medium">Final Inventory</div>
            <div className="text-xs text-blue-600 mt-1">Units in stock</div>
          </div>
          <div className="bg-green-50/60 rounded-lg p-4 text-center border border-green-200/60 shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-1">
              ${chartData.reduce((sum, day) => sum + day.procurement, 0).toLocaleString()}
            </div>
            <div className="text-sm text-green-700 font-medium">Total Procurement</div>
            <div className="text-xs text-green-600 mt-1">{maxDays}-day spending</div>
          </div>
          <div className="bg-amber-50/60 rounded-lg p-4 text-center border border-amber-200/60 shadow-sm">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              ${chartData.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}
            </div>
            <div className="text-sm text-amber-700 font-medium">Total Sales</div>
            <div className="text-xs text-amber-600 mt-1">{maxDays}-day revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}