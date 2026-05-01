
-- Add lock columns to fiscal_data
ALTER TABLE public.fiscal_data 
  ADD COLUMN IF NOT EXISTS locked_t1 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_t2 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_t3 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_t4 boolean NOT NULL DEFAULT false;

-- Create data_backups table
CREATE TABLE public.data_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sql_content TEXT NOT NULL,
  tables_included TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backups"
  ON public.data_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
  ON public.data_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON public.data_backups FOR DELETE
  USING (auth.uid() = user_id);
