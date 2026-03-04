import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Order = Tables<"orders"> & { order_items: (Tables<"order_items"> & { order_item_addons?: OrderItemAddon[] })[] };
export type MenuItem = Tables<"menu_items">;
export type MenuCategory = Tables<"menu_categories">;
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_name: string;
  addon_price: number;
  quantity: number;
  created_at: string;
}

export interface CartAddon {
  addon_id: string;
  addon_name: string;
  addon_price: number;
  quantity: number;
}

export interface CartItem {
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes: string;
  addons: CartAddon[];
}

// Orders
export function useOrders(dateFilter?: string) {
  return useQuery({
    queryKey: ["orders", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*, order_item_addons(*))")
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

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, order_item_addons(*))")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      customer_name?: string;
      notes?: string;
      scheduled_for?: string | null;
      items: CartItem[];
    }) => {
      const total = order.items.reduce((s, i) => {
        const addonsTotal = (i.addons || []).reduce((a, ad) => a + ad.addon_price * ad.quantity, 0);
        return s + i.quantity * i.unit_price + addonsTotal * i.quantity;
      }, 0);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: order.customer_name,
          notes: order.notes,
          total,
          scheduled_for: order.scheduled_for || null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = order.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        notes: i.notes || undefined,
        order_id: orderData.id,
      }));
      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select();
      if (itemsError) throw itemsError;

      // Insert addons for each order item
      const allAddons: any[] = [];
      order.items.forEach((cartItem, idx) => {
        if (cartItem.addons && cartItem.addons.length > 0 && insertedItems[idx]) {
          cartItem.addons.forEach((a) => {
            allAddons.push({
              order_item_id: insertedItems[idx].id,
              addon_name: a.addon_name,
              addon_price: a.addon_price,
              quantity: a.quantity,
            });
          });
        }
      });
      if (allAddons.length > 0) {
        const { error: addonsError } = await supabase.from("order_item_addons").insert(allAddons);
        if (addonsError) throw addonsError;
      }

      return orderData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      id: string;
      customer_name?: string;
      notes?: string;
      scheduled_for?: string | null;
      items: CartItem[];
    }) => {
      const total = order.items.reduce((s, i) => {
        const addonsTotal = (i.addons || []).reduce((a, ad) => a + ad.addon_price * ad.quantity, 0);
        return s + i.quantity * i.unit_price + addonsTotal * i.quantity;
      }, 0);

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          customer_name: order.customer_name,
          notes: order.notes,
          total,
          scheduled_for: order.scheduled_for || null,
        })
        .eq("id", order.id);
      if (orderError) throw orderError;

      // Delete existing items (cascades to order_item_addons)
      const { error: delError } = await supabase.from("order_items").delete().eq("order_id", order.id);
      if (delError) throw delError;

      const orderItems = order.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        notes: i.notes || undefined,
        order_id: order.id,
      }));
      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select();
      if (itemsError) throw itemsError;

      const allAddons: any[] = [];
      order.items.forEach((cartItem, idx) => {
        if (cartItem.addons && cartItem.addons.length > 0 && insertedItems[idx]) {
          cartItem.addons.forEach((a) => {
            allAddons.push({
              order_item_id: insertedItems[idx].id,
              addon_name: a.addon_name,
              addon_price: a.addon_price,
              quantity: a.quantity,
            });
          });
        }
      });
      if (allAddons.length > 0) {
        const { error: addonsError } = await supabase.from("order_item_addons").insert(allAddons);
        if (addonsError) throw addonsError;
      }
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

// Menu Addons
export function useMenuAddons() {
  return useQuery({
    queryKey: ["menu_addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_addons").select("*").order("name");
      if (error) throw error;
      return data as MenuAddon[];
    },
  });
}

export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addon: { name: string; price: number }) => {
      const { error } = await supabase.from("menu_addons").insert(addon);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_addons"] }),
  });
}

export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; price?: number; is_active?: boolean }) => {
      const { error } = await supabase.from("menu_addons").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_addons"] }),
  });
}

export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu_addons"] }),
  });
}

// Menu Items
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
