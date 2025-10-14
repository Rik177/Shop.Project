export interface Product {
    id: string;
    price: number;
}

export interface IFetchProductsParams { 
    (setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>)
}