-- 為常用的篩選欄位新增 B-tree 索引
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);

-- 為 title 和 description 欄位新增 GIN 索引以支援全文檢索
-- 這將顯著提升使用 to_tsvector 和 to_tsquery 函式進行搜尋時的效能。
CREATE INDEX IF NOT EXISTS idx_products_full_text_search ON public.products USING gin(to_tsvector('english', title || ' ' || description));