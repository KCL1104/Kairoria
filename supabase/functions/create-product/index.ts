import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ===== 配置常數 =====
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

// ===== 型別定義 =====
interface ImageRecord {
  product_id: string;
  image_url: string;
  display_order: number;
  is_cover: boolean;
}

// ===== Zod 驗證 Schema =====
const ProductDataSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, '產品標題不能為空'),
  description: z.string().min(1, '產品描述不能為空'),
  category_id: z.string().transform(val => parseInt(val)),
  brand: z.string().optional().nullable(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().min(1, '地點不能為空'),
  currency: z.string().length(3, '貨幣代碼必須是3個字元'),
  price_per_hour: z.number().positive().optional().nullable(),
  price_per_day: z.number().positive('日租價格必須大於0'),
  daily_cap_hours: z.number().int().positive().optional().nullable(),
  security_deposit: z.number().min(0).default(0),
});

type ProductData = z.infer<typeof ProductDataSchema>;

// ===== 輔助函數 =====

/**
 * 創建管理員客戶端（使用 Service Role Key）
 */
function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 創建用戶客戶端
 */
function createUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });
}

/**
 * 創建標準化的錯誤回應
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
 * 創建成功回應
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
 * 驗證上傳的圖片檔案
 */
function validateImageFiles(files: File[]): { isValid: boolean; error?: string } {
  if (files.length < CONFIG.MIN_IMAGES) {
    return { isValid: false, error: `至少需要 ${CONFIG.MIN_IMAGES} 張圖片` };
  }
  
  if (files.length > CONFIG.MAX_IMAGES) {
    return { isValid: false, error: `最多只能上傳 ${CONFIG.MAX_IMAGES} 張圖片` };
  }
  
  for (const file of files) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `檔案 ${file.name} 超過 ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB 限制` 
      };
    }
    
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `檔案 ${file.name} 格式不支援。允許的格式：JPEG, PNG, WebP` 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * 上傳單個圖片到 Storage
 */
async function uploadImage(
  client: SupabaseClient,
  file: File,
  productId: string,
  index: number
): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt) {
    throw new Error(`無效的檔案副檔名：${file.name}`);
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
    throw new Error(`上傳圖片失敗：${uploadError.message}`);
  }
  
  const { data: { publicUrl } } = client.storage
    .from(CONFIG.STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return publicUrl;
}

/**
 * 批次上傳圖片
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
 * 清理失敗的上傳
 */
async function cleanupFailedUpload(
  client: SupabaseClient,
  productId: string,
  imageUrls: string[]
): Promise<void> {
  try {
    // 刪除已上傳的圖片
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
    
    // 刪除產品記錄
    await client
      .from('products')
      .delete()
      .eq('id', productId);
  } catch (error) {
    console.error('清理失敗的上傳時發生錯誤:', error);
  }
}

// ===== 主要處理函數 =====
async function handleCreateProduct(req: Request): Promise<Response> {
  let adminClient: SupabaseClient | null = null;
  let uploadedImageUrls: string[] = [];
  let productId: string | null = null;
  
  try {
    // 1. 驗證 Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('需要 Authorization header', 401);
    }
    
    // 2. 驗證用戶身份
    const userClient = createUserClient(authHeader);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return createErrorResponse('未授權的請求', 401);
    }
    
    // 3. 解析表單資料
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      return createErrorResponse('無效的表單資料', 400);
    }
    
    // 4. 解析並驗證產品資料
    const productDataString = formData.get('productData');
    if (typeof productDataString !== 'string') {
      return createErrorResponse('缺少產品資料', 400);
    }
    
    let rawProductData: any;
    try {
      rawProductData = JSON.parse(productDataString);
    } catch (error) {
      return createErrorResponse('產品資料格式錯誤', 400);
    }
    
    // 使用 Zod 驗證
    const productDataResult = ProductDataSchema.safeParse(rawProductData);
    if (!productDataResult.success) {
      return createErrorResponse('產品資料驗證失敗', 400, 
        productDataResult.error.flatten().fieldErrors
      );
    }
    
    const productData = productDataResult.data;
    productId = productData.id;
    
    // 5. 獲取並驗證圖片檔案
    const imageFiles = formData.getAll('images').filter(
      (file): file is File => file instanceof File
    );
    
    const imageValidation = validateImageFiles(imageFiles);
    if (!imageValidation.isValid) {
      return createErrorResponse(imageValidation.error!, 400);
    }
    
    // 6. 使用管理員客戶端進行資料庫操作
    adminClient = createAdminClient();
    
    // 7. 插入產品資料
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
      console.error('產品插入錯誤:', productError);
      return createErrorResponse('建立產品失敗', 500, productError.message);
    }
    
    // 8. 上傳圖片
    let imageRecords: ImageRecord[];
    try {
      imageRecords = await uploadImages(adminClient, imageFiles, productId);
      uploadedImageUrls = imageRecords.map(record => record.image_url);
    } catch (error) {
      // 清理已建立的產品
      await adminClient.from('products').delete().eq('id', productId);
      throw error;
    }
    
    // 9. 插入圖片記錄
    const { error: imageError } = await adminClient
      .from('product_images')
      .insert(imageRecords);
    
    if (imageError) {
      console.error('圖片記錄插入錯誤:', imageError);
      await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
      return createErrorResponse('儲存圖片資料失敗', 500, imageError.message);
    }
    
    // 10. 更新產品狀態為 'listed'
    const { error: updateError } = await adminClient
      .from('products')
      .update({ status: 'listed' })
      .eq('id', productId);
    
    if (updateError) {
      console.error('產品狀態更新錯誤:', updateError);
      // 不要因為這個錯誤而失敗整個請求
    }
    
    // 11. 返回成功回應
    return createSuccessResponse({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        status: updateError ? 'pending' : 'listed',
        images: imageRecords.length
      },
      message: '產品建立成功'
    }, 201);
    
  } catch (error) {
    console.error('未預期的錯誤:', error);
    
    // 嘗試清理
    if (adminClient && productId && uploadedImageUrls.length > 0) {
      await cleanupFailedUpload(adminClient, productId, uploadedImageUrls);
    }
    
    return createErrorResponse(
      '伺服器內部錯誤',
      500,
      error instanceof Error ? error.message : '未知錯誤'
    );
  }
}

// ===== Edge Function 入口 =====
Deno.serve(async (req: Request) => {
  // 處理 CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CONFIG.CORS_HEADERS });
  }
  
  // 只允許 POST 方法
  if (req.method !== 'POST') {
    return createErrorResponse('不允許的請求方法', 405);
  }
  
  // 處理產品建立請求
  return handleCreateProduct(req);
});