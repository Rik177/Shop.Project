
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/store/hooks'
import { fetchProducts, searchProducts } from '../../redux/slices/productsSlice'

import styles from './ProductsList.module.css';

const placeholder = '/product-placeholder.png'

const ProductsList: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items, loading, error } = useAppSelector(s => s.products);

    const [title, setTitle] = useState('');
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');

    useEffect(() => {
        dispatch(fetchProducts())
    }, [dispatch]);

    const total = items.length;
    const visibleItems = items;

    const onSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        dispatch(searchProducts({
            title: title || undefined,
            priceFrom: priceFrom || undefined,
            priceTo: priceTo || undefined,
        }))
    };

    const onReset = () => {
        setTitle('')
        setPriceFrom('')
        setPriceTo('')
        dispatch(fetchProducts())
    };

    return (
        <div className={ styles.productsCatalogue }>
        <h1>Список товаров ({total})</h1>

        <form onSubmit={onSearch} className={ styles.productsCatalogue__searchForm }>
                <div className={ styles.productsCatalogue__fieldContainer }>
                <label htmlFor="title">Название:</label>
                <input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: iPhone" />
            </div>
            <div className={ styles.productsCatalogue__fieldContainer }>
                <label htmlFor="from">Цена от:</label>
                <input id="from" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} inputMode="numeric" placeholder="0" />
            </div>
            <div className={ styles.productsCatalogue__fieldContainer }>
                <label htmlFor="to">Цена до:</label>
                <input id="to" value={priceTo} onChange={e => setPriceTo(e.target.value)} inputMode="numeric" placeholder="100000" />
            </div>

            <button type="submit" disabled={loading}>Найти</button>
            <button type="button" onClick={onReset} disabled={loading}>Сбросить</button>
        </form>

        {loading && <div>Загрузка...</div>}
        {error && <div className={ styles.productsCatalogue }>{error}</div>}

        {!loading && !error && (
            <div className={ `${styles.productsCatalogue__productsList} ${ styles.productsList }` }>
            {visibleItems.map(p => {
                const imgUrl = p.thumbnail?.url || placeholder
                const commentsCount = p.comments?.length || 0
                return (
                    <div key={p.id} className={  styles.productsList__card }>
                        <Link to={`/${p.id}`} className={  styles.productsList__link }>
                            <img src={imgUrl} alt={p.title || 'image'} className={ styles.productsList__thumb } onError={(e) => { (e.target as HTMLImageElement).src = placeholder }} />
                    </Link>
                    <div className={  styles.productsList__info }>
                        <Link to={`/${p.id}`} className={  styles.productsList__link }>
                                <div className={ styles.productsList__title }>{p.title || 'Без названия'}</div>
                        </Link>
                        <div className={ styles.productsList__price }>{Number(p.price) || 0} ₽</div>
                        <div className={ styles.productsList__meta }>Комментариев: {commentsCount}</div>
                    </div>
                </div>
                )
            })}
            </div>
        )}
        </div>
    )
}

export default ProductsList