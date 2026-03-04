
-- Addons table
CREATE TABLE public.menu_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view addons" ON public.menu_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert addons" ON public.menu_addons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update addons" ON public.menu_addons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete addons" ON public.menu_addons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Order item addons junction table
CREATE TABLE public.order_item_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  addon_name text NOT NULL,
  addon_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view order item addons" ON public.order_item_addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashiers admins can insert order item addons" ON public.order_item_addons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Cashiers admins can update order item addons" ON public.order_item_addons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'cashier'));
CREATE POLICY "Cashiers admins can delete order item addons" ON public.order_item_addons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'cashier'));
