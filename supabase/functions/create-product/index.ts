import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders } from '../_shared/cors';

// Zod schema for validating the product data from the client.
const ProductDataSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().optional(),
  category_id: z.string().uuid({ message: 'Invalid category ID.' }).optional(),
  brand: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  currency: z.string().optional(),
  price_per_day: z.number().positive({ message: 'Price per day must be positive.' }).optional(),
  price_per_hour: z.number().positive({ message: 'Price per hour must be positive.' }).optional(),
  security_deposit: z.number().positive({ message: 'Security deposit must be positive.' }).optional(),
  published: z.boolean().optional(),
});

// Zod schema for validating the uploaded images.
// The runtime provides File-like objects that we can validate.
const ImageSchema = z.instanceof(File);
const ImageArraySchema = z.array(ImageSchema).min(1, "At least one image is required.");

// Creates a Supabase client with the service role key for admin-level operations.
const createAdminClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

// The main function that will be executed by the Supabase runtime.
export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  // Ensure the request method is POST.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // 1. Authenticate user
    const userClient = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_ANON_KEY ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 2. Parse and validate FormData
    const formData = await req.formData();
    const productDataString = formData.get('productData');
    const images = formData.getAll('images');

    if (typeof productDataString !== 'string') {
      return new Response(JSON.stringify({ error: 'Bad Request: `productData` must be a JSON string.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const parsedProductData = ProductDataSchema.safeParse(JSON.parse(productDataString));
    const parsedImages = ImageArraySchema.safeParse(images);

    if (!parsedProductData.success || !parsedImages.success) {
      const errors = {
        productData: !parsedProductData.success ? parsedProductData.error.flatten().fieldErrors : undefined,
        images: !parsedImages.success ? parsedImages.error.flatten().formErrors : undefined,
      };
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: productData } = parsedProductData;
    const { data: imageFiles } = parsedImages;
    const adminClient = createAdminClient();
    const productId = crypto.randomUUID();

    // 3. Upload images to storage
    const uploadedImagePaths = [];
    for (const image of imageFiles) {
      const filePath = `${user.id}/${productId}/${image.name}`;
      const { error: uploadError } = await adminClient.storage
        .from('product-images')
        .upload(filePath, image, { contentType: image.type });

      if (uploadError) {
        console.error(`Image upload error for ${filePath}:`, uploadError);
        throw new Error(`Failed to upload image: ${image.name}`);
      }
      uploadedImagePaths.push(filePath);
    }

    // 4. Prepare data for the database function
    const imagesJson = uploadedImagePaths.map((path, index) => ({
      image_path: path,
      is_cover: index === 0,
      display_order: index,
    }));

    const productPayload = { ...productData, id: productId, user_id: user.id };

    // 5. Call the atomic database function
    const { data: newProduct, error: rpcError } = await adminClient.rpc('create_new_product', {
      p_product_data: productPayload,
      p_images: imagesJson,
    });

    if (rpcError) {
      console.error('RPC error calling create_new_product:', rpcError);
      // Attempt to clean up uploaded images if the DB operation fails
      for (const path of uploadedImagePaths) {
        await adminClient.storage.from('product-images').remove([path]);
      }
      throw new Error('Failed to save product to the database.');
    }

    // 6. Return success response
    return new Response(JSON.stringify(newProduct), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error: any) {
    console.error('Unhandled error:', error.message);
    const status = error instanceof z.ZodError ? 400 : 500;
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
}