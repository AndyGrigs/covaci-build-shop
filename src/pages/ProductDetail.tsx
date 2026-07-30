import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import type { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductDetailProps {
  productId: string;
  onNavigate: (page: string) => void;
}

export default function ProductDetail({ productId, onNavigate }: ProductDetailProps) {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (data) {
      setProduct(data);
      if (data.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('id', data.category_id)
          .single();
        if (cat) setCategory(cat);
      }
    }
    setLoading(false);
  };

  const getImages = (): string[] => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.images?.length) imgs.push(...product.images);
    else if (product.image_url) imgs.push(product.image_url);
    return imgs;
  };

  const images = getImages();

  const prev = () => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const addToCart = async () => {
    if (!user) { onNavigate('login'); return; }
    if (!product) return;
    setAddingToCart(true);

    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      });
    }

    setAddingToCart(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Товар не найден</p>
        <button
          onClick={() => onNavigate('products')}
          className="inline-flex items-center space-x-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться в каталог</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <button onClick={() => onNavigate('home')} className="hover:text-gray-700 transition">Главная</button>
        <span>/</span>
        <button onClick={() => onNavigate('products')} className="hover:text-gray-700 transition">Каталог</button>
        {category && (
          <>
            <span>/</span>
            <span className="text-gray-400">{category.name}</span>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => onNavigate('products')}
        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="font-medium">Назад в каталог</span>
      </button>

      <div className="grid lg:grid-cols-2 gap-12">

        {/* ── Gallery ── */}
        <div>
          {/* Main image */}
          <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square mb-4 group">
            {images.length > 0 ? (
              <img
                key={activeIndex}
                src={images[activeIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Package className="w-24 h-24 mb-2" />
                <span className="text-sm">Нет фото</span>
              </div>
            )}

            {/* Prev / Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                {/* Dot indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        i === activeIndex ? 'bg-white w-5' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    i === activeIndex
                      ? 'border-blue-500 scale-105 shadow-md'
                      : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt={`фото ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          {/* Stock badge */}
          <span className={`self-start text-sm px-3 py-1 rounded-full font-medium mb-6 ${
            product.stock_quantity > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {product.stock_quantity > 0 ? `В наличии: ${product.stock_quantity} ${product.unit}` : 'Нет в наличии'}
          </span>

          {/* Price */}
          <div className="flex items-baseline space-x-2 mb-8">
            <span className="text-4xl font-black text-blue-600">{product.price.toFixed(2)} MDL</span>
            <span className="text-lg text-gray-500">/ {product.unit}</span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Описание</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Category */}
          {category && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Категория</h2>
              <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {category.name}
              </span>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={addToCart}
            disabled={product.stock_quantity === 0 || addingToCart}
            className={`mt-auto w-full flex items-center justify-center space-x-3 py-4 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span>
              {addingToCart ? 'Добавление...' : added ? 'Добавлено!' : 'Добавить в корзину'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
