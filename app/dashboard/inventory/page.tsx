'use client';

// app/dashboard/inventory/page.tsx
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
  const { business } = useAppStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    itemName: '', category: '', price: '', stockQuantity: '', unit: '', description: '', isAvailable: true,
  });

  const fetchItems = async () => {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    setItems(data.items || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PATCH' : 'POST';
    const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
    const body = editingItem
      ? { item_name: form.itemName, category: form.category, price: parseFloat(form.price) || null, stock_quantity: parseInt(form.stockQuantity) || null, unit: form.unit, description: form.description, is_available: form.isAvailable }
      : { itemName: form.itemName, category: form.category, price: parseFloat(form.price) || null, stockQuantity: parseInt(form.stockQuantity) || null, unit: form.unit, description: form.description, isAvailable: form.isAvailable };

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    setEditingItem(null);
    setForm({ itemName: '', category: '', price: '', stockQuantity: '', unit: '', description: '', isAvailable: true });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{items.length} items • AI uses this for orders</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingItem(null); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-bold">{editingItem ? 'Edit Item' : 'Add Item'}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { key: 'itemName', label: 'Item Name *', type: 'text', placeholder: 'Butter Chicken' },
              { key: 'category', label: 'Category', type: 'text', placeholder: 'Main Course' },
              { key: 'price', label: 'Price (₹)', type: 'number', placeholder: '250' },
              { key: 'stockQuantity', label: 'Stock Qty', type: 'number', placeholder: '50' },
              { key: 'unit', label: 'Unit', type: 'text', placeholder: 'plate / kg / pcs' },
              { key: 'description', label: 'Description', type: 'text', placeholder: 'Optional' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <input type={type} value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} required={key === 'itemName'}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="available" className="text-sm font-medium">Available for order</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              {editingItem ? 'Update' : 'Add Item'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }}
              className="bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : items.length === 0 ? (
          <EmptyState icon="📦" title="No inventory items" description="Add your menu or services. The AI will use these to handle orders." />
        ) : (
          Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catItems.map((item) => (
                  <div key={item.id} className={`bg-card border rounded-2xl p-4 ${!item.is_available ? 'opacity-50' : 'border-border'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm">{item.item_name}</h3>
                        {item.price && <p className="text-primary font-semibold text-sm">{formatCurrency(item.price)}{item.unit ? `/${item.unit}` : ''}</p>}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditingItem(item); setForm({ itemName: item.item_name, category: item.category || '', price: item.price?.toString() || '', stockQuantity: item.stock_quantity?.toString() || '', unit: item.unit || '', description: item.description || '', isAvailable: item.is_available }); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.stock_quantity !== null && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.stock_quantity <= item.low_stock_alert && (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                        Stock: {item.stock_quantity} {item.unit || ''}
                      </div>
                    )}
                    {!item.is_available && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
    </div>
  );
}
