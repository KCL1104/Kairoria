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
  currency: z.enum(['usdc', 'usdt']),
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
): Promise<{ successfulRecords: ImageRecord[]; errors: any[] }> {
  const uploadPromises = files.map((file, index) =>
    uploadImage(client, file, productId, index)
  );

  const results = await Promise.allSettled(uploadPromises);

  const successfulRecords: ImageRecord[] = [];
  const errors: any[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulRecords.push({
        product_id: productId,
        image_url: result.value,
        display_order: index,
        is_cover: index === 0,
      });
    } else {
      errors.push({
        reason: result.reason.message,
        fileName: files[index].name
      });
    }
  });

  return { successfulRecords, errors };
}

/**
 * Cleans up uploaded images from storage in case of failure.
 */
async function cleanupStorage(
  client: SupabaseClient,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  if (imageUrls.length === 0) return;

  try {
    const filePaths = imageUrls.map(url => {
      const urlParts = url.split('/');
      const fileNameWithTimestamp = urlParts[urlParts.length - 1];
      return `${productId}/${fileNameWithTimestamp}`;
    });

    const { error } = await client.storage
      .from(CONFIG.STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error('Storage cleanup error:', error);
    }
  } catch (error) {
    console.error('Exception during storage cleanup:', error);
  }
}


// ===== Main Handler Function =====
async function handleCreateProduct(req: Request): Promise<Response> {
  let adminClient: SupabaseClient | null = null;
  let uploadedImageUrls: string[] = [];
  let productId: string | null = null;

  try {
    // 1. Create Admin Client
    adminClient = createAdminClient();

    // 2. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing Authorization header', 401);
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);

    if (userError || !user) {
      return createErrorResponse('Authentication failed', 401, userError?.message);
    }

    // 3. Parse and Validate FormData
    let productData: ProductData;
    let imageFiles: File[];

    try {
      const formData = await req.formData();
      const productDataString = formData.get('productData');
      if (!productDataString || typeof productDataString !== 'string') {
        return createErrorResponse('Missing productData in FormData', 400);
      }
      
      const rawProductData = JSON.parse(productDataString);
      const productDataResult = ProductDataSchema.safeParse(rawProductData);
      if (!productDataResult.success) {
        return createErrorResponse('Product data validation failed', 400, productDataResult.error.flatten().fieldErrors);
      }
      productData = productDataResult.data;
      productId = productData.id;

      if (!productId) {
        return createErrorResponse('Product ID is missing from product data.', 400);
      }

      const images = formData.getAll('images');
      imageFiles = images.filter((file): file is File => file instanceof File);
      
      const imageValidation = validateImageFiles(imageFiles);
      if (!imageValidation.isValid) {
        return createErrorResponse(imageValidation.error!, 400);
      }
    } catch (error) {
      return createErrorResponse('Invalid FormData in request body', 400, error.message);
    }

    // 4. Upload images to storage
    const { successfulRecords, errors } = await uploadImages(adminClient, imageFiles, productId);
    const imageRecords = successfulRecords;
    uploadedImageUrls = imageRecords.map(record => record.image_url);

    if (errors.length > 0) {
      console.error('Partial image upload failed. Cleaning up storage.', { errors });
      // Clean up successfully uploaded files before exiting
      if (uploadedImageUrls.length > 0) {
        await cleanupStorage(adminClient, productId, uploadedImageUrls);
      }
      return createErrorResponse(
        'Some images failed to upload. The operation has been reverted.',
        500,
        { failedUploads: errors }
      );
    }

    // 5. Call the database function to create product and images in a transaction
    const rpcParams = {
      product_data: productData,
      image_data: imageRecords,
      owner_id: user.id
    };

    const { data: newProductId, error: rpcError } = await adminClient.rpc(
      'create_product_with_images',
      rpcParams
    );

    if (rpcError) {
      console.error('RPC (create_product_with_images) error:', rpcError);
      // If the DB transaction fails, we need to clean up the uploaded images
      await cleanupStorage(adminClient, productId, uploadedImageUrls);
      return createErrorResponse('Failed to create product in database', 500, rpcError.message);
    }

    // 6. Return success response
    return createSuccessResponse({
      success: true,
      product: {
        id: newProductId,
        title: productData.title,
        status: 'listed', // Status is set to 'listed' within the transaction
        images: imageRecords.length
      },
      message: 'Product created successfully'
    }, 201);

  } catch (error) {
    console.error('Unexpected error in handleCreateProduct:', error);

    // Attempt to clean up any uploaded images if an unexpected error occurred
    if (adminClient && productId && uploadedImageUrls.length > 0) {
      await cleanupStorage(adminClient, productId, uploadedImageUrls);
    }

    return createErrorResponse(error.message, 500);
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