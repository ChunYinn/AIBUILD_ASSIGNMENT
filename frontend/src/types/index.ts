export interface User {
  id: string
  username: string
}

export interface Product {
  id: string
  name: string
  openingInventory: number
  procurementData: DayData[]
  salesData: DayData[]
}

export interface DayData {
  day: number
  quantity: number
  price: number
  amount: number // quantity * price
}

export interface ChartData {
  day: number
  inventory: number
  procurement: number
  sales: number
}

export interface ExcelData {
  productId: string
  productName: string
  openingInventory: number
  [key: string]: string | number // Dynamic columns for different days
}

export interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}