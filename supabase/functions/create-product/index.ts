import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ===== Configuration Constants =====
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES: 10,
  MIN_IMAGES: 1,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  STORAGE_BUCKET: 'product-images',
  CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
} as const;

// ===== Type Definitions =====
interface ImageRecord {
  product_id: string;
  image_url: string;
  display_order: number;
  is_cover: boolean;
}

// ===== Zod Validation Schema =====
const ProductDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Product title cannot be empty'),
  description: z.string().min(1, 'Product description cannot be empty'),
  category_id: z.coerce.number().int().positive(),
  brand: z.string().optional().nullable(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().min(1, 'Location cannot be empty'),
  currency: z.enum(['usdc']),
  price_per_hour: z.coerce.number().positive().optional().nullable(),
  price_per_day: z.coerce.number().positive('Daily price must be greater than 0'),
  daily_cap_hours: z.coerce.number().int().positive().optional().nullable(),
  security_deposit: z.coerce.number().min(0).default(0),
});

type ProductData = z.infer<typeof ProductDataSchema>;

// ===== Helper Functions =====

/**
 * Creates an admin client (using the Service Role Key)
 */
function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing necessary environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a user client
 */

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  message: string, 
  status: number = 500, 
  details?: any
): Response {
  const body: any = { error: message };
  if (details) {
    body.details = details;
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CONFIG.CORS_HEADERS,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Creates a success response
 */
function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CONFIG.CORS_HEADERS,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Validates uploaded image files
 */
function validateImageFiles(files: File[]): { isValid: boolean; error?: string } {
  if (files.length < CONFIG.MIN_IMAGES) {
    return { isValid: false, error: `At least ${CONFIG.MIN_IMAGES} image(s) required` };
  }
  
  if (files.length > CONFIG.MAX_IMAGES) {
    return { isValid: false, error: `Maximum of ${CONFIG.MAX_IMAGES} images allowed` };
  }
  
  for (const file of files) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File ${file.name} exceeds the ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit` 
      };
    }
    
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `File ${file.name} format is not supported. Allowed formats: JPEG, PNG, WebP` 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Uploads a single image to Storage
 */
async function uploadImage(
  client: SupabaseClient,
  file: File,
  productId: string,
  index: number
): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt) {
    throw new Error(`Invalid file extension: ${file.name}`);
  }
  
  const timestamp = Date.now();
  const fileName = `${productId}/${timestamp}-${index}.${fileExt}`;
  
  const { error: uploadError } = await client.storage
    .from(CONFIG.STORAGE_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }
  
  const { data: { publicUrl } } = client.storage
    .from(CONFIG.STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return publicUrl;
}

/**
 * Batch uploads images
 */
async function uploadImages(
  client: SupabaseClient,
  files: File[],
  productId: string
): Promise<ImageRecord[]> {
  const uploadPromises = files.map(async (file, index) => {
    const imageUrl = await uploadImage(client, file, productId, index);
    return {
      product_id: productId,
      image_url: imageUrl,
      display_order: index,
      is_cover: index === 0
    };
  });
  
  return Promise.all(uploadPromises);
}

/**
 * Cleans up a failed upload
 */
async function cleanupFailedUpload(
  client: SupabaseClient,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  try {
    // Delete uploaded images
    if (imageUrls.length > 0) {
      const filePaths = imageUrls.map(url => {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        return `${productId}/${fileName}`;
      });
      
      await client.storage
        .from(CONFIG.STORAGE_BUCKET)
        .remove(filePaths);
    }
    
    // Delete product record
    await client
      .from('products')
      .delete()
      .eq('id', productId);
  } catch (error) {
    console.error('Error during failed upload cleanup:', error);
  }
}

// ===== Main Handler Function =====
async function handleCreateProduct(req: Request): Promise<Response> {
  let adminClient: SupabaseClient | null = null;
  let uploadedImageUrls: string[] = [];
  let productId: string | null = null;
  
  try {
    // 1. Authenticate user using the Admin client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing Authorization header', 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Use the admin client for all operations, including auth
    adminClient = createAdminClient();

    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);

    if (userError) {
      console.error('Admin client auth error:', userError);
      return createErrorResponse('Authentication failed', 401, userError.message);
    }

    if (!user) {
      return createErrorResponse('Unauthorized: Could not verify user', 401);
    }
    
    // 3. Parse FormData to extract product data and images
    let formData: FormData;
    let rawProductData: any;
    let imageFiles: File[] = [];
    
    try {
      formData = await req.formData();
      
      // Extract product data from FormData
      const productDataString = formData.get('productData');
      if (!productDataString || typeof productDataString !== 'string') {
        return createErrorResponse('Missing productData in FormData', 400);
      }
      
      rawProductData = JSON.parse(productDataString);
      
      // Extract image files from FormData
      const images = formData.getAll('images');
      imageFiles = images.filter((file): file is File => file instanceof File);
      
    } catch (error) {
      return createErrorResponse('Invalid FormData in request body', 400, error.message);
    }
    
    // Validate with Zod
    const productDataResult = ProductDataSchema.safeParse(rawProductData);
    if (!productDataResult.success) {
      return createErrorResponse('Product data validation failed', 400,
        productDataResult.error.flatten().fieldErrors
      );
    }
    
    const productData = productDataResult.data;
    productId = productData.id;

    if (!productId) {
      return createErrorResponse('Product ID is missing from product data.', 400);
    }
    
    // 4. Validate image files
    const imageValidation = validateImageFiles(imageFiles);
    if (!imageValidation.isValid) {
      return createErrorResponse(imageValidation.error!, 400);
    }
    
    // 5. Upload images to storage
    let imageRecords: ImageRecord[] = [];
    try {
      imageRecords = await uploadImages(adminClient, imageFiles, productId);
      uploadedImageUrls = imageRecords.map(record => record.image_url);
    } catch (error) {
      console.error('Image upload error:', error);
      return createErrorResponse('Failed to upload images', 500, error.message);
    }
    
    // 6. Insert product data
    const { data: product, error: productError } = await adminClient
      .from('products')
      .insert({
        ...productData,
        owner_id: user.id,
        status: 'pending'
      })
      .select()
      .single();
    
    if (productError) {
      console.error('Product insertion error:', productError);
      // Clean up uploaded images on product insertion failure
      await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
      return createErrorResponse('Failed to create product', 500, productError.message);
    }
    
    // 7. Insert image records
    if (imageRecords.length > 0) {
      const { error: imageError } = await adminClient
        .from('product_images')
        .insert(imageRecords);
      
      if (imageError) {
        console.error('Image record insertion error:', imageError);
        // Clean up on image record insertion failure
        await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
        return createErrorResponse('Failed to save image records', 500, imageError.message);
      }
    }
    
    // 8. Update product status to 'listed'
    const { error: updateError } = await adminClient
      .from('products')
      .update({ status: 'listed' })
      .eq('id', productId);
    
    if (updateError) {
      console.error('Product status update error:', updateError);
      // Don't fail the entire request because of this error
    }
    
    // 9. Return success response
    return createSuccessResponse({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        status: updateError ? 'pending' : 'listed',
        images: imageRecords.length
      },
      message: 'Product created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Attempt to clean up
    if (adminClient && productId && uploadedImageUrls.length > 0) {
      await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CONFIG.CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
}

// ===== Edge Function Entry Point =====
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CONFIG.CORS_HEADERS });
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return createErrorResponse('Method Not Allowed', 405);
  }
  
  // Handle product creation request
  return handleCreateProduct(req);
});