import { useState } from "react";
import { useOrders, useUpdateOrderStatus, type Order, type OrderStatus } from "@/hooks/use-data";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Plus, Pencil, CalendarClock } from "lucide-react";
import { format as fmtDate } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const statusFlow: OrderStatus[] = ["pending", "preparing", "ready", "delivered"];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const { data: orders, isLoading } = useOrders(dateFilter || undefined);
  const updateStatus = useUpdateOrderStatus();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canCreateOrders = hasRole("admin") || hasRole("cashier");
  const canUpdateStatus = hasRole("admin") || hasRole("cashier") || hasRole("kitchen");

  const filtered = (orders || []).filter((o) => {
    const matchSearch =
      !search ||
      o.order_number.toString().includes(search) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleNextStatus = (order: Order) => {
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx < statusFlow.length - 1) {
      const next = statusFlow[currentIdx + 1];
      updateStatus.mutate({ id: order.id, status: next }, {
        onSuccess: () => toast.success(`Pedido #${order.order_number} → ${next}`),
      });
    }
  };

  const handleCancel = (order: Order) => {
    if (order.status === "delivered" || order.status === "cancelled") return;
    updateStatus.mutate({ id: order.id, status: "cancelled" }, {
      onSuccess: () => toast.success(`Pedido #${order.order_number} cancelado`),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {canCreateOrders && (
          <Button onClick={() => navigate("/orders/new")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Pedido
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-[160px]"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">Nenhum pedido encontrado</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">#{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                {order.customer_name && (
                  <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                )}
                <div className="text-sm space-y-1">
                  {order.order_items.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between">
                        <span>
                          {item.quantity}x {item.item_name}
                          {item.notes && <span className="text-muted-foreground ml-1">({item.notes})</span>}
                        </span>
                        <span className="text-muted-foreground">
                          R$ {(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>
                      {item.order_item_addons && item.order_item_addons.length > 0 && (
                        <div className="pl-4 text-xs text-muted-foreground">
                          {item.order_item_addons.map((a) => (
                            <span key={a.id} className="block">+ {a.quantity > 1 ? `${a.quantity}x ` : ""}{a.addon_name} (R$ {Number(a.addon_price * a.quantity).toFixed(2)})</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <p className="text-xs text-muted-foreground italic">Obs: {order.notes}</p>
                )}
                {(order as any).scheduled_for && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    <span>Agendado: {format(new Date((order as any).scheduled_for), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="font-bold text-primary">R$ {Number(order.total).toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canCreateOrders && order.status !== "delivered" && order.status !== "cancelled" && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${order.id}/edit`)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    )}
                    {canUpdateStatus && order.status !== "delivered" && order.status !== "cancelled" && (
                      <>
                        <Button size="sm" onClick={() => handleNextStatus(order)}>
                          Avançar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(order)}>
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
