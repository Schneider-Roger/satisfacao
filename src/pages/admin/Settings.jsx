import { useState, useEffect, useContext } from 'react';
import { Upload, Plus, Trash2, Save, Image as ImageIcon, Mail, Pencil } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const Settings = () => {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('geral');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mocks de Estado ou recuperados do LocalStorage
  const [mainEmail, setMainEmail] = useState('');
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState(null);
  const [banners, setBanners] = useState([]);
  const [bannerTitle, setBannerTitle] = useState('');
  const [services, setServices] = useState([]);
  const [surveyDescription, setSurveyDescription] = useState('');
  const [ouvidoriaTitle, setOuvidoriaTitle] = useState('');
  const [ouvidoriaDescription, setOuvidoriaDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    fetch(`${API_URL}/api/settings`, {
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
        if (data.banners) {
          try {
            setBanners(JSON.parse(data.banners));
          } catch(e) { console.error(e); }
        } else if (data.bannerPreview || data.bannerMobilePreview) {
          setBanners([{ id: Date.now(), desktop: data.bannerPreview, mobile: data.bannerMobilePreview }]);
        }
        if (data) {
          setMainEmail(data.mainEmail || 'diretoria@copercana.com.br');
          setBannerTitle(data.bannerTitle || 'Pesquisa de Satisfação');
          setSurveyDescription(data.surveyDescription || 'Queremos ouvir você! Por favor, dedique alguns minutos para avaliar nosso atendimento e serviços. Sua opinião nos ajuda a crescer e oferecer o melhor.');
          setOuvidoriaTitle(data.ouvidoriaTitle || 'Ouvidoria Copercana');
          setOuvidoriaDescription(data.ouvidoriaDescription || 'Seu canal direto de comunicação. Envie sua dúvida, reclamação ou sugestão e retornaremos o mais breve possível.');
          setBannerPreview(data.bannerPreview || null);
          setBannerMobilePreview(data.bannerMobilePreview || null);
          setServices(data.services ? JSON.parse(data.services) : []);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar configurações:", err);
        setIsLoading(false);
      });
  }, []);

  const [newService, setNewService] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState('ambos');

  // Estados adicionados para edição inline de serviços existentes
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editType, setEditType] = useState('ambos');

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newService.trim() || !newEmail.trim()) return;
    setServices([...services, { id: Date.now(), name: newService, email: newEmail, type: newType }]);
    setNewService('');
    setNewEmail('');
    setNewType('ambos');
  };

  const handleRemoveService = (id) => {
    // Se estiver editando o item removido, cancela a edição
    if (editingServiceId === id) cancelEditService();
    setServices(services.filter(s => s.id !== id));
  };

  // Funções para controle da edição inline
  const startEditService = (service) => {
    setEditingServiceId(service.id);
    setEditName(service.name);
    setEditEmail(service.email);
    setEditType(service.type || 'ambos');
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditName('');
    setEditEmail('');
    setEditType('ambos');
  };

  const saveEditService = () => {
    if (!editName.trim() || !editEmail.trim()) return;
    setServices(services.map(s => s.id === editingServiceId ? { ...s, name: editName, email: editEmail, type: editType } : s));
    setEditingServiceId(null);
    setEditName('');
    setEditEmail('');
    setEditType('ambos');
  };

  const handleAddBanner = () => {
    setBanners([...banners, { id: Date.now(), desktop: null, mobile: null }]);
  };

  const handleRemoveBanner = (id) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const handleBannerImageUpload = (e, id, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanners(banners.map(b => b.id === id ? { ...b, [type]: reader.result } : b));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e, isMobile = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMobile) {
          setBannerMobilePreview(reader.result);
        } else {
          setBannerPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mainEmail,
          bannerTitle,
          bannerPreview, // mantendo por segurança
          bannerMobilePreview, // mantendo por segurança
          services,
          banners,
          surveyDescription,
          ouvidoriaTitle,
          ouvidoriaDescription
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Erro ao salvar configurações no banco de dados.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão ao tentar salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando configurações...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Personalização do Site</h1>
          <p style={{ color: 'var(--color-text-light)' }}>Configure as preferências, textos e e-mails do sistema.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', 
            backgroundColor: saveSuccess ? '#10b981' : 'var(--color-primary)', 
            color: 'white', border: 'none', borderRadius: 'var(--radius-md)', 
            cursor: isSaving ? 'wait' : 'pointer', fontWeight: 500,
            transition: 'background-color 0.3s'
          }}
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo com sucesso!' : 'Salvar Alterações'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Menu Lateral de Configurações */}
        <div style={{ width: '250px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <button 
            onClick={() => setActiveTab('geral')}
            style={{ 
              width: '100%', padding: '1rem', textAlign: 'left', border: 'none', background: activeTab === 'geral' ? '#f3f4f6' : 'white',
              borderLeft: activeTab === 'geral' ? '3px solid var(--color-primary)' : '3px solid transparent',
              cursor: 'pointer', fontWeight: activeTab === 'geral' ? 600 : 400, color: 'var(--color-text-main)'
            }}
          >
            Configurações Gerais
          </button>
          <button 
            onClick={() => setActiveTab('banner')}
            style={{ 
              width: '100%', padding: '1rem', textAlign: 'left', border: 'none', background: activeTab === 'banner' ? '#f3f4f6' : 'white',
              borderLeft: activeTab === 'banner' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderTop: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: activeTab === 'banner' ? 600 : 400, color: 'var(--color-text-main)'
            }}
          >
            Banner Principal
          </button>
          <button 
            onClick={() => setActiveTab('textos')}
            style={{ 
              width: '100%', padding: '1rem', textAlign: 'left', border: 'none', background: activeTab === 'textos' ? '#f3f4f6' : 'white',
              borderLeft: activeTab === 'textos' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderTop: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: activeTab === 'textos' ? 600 : 400, color: 'var(--color-text-main)'
            }}
          >
            Textos da Interface
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            style={{ 
              width: '100%', padding: '1rem', textAlign: 'left', border: 'none', background: activeTab === 'services' ? '#f3f4f6' : 'white',
              borderLeft: activeTab === 'services' ? '3px solid var(--color-primary)' : '3px solid transparent',
              borderTop: '1px solid var(--color-border)', cursor: 'pointer', fontWeight: activeTab === 'services' ? 600 : 400, color: 'var(--color-text-main)'
            }}
          >
            Lojas / Serviços Referentes
          </button>
        </div>

        {/* Conteúdo Central */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
          
          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Configurações Gerais</h2>
              
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Mail color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>E-mail Principal (Cópia Oculta)</h3>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Este e-mail atua como uma espécie de auditoria. Ele receberá uma cópia de <strong>todas</strong> as pesquisas de satisfação enviadas, independentemente de qual serviço o cliente tenha selecionado.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Endereço de E-mail Global</label>
                  <input 
                    type="email" 
                    value={mainEmail}
                    onChange={(e) => setMainEmail(e.target.value)}
                    placeholder="ex: diretoria@copercana.com.br"
                    style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEXTOS */}
          {activeTab === 'textos' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Textos da Interface</h2>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem' }}>Textos da Pesquisa de Satisfação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Título da Página</label>
                    <input 
                      type="text" 
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Descrição</label>
                    <textarea 
                      value={surveyDescription}
                      onChange={(e) => setSurveyDescription(e.target.value)}
                      rows="3"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f9fafb', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem' }}>Textos da Ouvidoria</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Título da Página</label>
                    <input 
                      type="text" 
                      value={ouvidoriaTitle}
                      onChange={(e) => setOuvidoriaTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Descrição</label>
                    <textarea 
                      value={ouvidoriaDescription}
                      onChange={(e) => setOuvidoriaDescription(e.target.value)}
                      rows="3"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BANNER */}
          {activeTab === 'banner' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Gerenciador de Banners</h2>
                <button onClick={handleAddBanner} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>
                  <Plus size={16} /> Novo Banner
                </button>
              </div>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Adicione múltiplas campanhas. Elas passarão automaticamente na tela inicial a cada 5 segundos.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {banners.map((b, index) => (
                  <div key={b.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#f9fafb', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Banner {index + 1}</h3>
                      <button onClick={() => handleRemoveBanner(b.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}><Trash2 size={16} /> Excluir</button>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      {/* Desktop */}
                      <div style={{ flex: '2', minWidth: '300px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Imagem para Computador (1920x520px)</p>
                        <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: b.desktop ? '0.5rem' : '2rem 1rem', textAlign: 'center', backgroundColor: '#fff', position: 'relative' }}>
                          {b.desktop ? (
                            <div style={{ position: 'relative' }}>
                              <img src={b.desktop} style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '0.25rem' }} />
                              <label style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                                Trocar <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleBannerImageUpload(e, b.id, 'desktop')} />
                              </label>
                            </div>
                          ) : (
                            <label style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <Upload size={24} color="var(--color-text-muted)" />
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Fazer Upload (Desktop)</span>
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleBannerImageUpload(e, b.id, 'desktop')} />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div style={{ flex: '1', minWidth: '200px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Imagem para Celular (600x800px)</p>
                        <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: b.mobile ? '0.5rem' : '2rem 1rem', textAlign: 'center', backgroundColor: '#fff', position: 'relative' }}>
                          {b.mobile ? (
                            <div style={{ position: 'relative' }}>
                              <img src={b.mobile} style={{ width: '100%', maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '0.25rem', margin: '0 auto', display: 'block' }} />
                              <label style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                                Trocar <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleBannerImageUpload(e, b.id, 'mobile')} />
                              </label>
                            </div>
                          ) : (
                            <label style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <Upload size={24} color="var(--color-text-muted)" />
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>Fazer Upload (Mobile)</span>
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleBannerImageUpload(e, b.id, 'mobile')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {banners.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>Nenhum banner cadastrado.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SERVIÇOS */}
          {activeTab === 'services' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Lista de Lojas e Serviços Referentes</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Estas opções aparecerão na caixa de seleção para o cliente escolher sobre qual loja/serviço referente ele está opinando.</p>
              
              <form onSubmit={handleAddService} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Nome da loja/serviço (ex: Supermercado Sertãozinho)"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    required
                  />
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="E-mail do responsável (ex: gestor@copercana.com.br)"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                    required
                  />
                  {/* 
                      Seletor de Escopo de Exibição (Filtro Inteligente):
                      Define se a loja/serviço aparece na pesquisa NPS pública, no formulário de Ouvidoria, ou em ambos.
                      Isso evita que clientes tentem dar feedback NPS de canais de ouvidoria pura (ex: CoperMais).
                  */}
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
                  >
                    <option value="ambos">Exibir em Ambos (Pesquisa e Ouvidoria)</option>
                    <option value="satisfacao">Apenas Pesquisa de Satisfação</option>
                    <option value="ouvidoria">Apenas Ouvidoria</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, height: '45px' }}>
                  <Plus size={18} /> Adicionar
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {services.map((service) => (
                  editingServiceId === service.id ? (
                    // Card no modo de Edição Inline
                    <div key={service.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb' }}>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Nome da Loja/Serviço</label>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>E-mail do Responsável</label>
                          <input 
                            type="email" 
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '250px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Exibição</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'white' }}
                          >
                            <option value="ambos">Exibir em Ambos</option>
                            <option value="satisfacao">Apenas Pesquisa</option>
                            <option value="ouvidoria">Apenas Ouvidoria</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={saveEditService} style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>
                            Confirmar
                          </button>
                          <button onClick={cancelEditService} style={{ padding: '0.5rem 1rem', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Card no modo normal de visualização
                    <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {service.name}
                          <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: '#f3f4f6', borderRadius: '1rem', fontWeight: 500, color: 'var(--color-text-light)' }}>
                            {service.type === 'satisfacao' ? 'Só Pesquisa' : service.type === 'ouvidoria' ? 'Só Ouvidoria' : 'Ambos'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Responsável: {service.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => startEditService(service)} style={{ color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleRemoveService(service.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                ))}
                {services.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Nenhuma loja/serviço cadastrado.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
