const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  try {
    console.log('Testing database connection...')
    
    // Test products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (productsError) {
      console.error('Products error:', productsError)
    } else {
      console.log('Products found:', products?.length || 0)
      if (products?.length > 0) {
        console.log('Sample product:', products[0])
      }
    }
    
    // Test categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (categoriesError) {
      console.error('Categories error:', categoriesError)
    } else {
      console.log('Categories found:', categories?.length || 0)
      if (categories?.length > 0) {
        console.log('Sample category:', categories[0])
      }
    }
    
    // Test product with relations
    const { data: productWithRelations, error: relationsError } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        owner:profiles!owner_id(id, full_name, avatar_url),
        product_images(id, image_url, display_order, is_cover)
      `)
      .limit(1)
    
    if (relationsError) {
      console.error('Relations error:', relationsError)
    } else {
      console.log('Product with relations:', productWithRelations?.length || 0)
      if (productWithRelations?.length > 0) {
        console.log('Sample product with relations:', productWithRelations[0])
      }
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
  }
}

testDatabase() 