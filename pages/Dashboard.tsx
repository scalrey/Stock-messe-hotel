import React, { useEffect, useState } from 'react';
import { api } from '../services/mockData';
import { DashboardStats, StockItem, UserRole } from '../types';
import { Card, Button } from '../components/UI';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Package, FileText, Download } from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const s = await api.getStats();
      const stockData = await api.getStock();
      setStats(s);
      setStock(stockData);
    };
    loadData();
  }, []);

  const handleDownloadReport = async (period: 'weekly' | 'monthly') => {
    setIsGenerating(true);
    try {
      await generatePDFReport(period);
    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Erro ao gerar relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!stats) return <div>Carregando dashboard...</div>;

  const lowStockData = stock
    .filter(item => item.quantity <= item.minLevel * 2) // Show items near low stock
    .map(item => ({
      name: item.name,
      value: item.quantity,
      minLevel: item.minLevel
    })).slice(0, 10);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
        
        {/* Report Actions */}
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             onClick={() => handleDownloadReport('weekly')} 
             disabled={isGenerating}
             className="flex items-center text-sm"
           >
             <FileText size={16} className="mr-2" />
             Relatório Semanal
           </Button>
           <Button 
             variant="outline" 
             onClick={() => handleDownloadReport('monthly')} 
             disabled={isGenerating}
             className="flex items-center text-sm"
           >
             <Download size={16} className="mr-2" />
             Relatório Mensal
           </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Itens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600 mr-4">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Baixo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Requisições Feitas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedRequisitions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card title="Níveis de Stock (Itens Críticos/Baixos)">
        <div className="h-96 w-full flex justify-center">
          {lowStockData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lowStockData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {lowStockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Quantidade']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum item com stock baixo no momento.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;