import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { useAppDispatch, useAppSelector } from '../../redux/store/hooks';
import { fetchProducts } from '../../redux/slices/productsSlice';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { items: products, loading, error } = useAppSelector(s => s.products);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const totalCount = products.length;
    const totalPrice = useMemo(() => {
        return products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    }, [products]);

    return (
        <div className={styles.home}>
            <h1 className={ styles.home__title }>Shop.Client</h1>

        {loading && <div>Loading...</div>}
        {error && <div className={ styles.home__error }>{error}</div>}

        {!loading && !error && (
                <p className={ styles.home__info }>
                В базе данных находится <strong>{totalCount}</strong> товаров общей стоимостью <strong>{totalPrice}</strong>
            </p>
        )}

            <div className={styles.home__buttons}>
                <button className={ styles.home__button } onClick={() => navigate('/products-list')}>Перейти к списку товаров</button>
                <button className={ styles.home__button } onClick={() => window.open('/admin', '_blank', 'noopener,noreferrer')}>Перейти в систему администрирования</button>
            </div>
        </div>
        );
}

export default Home;


