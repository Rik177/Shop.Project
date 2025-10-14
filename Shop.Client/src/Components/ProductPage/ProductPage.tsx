import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ProductPage.module.css';
import { useAppDispatch, useAppSelector } from '../../redux/store/hooks';
import { fetchProductById, fetchSimilarProducts, addComment, clearCurrentProduct } from '../../redux/slices/productsSlice';

const ProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { currentProduct, similarProducts, loading, error } = useAppSelector(s => s.products);
    
    const [commentForm, setCommentForm] = useState({
        name: '',
        email: '',
        body: ''
    });

    useEffect(() => {
        if (id) {
            dispatch(fetchProductById(id));
            dispatch(fetchSimilarProducts(id));
        }
        
        return () => {
            dispatch(clearCurrentProduct());
        };
    }, [id, dispatch]);

    const handleSimilarProductClick = (productId: string) => {
        navigate(`/${productId}`);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        
        await dispatch(addComment({
            productId: id,
            name: commentForm.name,
            email: commentForm.email,
            body: commentForm.body
        }));
        
        
        setCommentForm({ name: '', email: '', body: '' });
        
        
        dispatch(fetchProductById(id));
    };

    const handleCommentChange = (field: string, value: string) => {
        setCommentForm(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>Ошибка: {error}</div>;
    }

    if (!currentProduct) {
        return <div className={styles.error}>Товар не найден</div>;
    }

    return (
        <div className={styles.productPage}>
            <div className={styles.product}>
                {/* Заголовок товара */}
                <h1 className={styles.product__title}>{currentProduct.title}</h1>
                
                {/* Основная информация о товаре */}
                <div className={styles.product__main}>
                    <div className={styles.product__images}>
                        {/* Изображение-обложка */}
                        <div className={styles.product__thumbnail}>
                            {currentProduct.thumbnail ? (
                                <img 
                                    src={currentProduct.thumbnail.url} 
                                    alt={currentProduct.title} 
                                    className={styles.product__thumbnailImg}
                                />
                            ) : (
                                <div className={styles.product__placeholder}>
                                    <img 
                                        src="/product-placeholder.png" 
                                        alt="Заглушка" 
                                        className={styles.product__placeholderImg}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {/* Список остальных изображений */}
                        {currentProduct.images && currentProduct.images.length > 1 && (
                            <div className={styles.product__gallery}>
                                <h3>Дополнительные изображения:</h3>
                                <div className={styles.product__galleryList}>
                                    {currentProduct.images
                                        .filter(img => !img.main)
                                        .map(img => (
                                            <img 
                                                key={img.id} 
                                                src={img.url} 
                                                alt={`${currentProduct.title} - изображение ${img.id}`}
                                                className={styles.product__galleryImg}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.product__info}>
                        {/* Описание */}
                        <div className={styles.product__description}>
                            <h3>Описание:</h3>
                            <p>{currentProduct.description || 'Описание отсутствует'}</p>
                        </div>
                        
                        {/* Стоимость */}
                        <div className={styles.product__price}>
                            <h3>Цена:</h3>
                            <span className={styles.product__priceValue}>
                                {currentProduct.price} ₽
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Похожие товары */}
                {similarProducts.length > 0 && (
                    <div className={styles.similarProducts}>
                        <h2>Похожие товары:</h2>
                        <div className={styles.similarProducts__list}>
                            {similarProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className={styles.similarProduct}
                                    onClick={() => handleSimilarProductClick(product.id)}
                                >
                                    <h4 className={styles.similarProduct__title}>
                                        {product.title}
                                    </h4>
                                    <div className={styles.similarProduct__price}>
                                        {product.price} ₽
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Комментарии */}
                <div className={styles.comments}>
                    <h2>Комментарии:</h2>
                    
                    {/* Список комментариев */}
                    <div className={styles.comments__list}>
                        {currentProduct.comments && currentProduct.comments.length > 0 ? (
                            currentProduct.comments.map(comment => (
                                <div key={comment.id} className={styles.comment}>
                                    <div className={styles.comment__header}>
                                        <h4 className={styles.comment__title}>{comment.name}</h4>
                                        <span className={styles.comment__email}>{comment.email}</span>
                                    </div>
                                    <p className={styles.comment__body}>{comment.body}</p>
                                </div>
                            ))
                        ) : (
                            <p className={styles.comments__empty}>Комментариев пока нет</p>
                        )}
                    </div>
                    
                    {/* Форма добавления комментария */}
                    <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                        <h3>Добавить комментарий:</h3>
                        
                        <div className={styles.commentForm__field}>
                            <label htmlFor="commentName">Заголовок:</label>
                            <input
                                type="text"
                                id="commentName"
                                value={commentForm.name}
                                onChange={(e) => handleCommentChange('name', e.target.value)}
                                required
                                className={styles.commentForm__input}
                            />
                        </div>
                        
                        <div className={styles.commentForm__field}>
                            <label htmlFor="commentEmail">E-mail:</label>
                            <input
                                type="email"
                                id="commentEmail"
                                value={commentForm.email}
                                onChange={(e) => handleCommentChange('email', e.target.value)}
                                required
                                className={styles.commentForm__input}
                            />
                        </div>
                        
                        <div className={styles.commentForm__field}>
                            <label htmlFor="commentBody">Текст комментария:</label>
                            <textarea
                                id="commentBody"
                                value={commentForm.body}
                                onChange={(e) => handleCommentChange('body', e.target.value)}
                                required
                                rows={4}
                                className={styles.commentForm__textarea}
                            />
                        </div>
                        
                        <button type="submit" className={styles.commentForm__submit}>
                            Сохранить
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;