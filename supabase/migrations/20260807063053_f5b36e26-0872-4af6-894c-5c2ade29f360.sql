CREATE TABLE public.fiscal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  month text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name text NOT NULL,
  label text NOT NULL DEFAULT '',
  client text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  entry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_entries TO authenticated;
GRANT ALL ON public.fiscal_entries TO service_role;

ALTER TABLE public.fiscal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fiscal entries" ON public.fiscal_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fiscal_entries_user_year ON public.fiscal_entries (user_id, year);

CREATE TRIGGER update_fiscal_entries_updated_at
  BEFORE UPDATE ON public.fiscal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();