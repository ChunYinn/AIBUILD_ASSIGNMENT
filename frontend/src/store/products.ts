import { create } from 'zustand'
import type { Product, ExcelData } from '@/types'
import { api } from '@/lib/api'

interface ProductStore {
  products: Product[]
  selectedProducts: string[]
  loading: boolean
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  setSelectedProducts: (productIds: string[]) => void
  getSelectedProductsData: () => Product[]
  loadProductsFromAPI: () => Promise<void>
  processExcelData: (data: ExcelData[]) => Product[]
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  selectedProducts: [],
  loading: false,

  setProducts: (products) => set({ products }),
  
  addProduct: (product) => set((state) => ({ 
    products: [...state.products, product] 
  })),

  setSelectedProducts: (productIds) => set({ selectedProducts: productIds }),

  getSelectedProductsData: () => {
    const { products, selectedProducts } = get()
    return products.filter(product => selectedProducts.includes(product.id))
  },

  loadProductsFromAPI: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/upload/products')
      const apiProducts = response.data.products.map((product: any) => ({
        id: product.productId,
        name: product.name,
        openingInventory: product.openingInventory,
        procurementData: product.procurementData,
        salesData: product.salesData
      }))
      set({ products: apiProducts, loading: false })
    } catch (error) {
      console.error('Failed to load products from API:', error)
      set({ loading: false })
    }
  },

  processExcelData: (data) => {
    const products: Product[] = data.map((row: any, index) => {
      const procurementData = []
      const salesData = []
      
      // Figure out how many days of data we have
      const maxDays = Math.max(
        3, // minimum 3 days
        ...Object.keys(row).map(key => {
          const match = key.match(/[Dd]ay\s*(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
      );

      // Get the day-by-day data
      for (let day = 1; day <= maxDays; day++) {
        const procQty = Number(
          row[`Procurement Qty (Day ${day})`] || 
          row[`Procurement Qty Day ${day}`] || 
          row[`procurementQty_day${day}`] || 0
        )
        const procPrice = Number(
          row[`Procurement Price (Day ${day})`] || 
          row[`Procurement Price Day ${day}`] || 
          row[`procurementPrice_day${day}`] || 0
        )
        const salesQty = Number(
          row[`Sales Qty (Day ${day})`] || 
          row[`Sales Qty Day ${day}`] || 
          row[`salesQty_day${day}`] || 0
        )
        const salesPrice = Number(
          row[`Sales Price (Day ${day})`] || 
          row[`Sales Price Day ${day}`] || 
          row[`salesPrice_day${day}`] || 0
        )

        procurementData.push({
          day,
          quantity: procQty,
          price: procPrice,
          amount: procQty * procPrice
        })

        salesData.push({
          day,
          quantity: salesQty,
          price: salesPrice,
          amount: salesQty * salesPrice
        })
      }

      return {
        id: (
          row['ID'] || row['Product ID'] || row['ProductID'] || 
          row['id'] || row['product_id'] || row.productId || 
          `product-${index}`
        ).toString(),
        name: (
          row['Product Name'] || row['ProductName'] || row['Name'] || 
          row['product_name'] || row['name'] || row.productName || 
          `Product ${index + 1}`
        ).toString(),
        openingInventory: Number(
          row['Opening Inventory'] || row['Opening Inventory on Day 1'] || 
          row['opening_inventory'] || row['OpeningInventory'] || 
          row.openingInventory || 0
        ),
        procurementData,
        salesData
      }
    })

    set({ products })
    return products
  }
}))