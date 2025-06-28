-- First, ensure the product_images table uses image_path instead of image_url
-- This makes the schema more robust and aligns with best practices.
ALTER TABLE public.product_images
RENAME COLUMN image_url TO image_path;

-- If the column type was different, you might need to alter it, e.g.:
-- ALTER TABLE public.product_images
-- ALTER COLUMN image_path TYPE TEXT;

-- This function atomically creates a product, its images, and publishes it.
-- It's designed to be called from a trusted environment like an Edge Function.
CREATE OR REPLACE FUNCTION public.create_new_product(
    product_id_to_use uuid,
    product_data jsonb,
    images_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
-- SECURITY DEFINER allows the function to run with the permissions of the user who defined it,
-- bypassing RLS for this trusted operation. This is safe because we perform auth checks in the Edge Function.
SECURITY DEFINER
AS $$
DECLARE
    image_record jsonb;
BEGIN
    -- 1. Insert the main product record using the provided data.
    -- The 'published' flag is initially omitted or set to false.
    INSERT INTO public.products (
        id,
        user_id,
        title,
        description,
        category_id,
        brand,
        condition,
        location,
        currency,
        price_per_day,
        price_per_hour,
        security_deposit,
        published
    )
    VALUES (
        product_id_to_use,
        (product_data->>'user_id')::uuid,
        product_data->>'title',
        product_data->>'description',
        (product_data->>'category_id')::uuid,
        product_data->>'brand',
        product_data->>'condition',
        product_data->>'location',
        product_data->>'currency',
        (product_data->>'price_per_day')::numeric,
        (product_data->>'price_per_hour')::numeric,
        (product_data->>'security_deposit')::numeric,
        false
    );

    -- 2. Loop through the images JSON array and insert each one.
    IF images_data IS NOT NULL THEN
        FOR image_record IN SELECT * FROM jsonb_array_elements(images_data)
        LOOP
            INSERT INTO public.product_images (
                product_id,
                image_path,
                is_cover,
                display_order
            )
            VALUES (
                product_id_to_use,
                image_record->>'image_path',
                (image_record->>'is_cover')::boolean,
                (image_record->>'display_order')::int
            );
        END LOOP;
    END IF;

    -- 3. Finally, mark the product as published.
    UPDATE public.products
    SET published = true
    WHERE id = product_id_to_use;

    -- 4. Return the new product's ID upon success.
    RETURN product_id_to_use;
END;
$$;