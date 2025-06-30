-- Kairoria Marketplace Database Schema for Supabase
-- Enhanced for security, consistency, and robustness
-- Run this in your Supabase SQL Editor

-- Begin transaction for atomic execution
BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table (separate table for better organization)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    profile_image_url TEXT,
    phone TEXT,
    bio TEXT,
    location TEXT,
    solana_address TEXT UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_code TEXT,
    phone_verification_code TEXT,
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    phone_verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create products table (updated with consistent DECIMAL pricing)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_per_day DECIMAL(18,6) NOT NULL, -- USDC smallest units with 6 decimal places
    price_per_hour DECIMAL(18,6), -- USDC smallest units with 6 decimal places
    daily_cap_hours INTEGER, -- Max hours per day for hourly pricing
    security_deposit DECIMAL(18,6) NOT NULL DEFAULT 0, -- USDC smallest units with 6 decimal places
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    brand TEXT,
    condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'used')),
    location TEXT NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('usdc', 'usdt')) DEFAULT 'usdc',
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'listed', 'unlisted')),
    average_rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create product_images table (separate table for better organization)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookings table (ensuring DECIMAL consistency for total_price)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    renter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price DECIMAL(18,6) NOT NULL, -- USDC smallest units with 6 decimal places
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(participant_1, participant_2, product_id)
);

-- Create messages table (for chat)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance (with IF NOT EXISTS equivalent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_username_idx') THEN
        CREATE INDEX profiles_username_idx ON profiles(username);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_email_idx') THEN
        CREATE INDEX profiles_email_idx ON profiles(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_solana_address_idx') THEN
        CREATE INDEX profiles_solana_address_idx ON profiles(solana_address);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'products_owner_id_idx') THEN
        CREATE INDEX products_owner_id_idx ON products(owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'products_category_id_idx') THEN
        CREATE INDEX products_category_id_idx ON products(category_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'products_status_idx') THEN
        CREATE INDEX products_status_idx ON products(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'products_condition_idx') THEN
        CREATE INDEX products_condition_idx ON products(condition);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'products_currency_idx') THEN
        CREATE INDEX products_currency_idx ON products(currency);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'product_images_product_id_idx') THEN
        CREATE INDEX product_images_product_id_idx ON product_images(product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'product_images_is_cover_idx') THEN
        CREATE INDEX product_images_is_cover_idx ON product_images(is_cover);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_product_id_idx') THEN
        CREATE INDEX bookings_product_id_idx ON bookings(product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_renter_id_idx') THEN
        CREATE INDEX bookings_renter_id_idx ON bookings(renter_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_owner_id_idx') THEN
        CREATE INDEX bookings_owner_id_idx ON bookings(owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bookings_status_idx') THEN
        CREATE INDEX bookings_status_idx ON bookings(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_product_id_idx') THEN
        CREATE INDEX reviews_product_id_idx ON reviews(product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_reviewer_id_idx') THEN
        CREATE INDEX reviews_reviewer_id_idx ON reviews(reviewer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_conversation_id_idx') THEN
        CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_sender_id_idx') THEN
        CREATE INDEX messages_sender_id_idx ON messages(sender_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'conversations_participant_1_idx') THEN
        CREATE INDEX conversations_participant_1_idx ON conversations(participant_1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'conversations_participant_2_idx') THEN
        CREATE INDEX conversations_participant_2_idx ON conversations(participant_2);
    END IF;
END $$;

-- Set up Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones (for idempotency)
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view listed products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
-- ===== DEFINITIVE REPLACEMENT BLOCK FOR product_images RLS POLICIES =====

-- 1. Clean up all potential old policies for a fresh start
DROP POLICY IF EXISTS "Users can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can view product images for listed products" ON public.product_images;
DROP POLICY IF EXISTS "Users can manage images for their own products" ON public.product_images;
DROP POLICY IF EXISTS "Owners can manage their product images" ON public.product_images;
DROP POLICY IF EXISTS "Owners can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Owners can update their product images" ON public.product_images;
DROP POLICY IF EXISTS "Owners can delete their product images" ON public.product_images;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- RLS Policies for categories (read-only for all)
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING ((select auth.uid()) = id);

-- RLS Policies for products
CREATE POLICY "Anyone can view listed products" ON products
    FOR SELECT USING (status = 'listed' OR owner_id = (select auth.uid()));

CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING ((select auth.uid()) = owner_id);

CREATE POLICY "Users can delete their own products" ON products
    FOR DELETE USING ((select auth.uid()) = owner_id);

-- 2. Create a single, optimized policy for all SELECT actions
CREATE POLICY "Users can view product images" ON public.product_images
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id
        AND (
            -- Condition 1: The product is publicly listed
            products.status = 'listed'
            OR
            -- Condition 2: The user is the owner of the product
            products.owner_id = (select auth.uid())
        )
    )
);

-- 3. Create separate, explicit policies for each modification action

-- Policy for INSERT action
CREATE POLICY "Owners can insert product images" ON public.product_images
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id AND products.owner_id = (select auth.uid())
    )
);

-- Policy for UPDATE action
CREATE POLICY "Owners can update their product images" ON public.product_images
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id AND products.owner_id = (select auth.uid())
    )
);

