import React, { useEffect, useState } from 'react';
import { X, Calendar, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    return dateInput.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
  const dateString = typeof dateInput === 'string' && !dateInput.endsWith('Z') ? dateInput + 'Z' : dateInput;
  return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

const CustomerHistoryModal = ({ contato, onClose }) => {
  const { logout } = React.useContext(AuthContext);
  const [history, setHistory] = useState({ surveys: [], ouvidoria: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    
    // As the phone number might have special characters like (), spaces or -, encode it properly
    const encodedContato = encodeURIComponent(contato);
    
    fetch(`${API_URL}/api/history/${encodedContato}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            logout();
          }
          throw new Error('Erro na API: ' + res.status);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setHistory(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar histórico:", err);
        setHistory({ surveys: [], ouvidoria: [], error: err.message });
        setIsLoading(false);
      });
  }, [contato]);

  // Combine and sort by date descending
  const combinedTimeline = [];
  
  if (history && history.surveys && Array.isArray(history.surveys)) {
    history.surveys.forEach(s => {
      combinedTimeline.push({
        type: 'survey',
        date: new Date(typeof s.createdAt === 'string' && !s.createdAt.endsWith('Z') ? s.createdAt + 'Z' : s.createdAt),
        data: s
      });
    });
  }
  
  if (history && history.ouvidoria && Array.isArray(history.ouvidoria)) {
    history.ouvidoria.forEach(o => {
      combinedTimeline.push({
        type: 'ouvidoria',
        date: new Date(typeof o.createdAt === 'string' && !o.createdAt.endsWith('Z') ? o.createdAt + 'Z' : o.createdAt),
        data: o
      });
    });
  }
  
  combinedTimeline.sort((a, b) => b.date - a.date);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Dossiê do Cliente</h2>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>WhatsApp: {contato}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-text-light)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>Buscando registros...</div>
          ) : history.error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Erro ao buscar histórico.</div>
          ) : combinedTimeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>Nenhum histórico encontrado para este número.</div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Vertical line for timeline */}
              <div style={{ position: 'absolute', left: '24px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0' }}></div>
              
              {combinedTimeline.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                  
                  {/* Icon indicator */}
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: item.type === 'survey' ? '#eff6ff' : '#fef2f2', border: `2px solid ${item.type === 'survey' ? '#3b82f6' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    {item.type === 'survey' ? <Star size={24} color="#3b82f6" /> : <MessageSquare size={24} color="#ef4444" />}
                  </div>

                  {/* Card Content */}
                  <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', flex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', background: item.type === 'survey' ? '#3b82f6' : '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                        {item.type === 'survey' ? 'Pesquisa de Satisfação' : `Ouvidoria: ${item.data.assunto}`}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> {formatDate(item.date)}
                      </span>
                    </div>
                    
                    <p style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                      Loja/Serviço Referente: <span style={{ fontWeight: 400 }}>{item.data.servico}</span>
                    </p>

                    {item.type === 'survey' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>Nota NPS:</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: item.data.satisfacao >= 9 ? '#16a34a' : item.data.satisfacao >= 7 ? '#ca8a04' : '#dc2626' 
                        }}>
                          {item.data.satisfacao} / 10
                        </span>
                      </div>
                    )}

                    {item.type === 'ouvidoria' && (
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--color-text-light)' }}>"{item.data.mensagem}"</p>
                      </div>
                    )}

                    {item.data.tratativa && (
                      <div style={{ marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ArrowRight size={14} /> Tratativa Realizada:
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{item.data.tratativa}</p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryModal;
