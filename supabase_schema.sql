-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Warehouses Table
CREATE TABLE public.warehouses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_type VARCHAR(20) DEFAULT 'warehouse',
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50),
    representative VARCHAR(100),
    phone VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    location VARCHAR(100),
    city VARCHAR(100),
    dong VARCHAR(100),
    total_area NUMERIC,
    total_area_unit VARCHAR(20) DEFAULT 'sqm',
    warehouse_count INTEGER,
    warehouse_area NUMERIC,
    warehouse_area_unit VARCHAR(20) DEFAULT 'sqm',
    available_area NUMERIC,
    available_area_unit VARCHAR(20) DEFAULT 'sqm',
    pallet_count INTEGER,
    experience INTEGER,
    storage_types TEXT[], -- Array of strings
    delivery_companies TEXT[], -- Array of strings
    other_delivery_company VARCHAR(255),
    solutions TEXT[], -- Array of strings
    other_solution VARCHAR(255),
    products TEXT[] -- Array of strings
);

-- Customers Table
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_type VARCHAR(20) DEFAULT 'customer',
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    company_name VARCHAR(255) NOT NULL,
    representative VARCHAR(100),
    location VARCHAR(100),
    city VARCHAR(100),
    dong VARCHAR(100),
    phone VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    required_area NUMERIC,
    required_area_unit VARCHAR(20) DEFAULT 'sqm',
    monthly_volume NUMERIC,
    pallet_count INTEGER,
    desired_delivery TEXT[], -- Array of strings
    products TEXT[] -- Array of strings
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public access (For this MVP/Demo purpose, we simplify policies)
-- In a real app, you'd restrict this much more strictly
CREATE POLICY "Enable read/write for all" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Enable read/write for all" ON public.customers FOR ALL USING (true);
