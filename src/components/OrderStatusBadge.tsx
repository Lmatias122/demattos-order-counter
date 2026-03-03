import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/hooks/use-data";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-status-pending text-primary-foreground" },
  preparing: { label: "Preparando", className: "bg-status-preparing text-primary-foreground" },
  ready: { label: "Pronto", className: "bg-status-ready text-primary-foreground" },
  delivered: { label: "Entregue", className: "bg-status-delivered text-primary-foreground" },
  cancelled: { label: "Cancelado", className: "bg-status-cancelled text-primary-foreground" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
