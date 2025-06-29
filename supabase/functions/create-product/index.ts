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
  category_id: z.string().transform(val => parseInt(val)),
  brand: z.string().optional().nullable(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().min(1, 'Location cannot be empty'),
  currency: z.string().min(3, 'Invalid currency code format'),
  price_per_hour: z.number().positive().optional().nullable(),
  price_per_day: z.number().positive('Daily price must be greater than 0'),
  daily_cap_hours: z.number().int().positive().optional().nullable(),
  security_deposit: z.number().min(0).default(0),
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
function createUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Need necessary ENV');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });
}

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
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authorization header required', 401);
    }
    
    // 2. Authenticate user
    const userClient = createUserClient(authHeader);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return createErrorResponse('Unauthorized request', 401);
    }
    
    // 3. Parse form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      return createErrorResponse('Invalid form data', 400);
    }
    
    // 4. Parse and validate product data
    const productDataString = formData.get('productData');
    if (typeof productDataString !== 'string') {
      return createErrorResponse('Missing product data', 400);
    }
    
    let rawProductData: any;
    try {
      rawProductData = JSON.parse(productDataString);
    } catch (error) {
      return createErrorResponse('Invalid product data format', 400);
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
    
    // 5. Get and validate image files
    const imageFiles = formData.getAll('images').filter(
      (file): file is File => file instanceof File
    );
    
    const imageValidation = validateImageFiles(imageFiles);
    if (!imageValidation.isValid) {
      return createErrorResponse(imageValidation.error!, 400);
    }
    
    // 6. Use admin client for database operations
    adminClient = createAdminClient();
    
    // 7. Insert product data
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
      return createErrorResponse('Failed to create product', 500, productError.message);
    }
    
    // 8. Upload images
    let imageRecords: ImageRecord[];
    try {
      imageRecords = await uploadImages(adminClient, imageFiles, productId);
      uploadedImageUrls = imageRecords.map(record => record.image_url);
    } catch (error) {
      // Clean up the created product
      await adminClient.from('products').delete().eq('id', productId);
      throw error;
    }
    
    // 9. Insert image records
    const { error: imageError } = await adminClient
      .from('product_images')
      .insert(imageRecords);
    
    if (imageError) {
      console.error('Image record insertion error:', imageError);
      await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
      return createErrorResponse('Failed to save image data', 500, imageError.message);
    }
    
    // 10. Update product status to 'listed'
    const { error: updateError } = await adminClient
      .from('products')
      .update({ status: 'listed' })
      .eq('id', productId);
    
    if (updateError) {
      console.error('Product status update error:', updateError);
      // Don't fail the entire request because of this error
    }
    
    // 11. Return success response
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
    
    return createErrorResponse(
      'Internal Server Error',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
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