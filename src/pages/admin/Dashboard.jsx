import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Star, ThumbsUp, MessageSquare, Headphones, BarChart2 } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { logout } = React.useContext(AuthContext);
  const [surveys, setSurveys] = useState([]);
  const [ouvidoria, setOuvidoria] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [servicoFilter, setServicoFilter] = useState('');
  const [viewMode, setViewMode] = useState('surveys'); // 'surveys' | 'ouvidoria'
  const [services, setServices] = useState([]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    
    Promise.all([
      fetch(`${API_URL}/api/surveys`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
      fetch(`${API_URL}/api/ouvidoria`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
      fetch(`${API_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
    ])
    .then(async ([resSurveys, resOuvidoria, resSettings]) => {
      if (resSurveys.status === 401 || resOuvidoria.status === 401) {
        logout();
        throw new Error('Sessão expirada');
      }
      const dataSurveys = await resSurveys.json();
      const dataOuvidoria = await resOuvidoria.json();
      const dataSettings = await resSettings.json();
      setSurveys(dataSurveys);
      setOuvidoria(dataOuvidoria);
      setServices(dataSettings.services ? JSON.parse(dataSettings.services) : []);
      setIsLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar dashboard:", err);
      setIsLoading(false);
    });
  }, []);

  // Filter surveys
  const filteredSurveys = surveys.filter(s => {
    if (!s.createdAt) return false;
    const date = new Date(s.createdAt);
    if (dataInicial && date < new Date(dataInicial + 'T00:00:00')) return false;
    if (dataFinal && date > new Date(dataFinal + 'T23:59:59')) return false;
    if (servicoFilter && s.servico !== servicoFilter) return false;
    return true;
  });

  // Filter ouvidoria
  const filteredOuvidoria = ouvidoria.filter(o => {
    if (!o.createdAt) return false;
    const date = new Date(o.createdAt);
    if (dataInicial && date < new Date(dataInicial + 'T00:00:00')) return false;
    if (dataFinal && date > new Date(dataFinal + 'T23:59:59')) return false;
    if (servicoFilter && o.servico !== servicoFilter) return false;
    return true;
  });

  /* ====================== MÉTRICAS DE PESQUISA (NPS) ====================== */
  const totalRespostas = filteredSurveys.length;
  const promotores = filteredSurveys.filter(s => s.satisfacao >= 9).length;
  const neutros = filteredSurveys.filter(s => s.satisfacao >= 5 && s.satisfacao <= 8).length;
  const detratores = filteredSurveys.filter(s => s.satisfacao <= 4).length;
  const npsScore = totalRespostas > 0 ? Math.round(((promotores - detratores) / totalRespostas) * 100) : 0;
  const tratativasPendentes = filteredSurveys.filter(s => s.status !== 'Concluído').length;
  const tratativasConcluidas = filteredSurveys.filter(s => s.status === 'Concluído').length;

  const npsData = [
    { name: 'Satisfeitos', value: promotores },
    { name: 'Neutros', value: neutros },
    { name: 'Insatisfeitos', value: detratores },
  ];

  const statusData = [
    { name: 'Total', value: totalRespostas },
    { name: 'Concluído', value: tratativasConcluidas },
    { name: 'Pendente', value: tratativasPendentes },
  ];

  const precosCount = { Excelente: 0, Bom: 0, Regular: 0, Ruim: 0 };
  const recomCount = { Satisfeitos: 0, Neutros: 0, Insatisfeitos: 0 };
  const promoCount = { 'Sim': 0, 'Não': 0, 'Às vezes': 0 };
  const produtosCount = { 'Sim': 0, 'Não': 0, 'Parcialmente': 0 };
  const primeiraVezCount = { 'Sim': 0, 'Não': 0 };
  const servicosCount = {};

  filteredSurveys.forEach(s => {
    if (s.precos && precosCount[s.precos] !== undefined) precosCount[s.precos]++;
    if (s.recomendacao !== undefined && s.recomendacao !== null) {
      if (s.recomendacao >= 9) recomCount.Satisfeitos++;
      else if (s.recomendacao >= 5) recomCount.Neutros++;
      else recomCount.Insatisfeitos++;
    }
    if (s.promocoes) {
      const p = s.promocoes === 'As vezes' ? 'Às vezes' : s.promocoes;
      if (promoCount[p] !== undefined) promoCount[p]++;
    }
    if (s.produtos && produtosCount[s.produtos] !== undefined) produtosCount[s.produtos]++;
    if (s.primeiraVez && primeiraVezCount[s.primeiraVez] !== undefined) primeiraVezCount[s.primeiraVez]++;
    if (s.servico) {
      if (!servicosCount[s.servico]) servicosCount[s.servico] = { name: s.servico, Total: 0, Concluídas: 0, Pendentes: 0 };
      servicosCount[s.servico].Total++;
      if (s.status === 'Concluído') servicosCount[s.servico].Concluídas++;
      else servicosCount[s.servico].Pendentes++;
    }
  });

  const servicosData = Object.values(servicosCount).sort((a, b) => b.Total - a.Total);
  const precosData = [
    { name: 'Excelente', value: precosCount.Excelente },
    { name: 'Bom', value: precosCount.Bom },
    { name: 'Regular', value: precosCount.Regular },
    { name: 'Ruim', value: precosCount.Ruim },
  ];
  const recomData = [
    { name: 'Satisfeitos', value: recomCount.Satisfeitos },
    { name: 'Neutros', value: recomCount.Neutros },
    { name: 'Insatisfeitos', value: recomCount.Insatisfeitos },
  ];
  const promoData = [
    { name: 'Sim', value: promoCount['Sim'] },
    { name: 'Não', value: promoCount['Não'] },
    { name: 'Às vezes', value: promoCount['Às vezes'] },
  ];
  const produtosData = [
    { name: 'Sim', value: produtosCount['Sim'] },
    { name: 'Não', value: produtosCount['Não'] },
    { name: 'Parcialmente', value: produtosCount['Parcialmente'] },
  ];
  const primeiraVezData = [
    { name: 'Sim', value: primeiraVezCount['Sim'] },
    { name: 'Não', value: primeiraVezCount['Não'] },
  ];

  const statsSurveys = [
    { title: 'Total de Respostas', value: totalRespostas, icon: <Users size={24} color="var(--color-primary)" /> },
    { title: 'Tratativas Concluídas', value: tratativasConcluidas, icon: <ThumbsUp size={24} color="#10b981" /> },
    { title: 'Tratativas Pendentes', value: tratativasPendentes, icon: <MessageSquare size={24} color="#ef4444" /> },
    { title: 'NPS de Satisfação', value: npsScore > 0 ? `+${npsScore}` : npsScore, icon: <Star size={24} color={npsScore >= 50 ? '#10b981' : '#f59e0b'} /> },
  ];

  /* ====================== MÉTRICAS DA OUVIDORIA ====================== */
  const totalOuvidoria = filteredOuvidoria.length;
  const ouvConcluidas = filteredOuvidoria.filter(o => o.status === 'Concluído').length;
  const ouvPendentes = filteredOuvidoria.filter(o => o.status !== 'Concluído').length;
  
  const assuntoCount = {};
  const ouvServicosCount = {};

  filteredOuvidoria.forEach(o => {
    if (o.assunto) {
      if (!assuntoCount[o.assunto]) assuntoCount[o.assunto] = 0;
      assuntoCount[o.assunto]++;
    }
    if (o.servico) {
      if (!ouvServicosCount[o.servico]) ouvServicosCount[o.servico] = { name: o.servico, Total: 0, Concluídas: 0, Pendentes: 0 };
      ouvServicosCount[o.servico].Total++;
      if (o.status === 'Concluído') ouvServicosCount[o.servico].Concluídas++;
      else ouvServicosCount[o.servico].Pendentes++;
    }
  });

  const assuntoData = Object.entries(assuntoCount).map(([name, value]) => ({ name, value }));
  const ouvServicosData = Object.values(ouvServicosCount).sort((a, b) => b.Total - a.Total);

  const ouvStatusData = [
    { name: 'Total', value: totalOuvidoria },
    { name: 'Concluído', value: ouvConcluidas },
    { name: 'Pendente', value: ouvPendentes },
  ];

  const statsOuvidoria = [
    { title: 'Total de Mensagens', value: totalOuvidoria, icon: <Headphones size={24} color="var(--color-primary)" /> },
    { title: 'Tratativas Concluídas', value: ouvConcluidas, icon: <ThumbsUp size={24} color="#10b981" /> },
    { title: 'Tratativas Pendentes', value: ouvPendentes, icon: <MessageSquare size={24} color="#ef4444" /> },
    { title: 'Reclamações Ativas', value: filteredOuvidoria.filter(o => o.assunto === 'Reclamação' && o.status !== 'Concluído').length, icon: <Star size={24} color="#ef4444" /> },
  ];

  const [selectedChart, setSelectedChart] = useState(null);
  const chartRef = React.useRef(null);

  const handleDownload = async () => {
    if (!chartRef.current || !selectedChart) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${selectedChart.title}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Erro ao baixar gráfico:", error);
      alert("Ocorreu um erro ao gerar a imagem do gráfico.");
    }
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const chartsConfigSurveys = [
    {
      id: 'servicos', title: 'Tratativas por Negócio',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={servicosData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
            <YAxis allowDecimals={false} tick={{fill: 'var(--color-text-muted)'}} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Legend verticalAlign="bottom" height={36} />
            <Bar dataKey="Concluídas" stackId="a" fill="#10b981" />
            <Bar dataKey="Pendentes" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'status', title: 'Status das Tratativas',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
            <YAxis allowDecimals={false} tick={{fill: 'var(--color-text-muted)'}} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'nps', title: 'Nível de Satisfação (0-10)',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={npsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
            </Pie>
            <Tooltip /><Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'precos', title: 'Avaliação dos Preços',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={precosData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
            <YAxis allowDecimals={false} tick={{fill: 'var(--color-text-muted)'}} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'promo', title: 'Promoções são Atrativas?',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={promoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#f59e0b" />
            </Pie>
            <Tooltip /><Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      )
    }
  ];

  const chartsConfigOuvidoria = [
    {
      id: 'ouv_assunto', title: 'Proporção por Assunto',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={assuntoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {assuntoData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip /><Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'ouv_servicos', title: 'Volume por Loja/Serviço Referente',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ouvServicosData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
            <YAxis allowDecimals={false} tick={{fill: 'var(--color-text-muted)'}} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Legend verticalAlign="bottom" height={36} />
            <Bar dataKey="Concluídas" stackId="a" fill="#10b981" />
            <Bar dataKey="Pendentes" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'ouv_status', title: 'Status da Ouvidoria',
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ouvStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
            <YAxis allowDecimals={false} tick={{fill: 'var(--color-text-muted)'}} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  ];

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Carregando dados...</div>;
  }

  const currentStats = viewMode === 'surveys' ? statsSurveys : statsOuvidoria;
  const currentCharts = viewMode === 'surveys' ? chartsConfigSurveys : chartsConfigOuvidoria;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        
        {/* Toggle Switch */}
        <div style={{ display: 'flex', backgroundColor: '#e5e7eb', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
          <button
            onClick={() => setViewMode('surveys')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontWeight: 600, transition: 'all 0.2s',
              backgroundColor: viewMode === 'surveys' ? 'white' : 'transparent',
              color: viewMode === 'surveys' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'surveys' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <BarChart2 size={18} /> Pesquisas (NPS)
          </button>
          <button
            onClick={() => setViewMode('ouvidoria')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontWeight: 600, transition: 'all 0.2s',
              backgroundColor: viewMode === 'ouvidoria' ? 'white' : 'transparent',
              color: viewMode === 'ouvidoria' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'ouvidoria' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Headphones size={18} /> Ouvidoria
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Data Inicial</label>
            <input 
              type="date" 
              value={dataInicial} 
              onChange={e => setDataInicial(e.target.value)} 
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Data Final</label>
            <input 
              type="date" 
              value={dataFinal} 
              onChange={e => setDataFinal(e.target.value)} 
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Loja/Serviço Referente</label>
            <select 
              value={servicoFilter}
              onChange={(e) => setServicoFilter(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="">Todos...</option>
              {services
                .filter(s => viewMode === 'surveys' 
                  ? (!s.type || s.type === 'ambos' || s.type === 'satisfacao')
                  : (!s.type || s.type === 'ambos' || s.type === 'ouvidoria'))
                .map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {currentStats.map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{stat.title}</div>
              <div style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '50%' }}>{stat.icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {currentCharts.map((config) => (
          <div 
            key={config.id} 
            onClick={() => setSelectedChart(config)}
            style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-text-main)', textAlign: 'center' }}>
              {config.title}
            </h2>
            <div style={{ height: '300px' }}>
              {config.render()}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
              Clique para ampliar e baixar
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedChart && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>{selectedChart.title}</h2>
              <button onClick={() => setSelectedChart(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
              <div ref={chartRef} style={{ width: '100%', height: '450px', backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--color-text-main)' }}>{selectedChart.title}</h3>
                <div style={{ width: '100%', height: 'calc(100% - 3rem)' }}>
                  {selectedChart.render()}
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedChart(null)}
                style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                Fechar
              </button>
              <button 
                onClick={handleDownload}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Baixar Imagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
