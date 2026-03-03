import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Order = Tables<"orders"> & { order_items: Tables<"order_items">[] };
export type MenuItem = Tables<"menu_items">;
export type MenuCategory = Tables<"menu_categories">;
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

// Orders
export function useOrders(dateFilter?: string) {
  return useQuery({
    queryKey: ["orders", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (dateFilter) {
        query = query.gte("created_at", dateFilter + "T00:00:00").lte("created_at", dateFilter + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      customer_name?: string;
      notes?: string;
      items: { menu_item_id: string; item_name: string; quantity: number; unit_price: number; notes?: string }[];
    }) => {
      const total = order.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({ customer_name: order.customer_name, notes: order.notes, total })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = order.items.map((i) => ({ ...i, order_id: orderData.id }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// Menu
export function useMenuItems() {
  return useQuery({
    queryKey: ["menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("name");
      if (error) throw error;
      return data as MenuItem[];
    },
  });
}

export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as MenuCategory[];
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<"menu_items">) => {
      const { error } = await supabase.from("menu_items").insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"menu_items">>) => {
      const { error } = await supabase.from("menu_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_items"] }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: TablesInsert<"menu_categories">) => {
      const { error } = await supabase.from("menu_categories").insert(cat);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_categories"] }),
  });
}
