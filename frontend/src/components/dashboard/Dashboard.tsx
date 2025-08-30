import { useEffect } from 'react'
import { ProductSelector } from './ProductSelector'
import { DataChart } from './DataChart'
import { useProductStore } from '@/store/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, BarChart3, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export const Dashboard = () => {
  const { products, loadProductsFromAPI, loading } = useProductStore()

  useEffect(() => {
    // Load products from API when component mounts
    loadProductsFromAPI()
  }, [loadProductsFromAPI])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600">Loading your data...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your procurement and sales data into actionable insights with powerful visualizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
                <p className="text-sm text-gray-600">
                  Track inventory, procurement, and sales trends across multiple days
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Multi-Product Comparison</h3>
                <p className="text-sm text-gray-600">
                  Compare performance across different products in unified charts
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Excel Integration</h3>
                <p className="text-sm text-gray-600">
                  Import data directly from your existing Excel spreadsheets
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h3>
              <p className="text-gray-600 mb-8">Upload your Excel data to begin analyzing your business insights</p>
              
              <div className="flex justify-center max-w-md mx-auto">
                <Link to="/upload" className="w-full">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full h-12 text-base border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Excel Data
                  </Button>
                </Link>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Supports .xlsx and .xls files with unlimited days of data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Monitor your procurement, sales, and inventory performance
          </p>
        </div>

        {/* Main Analytics Card */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Product Selector */}
              <div className="lg:col-span-1">
                <ProductSelector />
              </div>

              {/* Main Chart Area */}
              <div className="lg:col-span-2 xl:col-span-3">
                <DataChart />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}