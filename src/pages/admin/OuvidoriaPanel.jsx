import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Download, CheckCircle, MessageSquare, Clock, User, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../../contexts/AuthContext';
import CustomerHistoryModal from './CustomerHistoryModal';

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    return dateInput.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') ? dateInput + 'Z' : dateInput;
  return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

const OuvidoriaPanel = () => {
  const { logout, user } = React.useContext(AuthContext);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [tratativaText, setTratativaText] = useState('');
  const [isSavingTratativa, setIsSavingTratativa] = useState(false);
  const [historyModalContact, setHistoryModalContact] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    fetch(`${API_URL}/api/ouvidoria`, {
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
        setItems(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro:", err);
        setIsLoading(false);
      });
  };

  const handleSaveTratativa = async (id) => {
    if (!tratativaText.trim()) return;
    setIsSavingTratativa(true);
    
    const loggedUser = user?.name || 'Admin';
    const dataHora = new Date().toLocaleString('pt-BR');
    const finalTratativa = `${tratativaText}\n\n— Tratativa realizada por: ${loggedUser} (${dataHora})`;

    try {
      const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/ouvidoria/${id}/tratativa`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tratativaText: finalTratativa })
      });
      if (res.ok) {
        setTratativaText('');
        fetchItems();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSavingTratativa(false);
  };

  const exportExcel = () => {
    const dataToExport = items.map(item => ({
      'ID': item.id,
      'Data/Hora': formatDate(item.createdAt),
      'Status': item.status || 'Pendente',
      'Assunto': item.assunto,
      'Nome': item.nome,
      'Contato': item.contato,
      'Cidade': item.cidade,
      'Loja/Serviço Referente': item.servico,
      'Mensagem': item.mensagem,
      'Tratativa': item.tratativa || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ouvidoria");
    XLSX.writeFile(workbook, "Ouvidoria_Copercana.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Ouvidoria Copercana", 14, 15);
    const tableColumn = ["Data", "Status", "Assunto", "Cliente", "Loja/Serviço Referente"];
    const tableRows = items.map(item => [
      formatDate(item.createdAt).split(' ')[0],
      item.status || 'Pendente',
      item.assunto,
      item.nome,
      item.servico
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("Ouvidoria_Copercana.pdf");
  };

  const exportSingleToPDF = (item) => {
    if (!item) return;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Detalhes do Chamado - Copercana", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${formatDate(item.createdAt)}`, 14, 28);
    
    const tableData = [
      ["Cliente", item.nome],
      ["Contato", item.contato],
      ["Cidade", item.cidade],
      ["Loja/Serviço Referente", item.servico],
      ["Assunto", item.assunto],
      ["Mensagem Original", item.mensagem],
      ["Status", item.status || 'Pendente'],
      ["Tratativa", item.tratativa || '-']
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

    doc.save(`Ouvidoria_${item.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredItems = items.filter(item => {
    const safeNome = item.nome || '';
    const safeContato = item.contato || '';
    const safeAssunto = item.assunto || '';
    
    const matchesSearch = safeNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          safeContato.includes(searchTerm) ||
                          safeAssunto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || (item.status || 'Pendente') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div>Carregando chamados...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Ouvidoria</h1>
          <p style={{ color: 'var(--color-text-light)' }}>Gerencie reclamações, elogios e sugestões diretas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>
            <Download size={18} /> Excel
          </button>
          <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, contato ou assunto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '250px', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', background: 'white' }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendentes</option>
            <option value="Concluído">Concluídos</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Data</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Cliente</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}>Assunto</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.875rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: selectedItem === item.id ? '#f8fafc' : 'white', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>{formatDate(item.createdAt)}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        background: (item.status || 'Pendente') === 'Concluído' ? '#dcfce7' : '#fef9c3',
                        color: (item.status || 'Pendente') === 'Concluído' ? '#166534' : '#854d0e',
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                      }}>
                        {(item.status || 'Pendente') === 'Concluído' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {item.status || 'Pendente'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.nome}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-main)' }}>{item.assunto}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '0.5rem' }}
                      >
                        {selectedItem === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  
                  {selectedItem === item.id && (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td colSpan="5" style={{ padding: '2rem 1.5rem' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                           <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Detalhes do Chamado #{item.id}</h3>
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button 
                               onClick={() => exportSingleToPDF(item)}
                               style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                             >
                               <FileText size={16} /> Baixar PDF
                             </button>
                             <button 
                               onClick={() => setHistoryModalContact(item.contato)}
                               style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                             >
                               <User size={16} /> Ver Histórico do Cliente
                             </button>
                           </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Contato</p>
                              <p style={{ fontWeight: 500 }}>{item.contato}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Cidade</p>
                              <p style={{ fontWeight: 500 }}>{item.cidade}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Loja/Serviço Referente</p>
                              <p style={{ fontWeight: 500 }}>{item.servico}</p>
                            </div>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Mensagem Original:</p>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '100px' }}>
                              <p style={{ whiteSpace: 'pre-wrap' }}>{item.mensagem}</p>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={18} /> Resolução / Tratativa
                          </h4>
                          
                          {item.tratativa ? (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', color: 'var(--color-text-main)' }}>
                              {item.tratativa}
                            </div>
                          ) : (
                            <div>
                              <textarea 
                                value={tratativaText}
                                onChange={(e) => setTratativaText(e.target.value)}
                                placeholder="Registre aqui a solução ou o contato feito com o cliente..."
                                rows="3"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem', outline: 'none', resize: 'vertical' }}
                              />
                              <button 
                                onClick={() => handleSaveTratativa(item.id)}
                                disabled={isSavingTratativa || !tratativaText.trim()}
                                style={{ padding: '0.5rem 1.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', opacity: (!tratativaText.trim() || isSavingTratativa) ? 0.5 : 1 }}
                              >
                                {isSavingTratativa ? 'Salvando...' : 'Salvar Tratativa e Concluir'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Nenhum chamado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {historyModalContact && (
        <CustomerHistoryModal 
          contato={historyModalContact} 
          onClose={() => setHistoryModalContact(null)} 
        />
      )}
    </div>
  );
};

export default OuvidoriaPanel;
