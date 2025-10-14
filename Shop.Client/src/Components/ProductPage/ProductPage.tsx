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

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            dispatch(fetchProductById(id));
            dispatch(fetchSimilarProducts(id));
            setCurrentImageIndex(0); 
        }
        
        return () => {
            dispatch(clearCurrentProduct());
        };
    }, [id, dispatch]);

    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const allImages = getAllImages();
            if (allImages.length <= 1) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePreviousImage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNextImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentProduct]); 

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

    
    const getAllImages = () => {
        if (!currentProduct) return [];
        
        const images = [];
        if (currentProduct.thumbnail) {
            images.push(currentProduct.thumbnail);
        }
        if (currentProduct.images) {
            
            const additionalImages = currentProduct.images.filter(img => 
                img.url !== currentProduct.thumbnail?.url
            );
            images.push(...additionalImages);
        }
        return images;
    };

    const handlePreviousImage = () => {
        const allImages = getAllImages();
        if (allImages.length > 0) {
            setCurrentImageIndex(prev => 
                prev === 0 ? allImages.length - 1 : prev - 1
            );
        }
    };

    const handleNextImage = () => {
        const allImages = getAllImages();
        if (allImages.length > 0) {
            setCurrentImageIndex(prev => 
                prev === allImages.length - 1 ? 0 : prev + 1
            );
        }
    };

    const handleImageClick = (index: number) => {
        setCurrentImageIndex(index);
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
                
                <h1 className={styles.product__title}>{currentProduct.title}</h1>
                
                
                <div className={styles.product__main}>
                    <div className={styles.product__images}>
                        
                        <div className={styles.product__thumbnail}>
                            {(() => {
                                const allImages = getAllImages();
                                const currentImage = allImages[currentImageIndex];
                                
                                if (currentImage) {
                                    return (
                                        <>
                                            <img 
                                                src={currentImage.url} 
                                                alt={currentProduct.title} 
                                                className={styles.product__thumbnailImg}
                                            />
                                            
                                            
                                            {allImages.length > 1 && (
                                                <>
                                                    <button 
                                                        className={`${styles.product__imageNav} ${styles.product__imageNavPrev}`}
                                                        onClick={handlePreviousImage}
                                                        aria-label="Предыдущее изображение"
                                                    >
                                                        ‹
                                                    </button>
                                                    <button 
                                                        className={`${styles.product__imageNav} ${styles.product__imageNavNext}`}
                                                        onClick={handleNextImage}
                                                        aria-label="Следующее изображение"
                                                    >
                                                        ›
                                                    </button>
                                                    
                                                    
                                                    <div className={styles.product__imageIndicator}>
                                                        {allImages.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                className={`${styles.product__imageDot} ${
                                                                    index === currentImageIndex ? styles.product__imageDotActive : ''
                                                                }`}
                                                                onClick={() => handleImageClick(index)}
                                                                aria-label={`Изображение ${index + 1}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    );
                                } else {
                                    return (
                                        <div className={styles.product__placeholder}>
                                            <img 
                                                src="/product-placeholder.png" 
                                                alt="placeholder" 
                                                className={styles.product__placeholderImg}
                                            />
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                        
                        
                        {(() => {
                            const allImages = getAllImages();
                            return allImages.length > 1 && (
                                <div className={styles.product__gallery}>
                                    <h3>Все изображения:</h3>
                                    <div className={styles.product__galleryList}>
                                        {allImages.map((img, index) => (
                                            <img 
                                                key={img.id || index} 
                                                src={img.url} 
                                                alt={`${currentProduct.title} - изображение ${index + 1}`}
                                                className={`${styles.product__galleryImg} ${
                                                    index === currentImageIndex ? styles.product__galleryImgActive : ''
                                                }`}
                                                onClick={() => handleImageClick(index)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    
                    <div className={styles.product__info}>
                        
                        <div className={styles.product__description}>
                            <h3>Описание:</h3>
                            <p>{currentProduct.description || 'Описание отсутствует'}</p>
                        </div>
                        
                        
                        <div className={styles.product__price}>
                            <h3>Цена:</h3>
                            <span className={styles.product__priceValue}>
                                {currentProduct.price} ₽
                            </span>
                        </div>
                    </div>
                </div>
                
                
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
                
                
                <div className={styles.comments}>
                    <h2>Комментарии:</h2>
                    
                    
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