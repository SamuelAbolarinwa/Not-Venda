import React, { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  FileText 
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockMovement, MovementType } from '../types/inventory';

export const MovementsLedgerView: React.FC = () => {
  const { movements } = useInventory();
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        m.sku.toLowerCase().includes(search.toLowerCase()) ||
        m.reference.toLowerCase().includes(search.toLowerCase()) ||
        m.reason.toLowerCase().includes(search.toLowerCase()) ||
        m.operator.toLowerCase().includes(search.toLowerCase());

      const matchesType = selectedType === 'all' || m.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [movements, search, selectedType]);

  const exportLedgerCSV = () => {
    const headers = [
      'Timestamp',
      'Movement ID',
      'Reference',
      'Type',
      'SKU',
      'Product Name',
      'Quantity Delta',
      'Previous Stock',
      'New Stock',
      'Reason',
      'Operator',
    ];

    const rows = filteredMovements.map((m) => [
      `"${m.timestamp}"`,
      `"${m.id}"`,
      `"${m.reference}"`,
      `"${m.type}"`,
      `"${m.sku}"`,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.type === 'in' ? `+${m.quantity}` : m.type === 'out' ? `-${m.quantity}` : `${m.quantity}`,
      m.previousStock,
      m.newStock,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.operator.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_movements_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, SKU, operator..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={exportLedgerCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Ledger</span>
            </button>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Movements ({movements.length})
          </button>
          <button
            onClick={() => setSelectedType('in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              selectedType === 'in'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            Stock In
          </button>
          <button
            onClick={() => setSelectedType('out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              selectedType === 'out'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />
            Stock Out
          </button>
          <button
            onClick={() => setSelectedType('adjustment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              selectedType === 'adjustment'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            Audit Adjustments
          </button>
        </div>
      </div>

      {/* Movements Audit Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                <th className="py-3.5 px-3 font-semibold">Type</th>
                <th className="py-3.5 px-3 font-semibold">Reference</th>
                <th className="py-3.5 px-3 font-semibold">Item & SKU</th>
                <th className="py-3.5 px-3 font-semibold text-center">Change</th>
                <th className="py-3.5 px-3 font-semibold">Stock (Before → After)</th>
                <th className="py-3.5 px-3 font-semibold">Reason</th>
                <th className="py-3.5 px-4 font-semibold text-right">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                    No movements found matching the current search filters.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIn = m.type === 'in';
                  const isOut = m.type === 'out';
                  const date = new Date(m.timestamp);

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {date.toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isIn
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : isOut
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                          }`}
                        >
                          {isIn ? (
                            <>
                              <ArrowDownToLine className="w-3 h-3" /> In
                            </>
                          ) : isOut ? (
                            <>
                              <ArrowUpFromLine className="w-3 h-3" /> Out
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" /> Adj
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-xs font-mono font-medium text-indigo-300">
                        {m.reference}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-slate-100 font-medium text-xs line-clamp-1">
                          {m.productName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{m.sku}</div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isIn ? 'text-emerald-400' : isOut ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        >
                          {isIn ? `+${m.quantity}` : isOut ? `-${m.quantity}` : `⇄ ${m.quantity}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-xs font-mono text-slate-300 whitespace-nowrap">
                        <span className="text-slate-400">{m.previousStock}</span>
                        <span className="text-slate-600 mx-1.5">→</span>
                        <span className="font-bold text-slate-100">{m.newStock}</span>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-slate-300 max-w-[200px] truncate">
                        {m.reason}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-right text-slate-400 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 font-medium text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{m.operator}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
