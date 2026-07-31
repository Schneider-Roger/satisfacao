import React, { useState, useEffect } from 'react';
import { X, Star, FileSpreadsheet, FileText, User, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../../contexts/AuthContext';
import CustomerHistoryModal from './CustomerHistoryModal';

/**
 * Formata datas do formato ISO/SQLite para o padrão pt-BR (DD/MM/AAAA).
 * Lida com segurança tanto para strings brutas vindo do SQLite quanto objetos Date
 * gerados em tempo de execução no frontend (por exemplo, na criação de Tratativas).
 */
const formatDate = (dateInput) => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    return `${dateInput.getDate().toString().padStart(2, '0')}/${(dateInput.getMonth() + 1).toString().padStart(2, '0')}/${dateInput.getFullYear()}`;
  }
  // Garante que o indicador de fuso horário 'Z' esteja presente se for string para evitar desalinhamento de horas
  const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') ? dateInput + 'Z' : dateInput;
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const Responses = () => {
  const { logout } = React.useContext(AuthContext);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tratativaText, setTratativaText] = useState('');
  const [isSavingTratativa, setIsSavingTratativa] = useState(false);
  const [historyModalContact, setHistoryModalContact] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [npsFilter, setNpsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredResponses = responses.filter(item => {
    // Filtro por Texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNome = item.nome?.toLowerCase().includes(term);
      const matchCidade = item.cidade?.toLowerCase().includes(term);
      const matchServico = item.servico?.toLowerCase().includes(term);
      if (!matchNome && !matchCidade && !matchServico) return false;
    }
    
    // Filtro por classificação NPS (Net Promoter Score)
    // Regra clássica de NPS:
    // - Promotores (Promoters): Notas 9 e 10
    // - Neutros (Passives): Notas 7 e 8 (no código, notas de 5 a 8)
    // - Detratores (Detractors): Notas 0 a 4 (ou 0 a 6 na teoria clássica)
    if (npsFilter) {
      if (npsFilter === 'promoters' && item.satisfacao < 9) return false;
      if (npsFilter === 'passives' && (item.satisfacao < 5 || item.satisfacao > 8)) return false;
      if (npsFilter === 'detractors' && item.satisfacao > 4) return false;
    }

    // Filtro por Status
    if (statusFilter) {
      if (statusFilter === 'concluido' && item.status !== 'Concluído') return false;
      if (statusFilter === 'pendente' && item.status === 'Concluído') return false;
    }

    return true;
  });

  const fetchSurveys = () => {
    const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    fetch(`${API_URL}/api/surveys`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          logout();
          throw new Error('Sessão expirada');
        }
        return res.json();
      })
      .then(data => {
        setResponses(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar respostas:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleSaveTratativa = async (id) => {
    if (!tratativaText.trim()) return;
    setIsSavingTratativa(true);

    const loggedUser = localStorage.getItem('loggedUser') || 'Usuário Desconhecido';
    const now = new Date();
    const dataHora = `${formatDate(now)}, ${now.getHours().toString().padStart(2, '0')}h${now.getMinutes().toString().padStart(2, '0')}`;
    const finalTratativa = `${tratativaText}\n\n— Tratativa realizada por: ${loggedUser} (${dataHora})`;

    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/surveys/${id}/tratativa`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tratativa: finalTratativa })
      });
      if (res.ok) {
        // Update local state to reflect change
        setResponses(prev => prev.map(r => r.id === id ? { ...r, status: 'Concluído', tratativa: finalTratativa } : r));
        setSelectedResponse(prev => ({ ...prev, status: 'Concluído', tratativa: finalTratativa }));
        setTratativaText('');
      } else {
        alert("Erro ao salvar tratativa.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setIsSavingTratativa(false);
    }
  };

  const exportToExcel = () => {
    // Flatten data for Excel
    const excelData = filteredResponses.map(item => ({
      Data: formatDate(item.createdAt),
      Nome: item.nome,
      Telefone: item.contato,
      Cidade: item.cidade,
      'Loja/Serviço Referente': item.servico,
      'Satisfação (0-10)': item.satisfacao,
      'Recomendação (0-10)': item.recomendacao,
      'Preços': item.precos,
      'Promoções Atendidas': item.promocoes,
      'Achou Produtos': item.produtos,
      'Primeira Vez': item.primeiraVez,
      'Motivação': item.motivacao,
      'Sugestões': item.sugestao,
      'Status': item.status || 'Pendente',
      'Tratativa': item.tratativa || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Respostas Copercana");
    XLSX.writeFile(workbook, "Relatorio_Satisfacao_Copercana.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório de Satisfação Copercana", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 30);

    // Dados para Tabela PDF (mais resumido)
    const tableColumn = ["Data", "Nome", "Loja/Serviço Referente", "NPS", "Status"];
    const tableRows = [];

    filteredResponses.forEach(item => {
      const rowData = [
        formatDate(item.createdAt),
        item.nome,
        item.servico,
        item.satisfacao !== null ? item.satisfacao : '-',
        item.status || 'Pendente'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }, // Verde primário
      margin: { top: 40 }
    });

    doc.save("Relatorio_Satisfacao_Copercana.pdf");
  };

  const exportSingleToPDF = () => {
    if (!selectedResponse) return;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Detalhes da Avaliação - Copercana", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${formatDate(selectedResponse.createdAt)}`, 14, 28);
    
    const tableData = [
      ["Cliente", selectedResponse.nome],
      ["Contato", selectedResponse.contato],
      ["Cidade", selectedResponse.cidade],
      ["Loja/Serviço Referente", selectedResponse.servico],
      ["Satisfação Geral", selectedResponse.satisfacao !== null ? selectedResponse.satisfacao.toString() : '-'],
      ["Recomendaria", selectedResponse.recomendacao !== null ? selectedResponse.recomendacao.toString() : '-'],
      ["Avaliação de Preços", selectedResponse.precos],
      ["Promoções Atrativas", selectedResponse.promocoes],
      ["Encontrou Produtos", selectedResponse.produtos],
      ["Primeira Vez", selectedResponse.primeiraVez],
      ["Motivação", selectedResponse.motivacao],
      ["Sugestão", selectedResponse.sugestao],
      ["Status", selectedResponse.status || 'Pendente'],
      ["Tratativa", selectedResponse.tratativa || '-']
    ];

    autoTable(doc, {
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [249, 250, 251], cellWidth: 50 },
        1: { cellWidth: 130 }
      }
    });

    doc.save(`Avaliacao_${selectedResponse.nome.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Respostas Recebidas</h1>
          <p style={{ color: 'var(--color-text-light)' }}>Monitore e avalie o feedback contínuo dos seus clientes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={exportToExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
          >
            <FileSpreadsheet size={18} />
            Baixar Excel
          </button>
          <button 
            onClick={exportToPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
          >
            <FileText size={18} />
            Baixar PDF
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, cidade ou loja/serviço..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>
          <select 
            value={npsFilter}
            onChange={(e) => setNpsFilter(e.target.value)}
            style={{ width: '200px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="">Todas as Notas</option>
            <option value="promoters">Satisfeitos (9-10)</option>
            <option value="passives">Neutros (5-8)</option>
            <option value="detractors">Insatisfeitos (0-4)</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '200px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
             <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando respostas...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Data</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Nome</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Cidade</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Loja/Serviço Referente</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Satisfação</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhuma resposta encontrada para os filtros aplicados.</td>
                  </tr>
                ) : filteredResponses.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)' }}>{formatDate(item.createdAt)}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.nome}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>{item.cidade}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }} translate="no">{item.servico}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: item.satisfacao >= 9 ? '#10b981' : item.satisfacao >= 7 ? '#f59e0b' : '#ef4444', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.satisfacao}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }} translate="no">
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.85rem', 
                        fontWeight: 500,
                        backgroundColor: item.status === 'Concluído' ? '#dcfce7' : '#fef9c3',
                        color: item.status === 'Concluído' ? '#166534' : '#854d0e'
                      }}>
                        {item.status === 'Concluído' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button 
                        onClick={() => {
                          setSelectedResponse(item);
                          setTratativaText('');
                        }}
                        style={{ color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {historyModalContact && (
        <CustomerHistoryModal 
          contato={historyModalContact} 
          onClose={() => setHistoryModalContact(null)} 
        />
      )}

      {/* Modal de Detalhes da Resposta */}
      {selectedResponse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            {/* Header do Modal */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: 0 }}>Detalhes da Avaliação #{selectedResponse.id}</h2>
                <button 
                  onClick={() => setHistoryModalContact(selectedResponse.contato)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                >
                  <User size={14} /> Ver Histórico do Cliente
                </button>
              </div>
              <button onClick={() => setSelectedResponse(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>

            {/* Corpo do Modal (Scrollável) */}
            <div style={{ padding: '2rem', overflowY: 'auto' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Data do Envio</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{formatDate(selectedResponse.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Loja/Serviço Referente</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{selectedResponse.servico}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Cliente</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{selectedResponse.nome}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Telefone/WhatsApp</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{selectedResponse.contato}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Cidade</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{selectedResponse.cidade}</div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>Respostas do Questionário</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>Satisfação Geral (0-10)</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.satisfacao}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>Recomendaria a Copercana (0-10)</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.recomendacao}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>Como avalia nossos preços?</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.precos}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>As promoções são atrativas para você?</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.promocoes}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>Encontrou os produtos que procurava?</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.produtos}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-text-main)' }}>Foi sua primeira vez na Copercana?</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedResponse.primeiraVez}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>O que o motivou para procurar a Copercana?</h3>
                <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb', fontStyle: 'italic', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  "{selectedResponse.motivacao}"
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>Qual sua sugestão de melhoria?</h3>
                <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb', fontStyle: 'italic', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  "{selectedResponse.sugestao}"
                </div>
              </div>

              {/* Tratativa Section */}
              <div style={{ padding: '1.5rem', backgroundColor: selectedResponse.status === 'Concluído' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${selectedResponse.status === 'Concluído' ? '#bbf7d0' : '#fef08a'}`, borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: selectedResponse.status === 'Concluído' ? '#166534' : '#854d0e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedResponse.status === 'Concluído' ? '✓ Tratativa Concluída' : '⚠️ Tratativa Pendente'}
                </h3>
                
                {selectedResponse.status === 'Concluído' ? (
                  <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)', lineHeight: '1.5' }}>
                    {selectedResponse.tratativa}
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#854d0e', marginBottom: '1rem', fontSize: '0.9rem' }}>
                      Descreva abaixo as ações que foram tomadas para resolver o problema ou responder à sugestão do cliente.
                    </p>
                    <textarea 
                      value={tratativaText}
                      onChange={(e) => setTratativaText(e.target.value)}
                      placeholder="Ex: O cliente foi contatado via telefone, pedimos desculpas pelo ocorrido e oferecemos um desconto..."
                      style={{ width: '100%', minHeight: '100px', padding: '1rem', border: '1px solid #fcd34d', borderRadius: 'var(--radius-md)', marginBottom: '1rem', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleSaveTratativa(selectedResponse.id)}
                        disabled={isSavingTratativa || !tratativaText.trim()}
                        style={{ padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, opacity: (!tratativaText.trim() || isSavingTratativa) ? 0.6 : 1 }}
                      >
                        {isSavingTratativa ? 'Salvando...' : 'Marcar como Concluído'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer do Modal */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={exportSingleToPDF}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                <FileText size={18} />
                Baixar PDF
              </button>
              <button 
                onClick={() => setSelectedResponse(null)}
                style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Responses;
