'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Define a more specific type for your product data for better type safety
interface ProductData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  // Add other product fields here, e.g., user_id if not handled automatically
}

export async function createProduct(productData: ProductData) {
  // This createClient function is now the server-side, auth-aware client
  const supabase = await createClient();

  // It's good practice to also get the current user to assign ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'You must be logged in to create a product.' } };
  }

  const dataToInsert = {
    ...productData,
    user_id: user.id, // Assuming you have a user_id column in your 'products' table
  };

  const { data, error } = await supabase
    .from('products')
    .insert(dataToInsert)
    .select()
    .single(); // Use .single() if you expect one row, it simplifies the result

  if (error) {
    console.error('Supabase insert error:', error);
    return { error };
  }

  // Revalidate the path to show the new product immediately on the listings page
  revalidatePath('/profile/listings');

  return { data };
}