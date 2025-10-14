import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ProductImage { id: string; url: string; productId: string; main?: boolean }
export interface ProductComment { id: string; productId: string }
export interface Product {
  id: string
  title?: string
  price: number
  thumbnail?: ProductImage | null
  images?: ProductImage[]
  comments?: ProductComment[]
}

interface ProductsState {
  items: Product[]
  loading: boolean
  error: string | null
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchProducts = createAsyncThunk<Product[]>(
  'products/fetchAll',
  async () => {
    const res = await fetch('/api/products')
    if (!res.ok) throw new Error('Failed to load products')

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`Unexpected response format: ${text.slice(0, 80)}...`)
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }
)

export interface ProductSearchFilter {
  title?: string
  priceFrom?: number | string
  priceTo?: number | string
}

export const searchProducts = createAsyncThunk<Product[], ProductSearchFilter>(
  'products/search',
  async (filter) => {
    const params = new URLSearchParams()
    if (filter.title) params.set('title', filter.title)
    if (filter.priceFrom !== undefined && filter.priceFrom !== null && String(filter.priceFrom).length)
      params.set('priceFrom', String(filter.priceFrom))
    if (filter.priceTo !== undefined && filter.priceTo !== null && String(filter.priceTo).length)
      params.set('priceTo', String(filter.priceTo))

    const res = await fetch(`/api/products/search?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to search products')

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`Unexpected response format: ${text.slice(0, 80)}...`)
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Unknown error'
      })
      .addCase(searchProducts.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(searchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Unknown error'
      })
  },
})

export default productsSlice.reducer