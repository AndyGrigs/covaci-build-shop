import type { LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from './supabase';
import type { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export type CatalogLoaderData = {
  categories: Category[];
  category: Category | null;
  products: Product[];
};

export async function catalogLoader({ params }: LoaderFunctionArgs): Promise<CatalogLoaderData> {
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'product')
    .order('name');
  if (catError) throw new Error(`catalogLoader(categories): ${catError.message}`);
  const categories = catData ?? [];

  const category = params.slug
    ? categories.find((c) => c.slug === params.slug) ?? null
    : null;

  let query = supabase.from('products').select('*').eq('is_active', true).order('name');
  if (category) query = query.eq('category_id', category.id);

  const { data: prodData, error: prodError } = await query;
  if (prodError) throw new Error(`catalogLoader(products): ${prodError.message}`);

  return { categories, category, products: prodData ?? [] };
}
