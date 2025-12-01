# 🟣 KURA — Documentación Técnica Oficial (MVP 1.0)

Red social de música basada en reseñas.  
Música se obtiene **en vivo desde Deezer**, interacción social vive en Supabase.

---

## 📑 Índice

1. [Visión](#visión-general)
2. [Arquitectura](#arquitectura-del-sistema)
3. [Flujos Funcionales](#flujos-funcionales)
4. [Base de Datos](#base-de-datos-oficial)
5. [RLS Security](#🔐-seguridad-rls-oficial)
6. [Storage Buckets](#🗂-storage-buckets--policies)
7. [Roadmap MVP](#🚀-roadmap-mvp-v10)
8. [Estado Actual](#estado-final-listo-para-desarrollo)
---

## 🟣 Visión General

> KURA es un espacio para **criticar, descubrir y vivir música**, no para reproducirla.  
> La música viene de **Deezer**, la conversación nace aquí.

✔ Opiniones reales  
✔ Reseñas con rating  
✔ Comentarios tipo hilo  
✔ Colecciones y listas  
✔ Descubrimiento social

---

## 🏗 Arquitectura del Sistema

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (RSC + App Router) |
| UI | Shadcn/UI + Tailwind CSS |
| Estado global UI | Zustand |
| Fetching/Cache | **TanStack Query** |
| Validación | Zod |
| Back-end | Supabase (Postgres + RLS) |
| Música | API **Deezer (live)** |
| Almacenamiento | Supabase Storage (avatars + banners) |

> No se guarda música.  
> Solo referencias `deezer_id` como clave universal.

---

## 🔥 Flujos Funcionales

### Perfil

- Perfiles públicos
- Avatar auto-generado (editable)
- Banner opcional
- Biografía + display name

### Reseñas

- Rating 1–10
- Texto libre
- Historial por usuario y por track
- Editable solo por el autor

### Comentarios

- Modelo **threaded** utilizando `ltree`
- Respuestas y subniveles infinitos
- Orden por path o fecha
- Solo editable por autor

### Colecciones

- Pueden contener track / album / artist
- Orden definible mediante `position`
- Públicas o privadas
- Todo por `deezer_id`

### Follow System

- Seguir / dejar de seguir
- Feed social basado en actividad

---

## 🗄 Base de Datos Oficial

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "ltree";

-----------------------------------
-- PROFILES
-----------------------------------
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  avatar_seed text,
  banner_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_profiles_username ON profiles (lower(username));


-----------------------------------
-- REVIEWS
-----------------------------------
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  deezer_id text NOT NULL,
  deezer_type text NOT NULL,
  rating smallint CHECK (rating BETWEEN 1 AND 10),
  text text,
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_reviews_deezer ON reviews (deezer_id, deezer_type, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews (user_id, created_at DESC);


-----------------------------------
-- COMMENTS (threaded con ltree)
-----------------------------------
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid,
  path ltree,
  body text,
  likes_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_comments_path ON comments USING GIST(path);
CREATE INDEX idx_comments_review ON comments (review_id, created_at DESC);


-----------------------------------
-- COLLECTIONS
-----------------------------------
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  deezer_id text NOT NULL,
  item_type text,
  position int DEFAULT 0
);
CREATE INDEX idx_items_by_collection_pos ON collection_items (collection_id, position);


-----------------------------------
-- FOLLOWS
-----------------------------------
CREATE TABLE follows (
  follower_id uuid REFERENCES profiles(id),
  followed_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX idx_follows_followed ON follows(followed_id);
