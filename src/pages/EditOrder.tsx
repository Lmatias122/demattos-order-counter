import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder, useUpdateOrder, useMenuItems, useMenuCategories } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ArrowLeft, CalendarClock } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes: string;
}

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id!);
  const { data: menuItems } = useMenuItems();
  const { data: categories } = useMenuCategories();
  const updateOrder = useUpdateOrder();

  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Load order data into form
  useEffect(() => {
    if (order && !initialized) {
      setCustomerName(order.customer_name || "");
      setOrderNotes(order.notes || "");
      setCart(
        order.order_items.map((item) => ({
          menu_item_id: item.menu_item_id || item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes || "",
        }))
      );
      const sf = (order as any).scheduled_for;
      if (sf) {
        setIsScheduled(true);
        const d = new Date(sf);
        setScheduledDate(d.toISOString().slice(0, 10));
        setScheduledTime(d.toISOString().slice(11, 16));
      }
      setInitialized(true);
    }
  }, [order, initialized]);

  const activeItems = (menuItems || []).filter(
    (i) => i.is_active && (!activeCategory || i.category_id === activeCategory)
  );

  const addToCart = (item: typeof menuItems extends (infer T)[] ? T : never) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menu_item_id: item.id, item_name: item.name, quantity: 1, unit_price: item.price, notes: "" }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menu_item_id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const updateItemNotes = (menuItemId: string, notes: string) => {
    setCart((prev) => prev.map((c) => (c.menu_item_id === menuItemId ? { ...c, notes } : c)));
  };

  const total = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error("Preencha a data e hora do agendamento");
      return;
    }
    try {
      const scheduled_for = isScheduled ? `${scheduledDate}T${scheduledTime}:00` : null;
      await updateOrder.mutateAsync({
        id: id!,
        customer_name: customerName || undefined,
        notes: orderNotes || undefined,
        scheduled_for,
        items: cart,
      });
      toast.success("Pedido atualizado!");
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar pedido");
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground p-8 text-center">Carregando pedido...</p>;
  }

  if (order && (order.status === "delivered" || order.status === "cancelled")) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Pedido #{order.order_number}</h1>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Pedidos entregues ou cancelados não podem ser editados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          Editar Pedido #{order?.order_number}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,380px]">
        {/* Menu */}
        <div className="space-y-4">
          <Input
            placeholder="Nome do cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              Todos
            </Badge>
            {(categories || []).map((cat) => (
              <Badge
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {activeItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">
                      R$ {Number(item.price).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Clique nos itens do cardápio para adicionar
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.menu_item_id} className="space-y-1 pb-2 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.item_name}</span>
                    <span className="text-sm">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.menu_item_id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.menu_item_id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="Obs..."
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.menu_item_id, e.target.value)}
                      className="h-6 text-xs flex-1"
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => updateQty(item.menu_item_id, -item.quantity)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Textarea
              placeholder="Observações gerais do pedido..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={2}
            />

            {/* Scheduling */}
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="schedule-toggle" className="text-sm font-medium">Agendar pedido</Label>
                </div>
                <Switch id="schedule-toggle" checked={isScheduled} onCheckedChange={setIsScheduled} />
              </div>
              {isScheduled && (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={updateOrder.isPending}>
              {updateOrder.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
