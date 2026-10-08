import type { LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from './supabase';
import type { Database } from '../types/database';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export type EquipmentLoaderData = {
  categories: Category[];
  category: Category | null;
  equipment: Equipment[];
};

export async function equipmentLoader({ params }: LoaderFunctionArgs): Promise<EquipmentLoaderData> {
  try {
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'equipment')
      .order('name');
    if (catError) throw new Error(`equipmentLoader(categories): ${catError.message}`);
    const categories = catData ?? [];

    const category = params.slug
      ? categories.find((c) => c.slug === params.slug) ?? null
      : null;

    let query = supabase
      .from('equipment')
      .select('*')
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('name');
    if (category) query = query.eq('category_id', category.id);

    const { data, error } = await query;
    if (error) throw new Error(`equipmentLoader(equipment): ${error.message}`);

    return { categories, category, equipment: data ?? [] };
  } catch {
    return { categories: [], category: null, equipment: [] };
  }
}
