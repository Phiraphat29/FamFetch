-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.families (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  admin_id uuid,
  CONSTRAINT families_pkey PRIMARY KEY (id),
  CONSTRAINT families_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);

CREATE TABLE public.list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  item_id uuid NOT NULL,
  is_bought boolean DEFAULT false,
  purchased_price numeric,
  purchased_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT list_items_pkey PRIMARY KEY (id),
  CONSTRAINT list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.shopping_lists(id),
  CONSTRAINT list_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT list_items_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  family_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);

CREATE TABLE public.shopping_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT shopping_lists_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_lists_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);