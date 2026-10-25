import React from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  ArrowRight, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';

interface DashboardViewProps {
  onNavigateTab: (tab: 'products' | 'movements' | 'orders' | 'suppliers') => void;
  onOpenMovementModal: (type?: 'in' | 'out', productId?: string) => void;
  onOpenProductModal: (product?: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenMovementModal,
  onOpenProductModal,
}) => {
  const { products, movements, purchaseOrders, stats, receivePurchaseOrder } = useInventory();

  // Category breakdown calculation
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { count: number; qty: number; value: number }> = {};
    for (const p of products) {
      if (!map[p.category]) {
        map[p.category] = { count: 0, qty: 0, value: 0 };
      }
      map[p.category].count += 1;
      map[p.category].qty += p.currentStock;
      map[p.category].value += p.currentStock * p.costPrice;
    }
    return Object.entries(map).map(([category, data]) => ({
      category,
      ...data,
      percent: stats.totalCostValue > 0 ? (data.value / stats.totalCostValue) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [products, stats.totalCostValue]);

  // Urgent items needing attention (out of stock or low stock)
  const urgentProducts = React.useMemo(() => {
    return products.filter((p) => p.status === 'out_of_stock' || p.status === 'low_stock');
  }, [products]);

  // Recent 5 movements
  const recentMovements = React.useMemo(() => {
    return movements.slice(0, 5);
  }, [movements]);

  // Pending orders
  const pendingOrders = React.useMemo(() => {
    return purchaseOrders.filter((o) => o.status === 'ordered');
  }, [purchaseOrders]);

  const profitMarginPercent = stats.totalCostValue > 0 
    ? Math.round(((stats.totalRetailValue - stats.totalCostValue) / stats.totalRetailValue) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse Operations Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time tracking of active inventory units, stock valuation, and replenishment queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-right">
            <span className="text-xs text-slate-400 block font-medium">Estimated Margin</span>
            <span className="text-lg font-bold text-emerald-400">+{profitMarginPercent}%</span>
          </div>
          <button
            onClick={() => onNavigateTab('products')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <span>Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Valuation (Cost)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ${stats.totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Retail Value:</span>
              <span className="text-slate-300 font-medium">${stats.totalRetailValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SKUs & Stock Units</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {stats.totalQuantity.toLocaleString()} <span className="text-sm font-normal text-slate-400">units</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Across <strong className="text-slate-200">{stats.totalItems} distinct SKUs</strong>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
              {stats.lowStockCount} <span className="text-sm font-normal text-slate-400">items</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Below configured reorder threshold
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold tracking-tight ${stats.outOfStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.outOfStockCount} <span className="text-sm font-normal text-slate-400">depleted</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {stats.outOfStockCount > 0 ? 'Urgent purchase order required' : 'All SKUs currently in stock'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Attention List & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Restock Attention (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Replenishment Priority Queue</h2>
              <span className="text-xs bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                {urgentProducts.length} items
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              View All
            </button>
          </div>

          {urgentProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              All inventory levels are above minimum safety thresholds. Great job!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Item & SKU</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Stock / Min</th>
                    <th className="pb-3 font-semibold">Supplier</th>
                    <th className="pb-3 font-semibold text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {urgentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-medium text-slate-200 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-400">
                        {p.category}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              p.currentStock === 0 ? 'text-rose-400' : 'text-amber-400'
                            }`}
                          >
                            {p.currentStock}
                          </span>
                          <span className="text-xs text-slate-500">/ {p.minThreshold} {p.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-400 truncate max-w-[120px]">
                        {p.supplierName}
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          onClick={() => onOpenMovementModal('in', p.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
                        >
                          + Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Stock by Category</h2>
              <span className="text-xs text-slate-400">{categoryStats.length} Categories</span>
            </div>
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-300">{cat.category}</span>
                    <span className="text-slate-400 font-mono">
                      ${cat.value.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({Math.round(cat.percent)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${Math.max(5, cat.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                    <span>{cat.count} SKUs</span>
                    <span>{cat.qty} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Supplier Partners</span>
            <span className="font-semibold text-slate-200">{stats.suppliersCount} active</span>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Recent Ledger Activity & Incoming PO Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ledger Movements */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Stock Activity</h2>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Full Ledger →
            </button>
          </div>

          <div className="space-y-3">
            {recentMovements.map((mov) => {
              const isIn = mov.type === 'in';
              const isOut = mov.type === 'out';
              return (
                <div
                  key={mov.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIn
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isOut
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownToLine className="w-4 h-4" />
                      ) : isOut ? (
                        <ArrowUpFromLine className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200 line-clamp-1">
                        {mov.productName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="font-mono text-slate-500">{mov.reference}</span>
                        <span>•</span>
                        <span>{mov.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold font-mono ${
                        isIn ? 'text-emerald-400' : isOut ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    >
                      {isIn ? `+${mov.quantity}` : isOut ? `-${mov.quantity}` : `${mov.newStock}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Inbound Purchase Orders */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Inbound PO Deliveries</h2>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Manage Orders →
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No pending inbound purchase orders.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-indigo-400 text-sm">
                        {order.poNumber}
                      </span>
                      <span className="text-xs text-slate-400">• {order.supplierName}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {order.items.length} item line(s) • Total ${order.totalAmount.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => receivePurchaseOrder(order.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors shrink-0"
                  >
                    Receive Stock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
