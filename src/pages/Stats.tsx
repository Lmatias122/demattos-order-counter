import { useMemo, useState } from "react";
import { useOrders } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, ShoppingCart, TrendingUp, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StatsPage() {
  const { data: orders } = useOrders();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const stats = useMemo(() => {
    if (!orders) return null;

    const todayOrders = orders.filter((o) => format(parseISO(o.created_at), "yyyy-MM-dd") === todayStr);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthOrders = orders.filter((o) => {
      const d = parseISO(o.created_at);
      return d >= monthStart && d <= monthEnd;
    });

    const dailyRevenue = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const dailyCount = todayOrders.length;
    const dailyCancelled = todayOrders.filter((o) => o.status === "cancelled").length;

    const monthlyRevenue = monthOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
    const monthlyCount = monthOrders.length;

    // Most sold items
    const itemCounts: Record<string, number> = {};
    monthOrders.forEach((o) =>
      o.order_items.forEach((i) => {
        itemCounts[i.item_name] = (itemCounts[i.item_name] || 0) + i.quantity;
      })
    );
    const bestSellers = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Daily chart data
    const days = eachDayOfInterval({ start: monthStart, end: today });
    const dailyChart = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = monthOrders.filter((o) => format(parseISO(o.created_at), "yyyy-MM-dd") === dayStr);
      return {
        date: format(day, "dd/MM"),
        receita: dayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
        pedidos: dayOrders.length,
      };
    });

    const todayBestSeller = (() => {
      const counts: Record<string, number> = {};
      todayOrders.forEach((o) =>
        o.order_items.forEach((i) => {
          counts[i.item_name] = (counts[i.item_name] || 0) + i.quantity;
        })
      );
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] || "—";
    })();

    return {
      dailyRevenue,
      dailyCount,
      dailyCancelled,
      todayBestSeller,
      monthlyRevenue,
      monthlyCount,
      bestSellers,
      dailyChart,
    };
  }, [orders, todayStr]);

  if (!stats) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estatísticas</h1>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Hoje</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ShoppingCart} label="Pedidos" value={String(stats.dailyCount)} />
            <StatCard icon={DollarSign} label="Receita" value={`R$ ${stats.dailyRevenue.toFixed(2)}`} />
            <StatCard icon={TrendingUp} label="Mais vendido" value={stats.todayBestSeller} />
            <StatCard icon={XCircle} label="Cancelados" value={String(stats.dailyCancelled)} />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={DollarSign} label="Receita mensal" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} />
            <StatCard icon={ShoppingCart} label="Pedidos no mês" value={String(stats.monthlyCount)} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Top 5 mais vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.bestSellers.map(([name, count], i) => (
                  <div key={name} className="flex justify-between text-sm py-1">
                    <span>{i + 1}. {name}</span>
                    <span className="text-muted-foreground">{count}x</span>
                  </div>
                ))}
                {stats.bestSellers.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receita diária (mês atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyChart}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="receita" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pedidos por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.dailyChart}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pedidos" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
