CREATE OR REPLACE FUNCTION public.create_product_with_images(
    product_data jsonb,
    image_data jsonb[],
    owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_product_id uuid;
BEGIN
    -- Insert the product and get the new ID
    INSERT INTO public.products (
        id,
        title,
        description,
        category_id,
        brand,
        condition,
        location,
        currency,
        price_per_hour,
        price_per_day,
        daily_cap_hours,
        security_deposit,
        owner_id,
        status -- Set status directly to 'listed'
    )
    VALUES (
        (product_data->>'id')::uuid,
        product_data->>'title',
        product_data->>'description',
        (product_data->>'category_id')::integer,
        product_data->>'brand',
        (product_data->>'condition')::public.product_condition,
        product_data->>'location',
        (product_data->>'currency')::public.currency_type,
        (product_data->>'price_per_hour')::numeric,
        (product_data->>'price_per_day')::numeric,
        (product_data->>'daily_cap_hours')::integer,
        (product_data->>'security_deposit')::numeric,
        owner_id,
        'listed'
    )
    RETURNING id INTO new_product_id;

    -- Insert all associated images
    IF array_length(image_data, 1) > 0 THEN
        INSERT INTO public.product_images (
            product_id,
            image_url,
            display_order,
            is_cover
        )
        SELECT
            new_product_id,
            (image->>'image_url')::text,
            (image->>'display_order')::integer,
            (image->>'is_cover')::boolean
        FROM unnest(image_data) AS image;
    END IF;

    -- Return the ID of the newly created product
    RETURN new_product_id;
END;
$$;