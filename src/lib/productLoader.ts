import type { LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from './supabase';
import type { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export type ProductLoaderData = {
  product: Product | null;
  category: Category | null;
};

export async function productLoader({ params }: LoaderFunctionArgs): Promise<ProductLoaderData> {
  const slug = params.slug;
  if (!slug) return { product: null, category: null };

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(`productLoader(${slug}): ${error.message}`);
    if (!product) return { product: null, category: null };

    let category: Category | null = null;
    if (product.category_id) {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('id', product.category_id)
        .maybeSingle();
      category = data;
    }

    return { product, category };
  } catch {
    return { product: null, category: null };
  }
}
