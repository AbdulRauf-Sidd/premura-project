-- Run this in the Supabase SQL Editor

CREATE TABLE pipeline (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now(),
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  phone_normalized text,
  extra_notes      text,
  num_employees    text,
  annual_revenue   text,
  booked_slot      text,
  outcome          text,
  deal_amount      numeric
);

-- Disable RLS so the anon key can read/write freely
ALTER TABLE pipeline DISABLE ROW LEVEL SECURITY;
