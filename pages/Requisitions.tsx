
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/mockData';
import { Requisition, RequisitionStatus, Sector, StockItem, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input, Modal, StatusBadge } from '../components/UI';
import { Plus, Eye, Check, X as XIcon, Trash2, PackagePlus, AlertCircle } from 'lucide-react';

// --- ZOD SCHEMAS ---
const requisitionSchema = z.object({
  setor_id: z.string().min(1, "Selecione um setor"),
  nome_requisitante: z.string().min(3, "Nome do requisitante é obrigatório e deve ter 3+ caracteres"),
  itens: z.array(
    z.object({
      item_id: z.string().min(1, "Selecione um item"),
      quantidade: z.number().min(1, "Qtd minima 1")
    })
  ).min(1, "Adicione pelo menos um item")
});

const newItemSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  category: z.string().min(2, "Categoria obrigatória"),
  unit: z.string().min(1, "Unidade obrigatória (ex: kg, un)"),
  quantity: z.number().min(0, "A quantidade inicial não pode ser negativa"),
  minLevel: z.number().min(0, "Nível mínimo deve ser positivo")
});

type RequisitionFormData = z.infer<typeof requisitionSchema>;
type NewItemFormData = z.infer<typeof newItemSchema>;

const Requisitions: React.FC = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [stockError, setStockError] = useState<string | null>(null);

  // Form for Requisition
  const { 
    register, 
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset, 
    watch,
    setValue 
  } = useForm<RequisitionFormData>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      nome_requisitante: '',
      itens: [{ item_id: '', quantidade: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens"
  });

  // Watch items to check for stock in real-time if needed
  const watchedItems = watch("itens");

  // Form for New Item
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    formState: { errors: itemErrors }
  } = useForm<NewItemFormData>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      quantity: 0,
      minLevel: 5
    }
  });

  // Load Data
  const fetchData = async () => {
    const [reqs, secs, items] = await Promise.all([
      api.getRequisitions(),
      api.getSectors(),
      api.getStock()
    ]);
    setRequisitions(reqs);
    setSectors(secs);
    setStockItems(items);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const onSubmit = async (data: RequisitionFormData) => {
    if (!user) return;
    setStockError(null);

    // Validation: Check if requested quantity exceeds available stock
    for (const entry of data.itens) {
      const stockItem = stockItems.find(i => i.id === Number(entry.item_id));
      if (!stockItem) continue;

      if (entry.quantidade > stockItem.quantity) {
        setStockError(`Quantidade insuficiente para "${stockItem.name}". Disponível: ${stockItem.quantity} ${stockItem.unit}.`);
        return;
      }
    }
    
    try {
      await api.createRequisition({
        sectorId: Number(data.setor_id),
        nomeRequisitante: data.nome_requisitante,
        createdByUserId: user.id,
        items: data.itens.map(i => ({ itemId: Number(i.item_id), quantity: i.quantidade }))
      });

      alert("Requisição realizada com sucesso! Stock atualizado.");
      reset();
      setViewMode('list');
      fetchData();
    } catch (error: any) {
      alert(`Erro ao criar requisição: ${error.message}`);
    }
  };

  const onCreateItem = async (data: NewItemFormData) => {
    await api.createStockItem({
      ...data,
    });
    await fetchData(); // Refresh list to show new item
    resetItem();
    setIsNewItemModalOpen(false);
  };

  const openDetail = (req: Requisition) => {
    setSelectedReq(req);
    setIsDetailModalOpen(true);
  };

  // Helper to get available stock for a specific item index
  const getAvailableStock = (index: number) => {
    const itemId = watchedItems[index]?.item_id;
    if (!itemId) return null;
    return stockItems.find(i => i.id === Number(itemId));
  };

  // --- UI PARTS ---

  if (viewMode === 'create') {
    return (
      <>
        <Card title="Nova Requisição (Saída de Stock)">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
            Nota: Ao submeter esta requisição, a quantidade será imediatamente descontada do stock.
          </div>

          {stockError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2 text-sm animate-pulse">
              <AlertCircle size={18} />
              <span className="font-semibold">{stockError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setor Solicitante</label>
                <select 
                  {...register('setor_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Selecione...</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.setor_id && <p className="text-red-500 text-xs mt-1">{errors.setor_id.message}</p>}
              </div>

              <Input 
                label="Nome do Requisitante *" 
                placeholder="Quem está a pedir?"
                {...register('nome_requisitante')}
                error={errors.nome_requisitante?.message}
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Itens da Requisição</h4>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setIsNewItemModalOpen(true)} className="text-xs">
                    <PackagePlus size={16} className="mr-2" /> Cadastrar Novo Produto
                  </Button>
                  <Button type="button" variant="primary" onClick={() => append({ item_id: '', quantidade: 1 })} className="text-xs">
                    <Plus size={16} className="mr-2" /> Adicionar Linha
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const currentStockItem = getAvailableStock(index);
                  const hasInsufficientStock = currentStockItem && watchedItems[index].quantidade > currentStockItem.quantity;

                  return (
                    <div key={field.id} className={`flex flex-col gap-2 bg-gray-50 p-3 rounded-md border ${hasInsufficientStock ? 'border-red-300 bg-red-50' : 'border-transparent'}`}>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Item</label>
                          <select 
                            {...register(`itens.${index}.item_id` as const)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Selecione o item...</option>
                            {stockItems.map(item => (
                              <option key={item.id} value={item.id}>{item.name} ({item.unit}) - Disp: {item.quantity}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-xs text-gray-500">Qtd</label>
                          <input 
                              type="number" 
                              {...register(`itens.${index}.quantidade` as const, { valueAsNumber: true })}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${hasInsufficientStock ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`}
                              min="1"
                              max={currentStockItem?.quantity || 99999}
                          />
                        </div>
                        <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {hasInsufficientStock && (
                        <p className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> Quantidade excede o stock disponível ({currentStockItem.quantity})
                        </p>
                      )}
                    </div>
                  );
                })}
                {errors.itens && <p className="text-red-500 text-xs">{errors.itens.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setViewMode('list')}>Cancelar</Button>
              <Button type="submit">Submeter e Dar Saída</Button>
            </div>
          </form>
        </Card>

        {/* Modal for Creating New Stock Item */}
        <Modal 
          isOpen={isNewItemModalOpen} 
          onClose={() => setIsNewItemModalOpen(false)}
          title="Cadastrar Novo Item no Stock"
        >
          <form onSubmit={handleSubmitItem(onCreateItem)} className="space-y-4">
            <Input 
              label="Nome do Item" 
              placeholder="Ex: Sumo de Laranja"
              {...registerItem('name')} 
              error={itemErrors.name?.message}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Categoria" 
                placeholder="Ex: Bebidas"
                {...registerItem('category')} 
                error={itemErrors.category?.message}
              />
              <Input 
                label="Unidade" 
                placeholder="Ex: un, kg, lt"
                {...registerItem('unit')} 
                error={itemErrors.unit?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Nível Mínimo (Alerta)" 
                type="number"
                {...registerItem('minLevel', { valueAsNumber: true })} 
                error={itemErrors.minLevel?.message}
              />
              <Input 
                label="Quantidade Inicial" 
                type="number"
                {...registerItem('quantity', { valueAsNumber: true })} 
                error={itemErrors.quantity?.message}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsNewItemModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Criar Item</Button>
            </div>
          </form>
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Requisições</h2>
        <Button onClick={() => setViewMode('create')}>
          <Plus size={20} className="mr-2 inline" /> Nova Requisição
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisitante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.nomeRequisitante}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.sectorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openDetail(req)} className="text-brand-600 hover:text-brand-900">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma requisição encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalhe da Requisição #${selectedReq?.id}`}
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md">
              <div>
                <span className="block text-gray-500 text-xs uppercase">Requisitante</span>
                <span className="font-semibold text-gray-900">{selectedReq.nomeRequisitante}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Setor</span>
                <span className="font-medium text-gray-900">{selectedReq.sectorName}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Data</span>
                <span className="text-gray-900">{new Date(selectedReq.date).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Criado por</span>
                <span className="text-gray-900">{selectedReq.createdByName}</span>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {selectedReq.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-2 text-right text-gray-900 font-medium">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="text-right text-xs text-gray-500 italic mt-2">
              Requisição processada automaticamente.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Requisitions;
