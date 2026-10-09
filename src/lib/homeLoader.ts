import { supabase } from './supabase';
import type { Database } from '../types/database';

type Category = Database['public']['Tables']['categories']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];

export type HomeLoaderData = {
  categories: Category[];
  equipment: Equipment[];
};

export async function homeLoader(): Promise<HomeLoaderData> {
  const [cats, eq] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('type', 'product')
      .order('name')
      .limit(6),
    supabase
      .from('equipment')
      .select('*')
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('name')
      .limit(3),
  ]);

  if (cats.error) throw new Error(`homeLoader(categories): ${cats.error.message}`);
  if (eq.error) throw new Error(`homeLoader(equipment): ${eq.error.message}`);

  return { categories: cats.data ?? [], equipment: eq.data ?? [] };
}
