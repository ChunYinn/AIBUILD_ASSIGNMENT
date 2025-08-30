import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useProductStore } from '@/store/products'
import { Package } from 'lucide-react'

export const ProductSelector = () => {
  const { products, selectedProducts, setSelectedProducts } = useProductStore()
  const [selectAll, setSelectAll] = useState(false)

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  const clearSelection = () => {
    setSelectedProducts([])
    setSelectAll(false)
  }

  if (products.length === 0) {
    return (
      <Card className="border border-gray-200/60 shadow-sm bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-gray-900">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <span>Product Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file to start analyzing your data
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/upload'}
              className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              Upload Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200/60 shadow-sm bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-gray-900">Select Products</CardTitle>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {selectedProducts.length} of {products.length} selected
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Select All Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium text-gray-900 cursor-pointer">
              Select All
            </label>
          </div>
          
          {selectedProducts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Product List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id)
            
            return (
              <div
                key={product.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                  isSelected 
                    ? 'border-blue-300/60 bg-blue-50/60 shadow-sm' 
                    : 'border-gray-200/60 hover:border-gray-300/60 bg-white hover:bg-gray-50/30'
                }`}
                onClick={() => handleProductToggle(product.id, !isSelected)}
              >
                <Checkbox
                  id={product.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleProductToggle(product.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={product.id}
                    className="block text-sm font-semibold text-gray-900 cursor-pointer mb-1"
                  >
                    {product.name}
                  </label>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">ID:</span> {product.id} • <span className="font-medium">Stock:</span> {product.openingInventory.toLocaleString()} units
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {selectedProducts.length > 0 && (
          <div className="pt-3 border-t border-gray-200 bg-blue-50 -mx-6 -mb-6 px-6 py-3 rounded-b-xl">
            <p className="text-xs text-blue-700 font-medium text-center">
              Analyzing {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}