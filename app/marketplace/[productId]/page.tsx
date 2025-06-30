import { notFound } from "next/navigation";
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server';
import { ProductDetailClientView } from '@/components/marketplace/product-detail-client-view';
import { Product, ProductImage, Profile } from '@/lib/data';

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ProductWithRelations = Product & {
  categories: { id: number; name: string };
  owner: Profile;
  product_images: ProductImage[];
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Product Details: ${resolvedParams.productId}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.productId as string, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (id, name),
      owner:profiles (*),
      product_images (*)
    `)
    .eq('id', productId)
    .single();

  if (error || !product) {
    console.error('Error fetching product:', error);
    notFound();
  }

  return <ProductDetailClientView product={product as ProductWithRelations} />;
}