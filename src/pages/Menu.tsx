import { useState } from "react";
import {
  useMenuItems,
  useMenuCategories,
  useMenuAddons,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  useDeleteCategory,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
} from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MenuPage() {
  const { data: items } = useMenuItems();
  const { data: categories } = useMenuCategories();
  const { data: addons } = useMenuAddons();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Item form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Addon form
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [showAddonDialog, setShowAddonDialog] = useState(false);

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setCategoryId(""); setIsActive(true); setEditingItem(null);
  };

  const resetAddonForm = () => {
    setAddonName(""); setAddonPrice(""); setEditingAddon(null);
  };

  const openEdit = (item: any) => {
    setEditingItem(item); setName(item.name); setDescription(item.description || "");
    setPrice(String(item.price)); setCategoryId(item.category_id || ""); setIsActive(item.is_active);
    setShowItemDialog(true);
  };

  const openEditAddon = (addon: any) => {
    setEditingAddon(addon); setAddonName(addon.name); setAddonPrice(String(addon.price));
    setShowAddonDialog(true);
  };

  const handleSaveItem = async () => {
    if (!name || !price) { toast.error("Nome e preço são obrigatórios"); return; }
    try {
      const data = { name, description: description || null, price: parseFloat(price), category_id: categoryId || null, is_active: isActive };
      if (editingItem) { await updateItem.mutateAsync({ id: editingItem.id, ...data }); toast.success("Item atualizado!"); }
      else { await createItem.mutateAsync(data); toast.success("Item criado!"); }
      setShowItemDialog(false); resetForm();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveAddon = async () => {
    if (!addonName || !addonPrice) { toast.error("Nome e preço são obrigatórios"); return; }
    try {
      if (editingAddon) {
        await updateAddon.mutateAsync({ id: editingAddon.id, name: addonName, price: parseFloat(addonPrice) });
        toast.success("Adicional atualizado!");
      } else {
        await createAddon.mutateAsync({ name: addonName, price: parseFloat(addonPrice) });
        toast.success("Adicional criado!");
      }
      setShowAddonDialog(false); resetAddonForm();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteItem = async (id: string) => {
    try { await deleteItem.mutateAsync(id); toast.success("Item removido!"); } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteAddon = async (id: string) => {
    try { await deleteAddon.mutateAsync(id); toast.success("Adicional removido!"); } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleAddon = async (addon: any) => {
    try { await updateAddon.mutateAsync({ id: addon.id, is_active: !addon.is_active }); } catch (err: any) { toast.error(err.message); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try { await createCategory.mutateAsync({ name: newCategoryName.trim() }); toast.success("Categoria criada!"); setNewCategoryName(""); }
    catch (err: any) { toast.error(err.message); }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "Sem categoria";
    return categories?.find((c) => c.id === catId)?.name || "—";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cardápio</h1>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="addons">Adicionais</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showItemDialog} onOpenChange={(o) => { setShowItemDialog(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
                  <div><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {(categories || []).map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Ativo</Label></div>
                  <Button className="w-full" onClick={handleSaveItem}>{editingItem ? "Salvar alterações" : "Criar item"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(items || []).map((item) => (
              <Card key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryName(item.category_id)}</p>
                    </div>
                    <span className="font-bold text-primary">R$ {Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Ativo" : "Inativo"}</Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Addons Tab */}
        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAddonDialog} onOpenChange={(o) => { setShowAddonDialog(o); if (!o) resetAddonForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo Adicional</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingAddon ? "Editar Adicional" : "Novo Adicional"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nome</Label><Input value={addonName} onChange={(e) => setAddonName(e.target.value)} placeholder="Ex: Bacon, Hambúrguer extra..." /></div>
                  <div><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} /></div>
                  <Button className="w-full" onClick={handleSaveAddon}>{editingAddon ? "Salvar alterações" : "Criar adicional"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(addons || []).map((addon) => (
              <Card key={addon.id} className={!addon.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{addon.name}</p>
                    <span className="font-bold text-primary">+ R$ {Number(addon.price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={addon.is_active} onCheckedChange={() => handleToggleAddon(addon)} />
                      <span className="text-xs text-muted-foreground">{addon.is_active ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditAddon(addon)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteAddon(addon.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(addons || []).length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">Nenhum adicional cadastrado</p>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Categorias</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {(categories || []).map((cat) => (
                  <Badge key={cat.id} variant="secondary" className="gap-1">
                    {cat.name}
                    <button onClick={() => deleteCategory.mutate(cat.id)} className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Nova categoria..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
                <Button size="sm" onClick={handleAddCategory}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
