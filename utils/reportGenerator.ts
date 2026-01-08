
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../services/mockData";
import { RequisitionStatus } from "../types";

export const generatePDFReport = async (period: 'weekly' | 'monthly') => {
  const doc = new jsPDF();
  const today = new Date();
  
  // Calcular intervalo de datas
  const startDate = new Date();
  if (period === 'weekly') {
    startDate.setDate(today.getDate() - 7);
  } else {
    startDate.setMonth(today.getMonth() - 1);
  }

  // Buscar dados
  const requisitions = await api.getRequisitions();
  const stock = await api.getStock();
  const stats = await api.getStats();

  // Filtrar requisições do período
  const filteredReqs = requisitions.filter(req => {
    const reqDate = new Date(req.date);
    return reqDate >= startDate && reqDate <= today;
  });

  // Cabeçalho do PDF
  doc.setFontSize(20);
  doc.text("Messe Hotel Huambo", 14, 22);
  
  doc.setFontSize(14);
  doc.text(`Relatório de Gestão de Stock (${period === 'weekly' ? 'Semanal' : 'Mensal'})`, 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${today.toLocaleDateString()} às ${today.toLocaleTimeString()}`, 14, 38);
  doc.text(`Período: ${startDate.toLocaleDateString()} até ${today.toLocaleDateString()}`, 14, 43);

  // Seção 1: Resumo Estatístico
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("Resumo Geral", 14, 55);
  
  const summaryData = [
    ['Total de Requisições no Período', filteredReqs.length.toString()],
    ['Itens com Stock Crítico (Atual)', stats.lowStockItems.toString()],
    ['Total de Itens Cadastrados', stats.totalItems.toString()],
  ];

  autoTable(doc, {
    startY: 60,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] }, // brand-500
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  // CONTROLO MANUAL DE POSIÇÃO Y
  // Inicializa com o final da tabela anterior + margem
  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // Seção 2: Tabela de Requisições
  doc.setFontSize(12);
  doc.text("Detalhamento de Requisições", 14, currentY);

  const reqBody = filteredReqs.map(req => [
    new Date(req.date).toLocaleDateString(),
    `#${req.id}`,
    req.nomeRequisitante,
    req.sectorName || '-',
    req.items.length.toString(),
    req.status
  ]);

  currentY += 5; // Espaço após título

  if (reqBody.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'ID', 'Requisitante', 'Setor', 'Qtd Itens', 'Estado']],
      body: reqBody,
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
    });
    // Atualiza Y para o final desta tabela + margem
    currentY = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Nenhuma requisição encontrada neste período.", 14, currentY + 5);
    doc.setTextColor(0);
    // Avança manualmente pois não houve tabela
    currentY += 20; 
  }

  // Seção 3: Itens com Stock Baixo (Alerta)
  const lowStock = stock.filter(item => item.quantity <= item.minLevel);
  if (lowStock.length > 0) {
    
    // Verificar se cabe na página, senão cria nova
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(12);
    doc.text("Alerta de Reposição (Stock Crítico)", 14, currentY);
    
    autoTable(doc, {
        startY: currentY + 5,
        head: [['Item', 'Categoria', 'Atual', 'Mínimo', 'Unidade']],
        body: lowStock.map(i => [i.name, i.category, i.quantity, i.minLevel, i.unit]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }, // red-600
    });
  }

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
  }

  doc.save(`relatorio_messe_${period}_${today.toISOString().split('T')[0]}.pdf`);
};
