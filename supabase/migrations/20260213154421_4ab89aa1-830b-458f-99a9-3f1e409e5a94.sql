
ALTER TABLE public.transactions ADD COLUMN planned_expense_id uuid REFERENCES public.planned_expenses(id) ON DELETE SET NULL;
