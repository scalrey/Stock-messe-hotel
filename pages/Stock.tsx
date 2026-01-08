import React, { useEffect, useState } from 'react';
import { api } from '../services/mockData';
import { StockItem, StockMovement, MovementType } from '../types';
import { Card, Modal, Button } from '../components/UI';
import { History, ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react';

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    api.getStock().then(setItems);
  }, []);

  const handleViewHistory = async (item: StockItem) => {
    setSelectedItem(item);
    const history = await api.getItemMovements(item.id);
    setMovements(history);
    setIsHistoryOpen(true);
  };

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Derived state for filtering
  const categories = Array.from(new Set(items.map(item => item.category))).sort();
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(appliedSearch.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Inventário de Stock</h2>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <Button onClick={handleSearch} className="flex items-center gap-2">
            Pesquisar
          </Button>
        </div>
        
        <div className="w-full md:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nível Mínimo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Histórico</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                    {item.quantity} <span className="text-gray-400 font-normal">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.minLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.quantity <= item.minLevel ? (
                      <span className="px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full">Crítico</span>
                    ) : item.quantity <= item.minLevel * 2 ? (
                      <span className="px-2 py-1 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-full">Baixo</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold text-green-800 bg-green-100 rounded-full">OK</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleViewHistory(item)}
                      className="text-brand-600 hover:text-brand-800 transition-colors"
                      title="Ver Histórico"
                    >
                      <History size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum item encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Histórico: ${selectedItem?.name || ''}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Data</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Qtd</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Responsável</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length > 0 ? (
                movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(mov.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(mov.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-4 py-3">
                      {mov.type === MovementType.IN ? (
                        <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <ArrowUpCircle size={12} className="mr-1" /> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                          <ArrowDownCircle size={12} className="mr-1" /> Saída
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">
                      {mov.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {mov.userName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 italic truncate max-w-[150px]">
                      {mov.reason || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Fechar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Stock;