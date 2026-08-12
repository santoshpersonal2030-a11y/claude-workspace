-- =============================================================================
-- Online Pooja Stores — Product image storage (Phase 2)
-- Run this ONCE in the Supabase SQL Editor, after the earlier migrations.
--
-- Creates a public "product-images" storage bucket so admins can upload product
-- photos from the admin panel. Anyone can view the images (they're on the
-- storefront); only admins can upload, change or delete them.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public can view product images.
drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins can add / change / remove product images.
drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images"
  on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
