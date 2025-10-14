import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IProduct, IComment } from '@Shared/types';
import type { ProductsState } from '../../../types';

const initialState: ProductsState = {
  items: [],
  currentProduct: null,
  similarProducts: [],
  loading: false,
  error: null,
}

export const fetchProducts = createAsyncThunk<IProduct[]>(
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

export const searchProducts = createAsyncThunk<IProduct[], ProductSearchFilter>(
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

export const fetchProductById = createAsyncThunk<IProduct, string>(
  'products/fetchById',
  async (productId) => {
    const res = await fetch(`/api/products/${productId}`)
    if (!res.ok) throw new Error('Failed to load product')

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`Unexpected response format: ${text.slice(0, 80)}...`)
    }
    const data = await res.json()
    return data
  }
)

export const fetchSimilarProducts = createAsyncThunk<IProduct[], string>(
  'products/fetchSimilar',
  async (productId) => {
    const res = await fetch(`/api/products/similar/${productId}`)
    if (!res.ok) throw new Error('Failed to load similar products')

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`Unexpected response format: ${text.slice(0, 80)}...`)
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }
)

export const addComment = createAsyncThunk<{ message: string }, Omit<IComment, "id">>(
  'products/addComment',
  async (commentData) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    })
    
    if (!res.ok) throw new Error('Failed to add comment')
    
    const data = await res.text()
    return { message: data }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null
      state.similarProducts = []
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<IProduct[]>) => {
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
      .addCase(searchProducts.fulfilled, (state, action: PayloadAction<IProduct[]>) => {
        state.items = action.payload
        state.loading = false
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Unknown error'
      })
      .addCase(fetchProductById.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<IProduct>) => {
        state.currentProduct = action.payload
        state.loading = false
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Unknown error'
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action: PayloadAction<IProduct[]>) => {
        state.similarProducts = action.payload
      })
  },
})

export const { clearCurrentProduct } = productsSlice.actions
export default productsSlice.reducer