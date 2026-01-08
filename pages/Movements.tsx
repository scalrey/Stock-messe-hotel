
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/mockData';
import { StockMovement, MovementType, StockItem } from '../types';
import { Card, Button, Input } from '../components/UI';
import { ArrowDownCircle, ArrowUpCircle, Save, History, PlusCircle } from 'lucide-react';

// --- SCHEMAS ---

const movementSchema = z.object({
  itemId: z.string().min(1, "Selecione um produto"),
  quantity: z.number().min(1, "A quantidade deve ser maior que 0"),
  date: z.string().min(1, "Data é obrigatória"),
  reason: z.string().optional()
});

type MovementFormData = z.infer<typeof movementSchema>;

const Movements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Formulário Principal (Movimento)
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      quantity: 1,
      date: new Date().toISOString().split('T')[0] // Today's date YYYY-MM-DD
    }
  });

  const loadData = async () => {
    setLoading(true);
    const [movData, itemsData] = await Promise.all([
      api.getAllMovements(),
      api.getStock()
    ]);
    setMovements(movData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: MovementFormData) => {
    try {
      await api.createMovement({
        itemId: Number(data.itemId),
        quantity: data.quantity,
        type: MovementType.IN, // Always IN for this form
        date: new Date(data.date).toISOString(),
        reason: data.reason || 'Entrada Manual de Stock'
      });
      
      alert("Entrada de stock realizada com sucesso!");
      reset({
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        reason: '',
        itemId: ''
      });
      loadData();
    } catch (error: any) {
      alert(error.message || "Erro ao registar movimento");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Registration Form Card */}
      <Card className="p-6 border-t-4 border-t-green-500">
        <div className="flex items-center mb-6">
           <div className="p-2 rounded-full bg-green-100 mr-3">
             <PlusCircle size={24} className="text-green-600" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-gray-900">Registar Entrada de Stock</h2>
             <p className="text-sm text-gray-500">Adicione novos produtos ao inventário.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <select
              {...register('itemId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            >
              <option value="">Selecione um produto...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit}) - Atual: {item.quantity}
                </option>
              ))}
            </select>
            {errors.itemId && <p className="text-red-500 text-xs mt-1">{errors.itemId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantidade (Entrada)" 
              type="number" 
              {...register('quantity', { valueAsNumber: true })}
              error={errors.quantity?.message}
            />
            <Input 
              label="Data" 
              type="date" 
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Fornecedor</label>
            <textarea
              {...register('reason')}
              rows={2}
              placeholder="Ex: Compra mensal Kero..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            ></textarea>
          </div>

          <Button 
            type="submit" 
            className="w-full flex justify-center items-center py-3 bg-green-600 hover:bg-green-700"
          >
            <Save size={18} className="mr-2" />
            Confirmar Entrada
          </Button>
        </form>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <History className="mr-2" size={20}/> Histórico Geral de Movimentos
        </h3>
      </div>

      {/* History Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
           <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.slice(0, 10).map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(mov.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mov.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mov.type === MovementType.IN ? (
                        <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                          <ArrowUpCircle size={14} className="mr-1.5" /> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                          <ArrowDownCircle size={14} className="mr-1.5" /> Saída
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-700">
                      {mov.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic truncate max-w-[200px]">
                      {mov.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Movements;
