
CREATE TABLE public.planned_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  planned_date TEXT NOT NULL,
  is_spent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.planned_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own planned expenses" ON public.planned_expenses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