-- Policy for DELETE action
CREATE POLICY "Owners can delete their product images" ON public.product_images
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_images.product_id AND products.owner_id = (select auth.uid())
    )
);

-- ===== END OF REPLACEMENT BLOCK =====

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING ((select auth.uid()) = renter_id OR (select auth.uid()) = owner_id);

CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK ((select auth.uid()) = renter_id);

CREATE POLICY "Users can update their bookings" ON bookings
    FOR UPDATE USING ((select auth.uid()) = renter_id OR (select auth.uid()) = owner_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

-- Enhanced security policy: Users can only create reviews for completed bookings
CREATE POLICY "Users can create reviews for their bookings" ON reviews
    FOR INSERT WITH CHECK (
        (select auth.uid()) = reviewer_id AND
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.renter_id = (select auth.uid()) 
            AND bookings.product_id = reviews.product_id
            AND bookings.status = 'completed'
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING ((select auth.uid()) = sender_id OR (select auth.uid()) = recipient_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING ((select auth.uid()) = participant_1 OR (select auth.uid()) = participant_2);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK ((select auth.uid()) = participant_1 OR (select auth.uid()) = participant_2);

-- Insert default categories (with conflict handling for idempotency)
INSERT INTO categories (name, icon) VALUES
('Electronics', '📱'),
('Tools', '🔧'),
('Outdoor Gear', '⛺'),
('Home Goods', '🪑'),
('Sports', '⚽'),
('Vehicles', '🚗'),
('Clothing', '👕'),
('Musical Instruments', '🎸'),
('Garden', '🌷'),
('Photography', '📷'),
('Events', '🎭'),
('Books', '📚'),
('Toys & Games', '🎮'),
('Art & Crafts', '🎨'),
('Kitchen', '🍳'),
('Fitness', '💪'),
('Party & Celebration', '🎉')
ON CONFLICT (name) DO NOTHING;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Function to update product rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Function to ensure only one cover image per product
CREATE OR REPLACE FUNCTION ensure_single_cover_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_cover = true THEN
        -- Remove cover status from other images of the same product
        UPDATE product_images 
        SET is_cover = false 
        WHERE product_id = NEW.product_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Drop existing triggers before creating new ones (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_product_rating_on_review_insert ON reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_review_update ON reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_review_delete ON reviews;
DROP TRIGGER IF EXISTS ensure_single_cover_image_trigger ON product_images;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add rating update triggers
CREATE TRIGGER update_product_rating_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Add cover image constraint trigger
CREATE TRIGGER ensure_single_cover_image_trigger
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_cover_image();

-- Commit transaction
COMMIT;