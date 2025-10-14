import type { IProduct } from "@Shared/types";

export interface IFetchProductsParams { 
    (setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>): void
}

export interface ProductsState {
    items: IProduct[]
    currentProduct: IProduct | null
    similarProducts: IProduct[]
    loading: boolean
    error: string | null
}