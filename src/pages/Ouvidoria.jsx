import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, Menu, X as CloseIcon, MapPin, Phone, Scale } from 'lucide-react';
import { PatternFormat } from 'react-number-format';
import Confetti from 'react-confetti';
import logoHorizontal from '../assets/logos/Copercana_Horizontal-bco.png';
import logoVertical from '../assets/logos/Copercana_logo-bco.png';
import '../App.css';

function Ouvidoria() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    cidade: '',
    servico: '',
    assunto: '',
    mensagem: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState(null);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [ouvidoriaTitle, setOuvidoriaTitle] = useState('Ouvidoria Copercana');
  const [ouvidoriaDescription, setOuvidoriaDescription] = useState('Seu canal direto de comunicação. Envie sua dúvida, reclamação ou sugestão e retornaremos o mais breve possível.');

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.banners) {
          try {
            const parsed = JSON.parse(data.banners);
            if (parsed && parsed.length > 0) setBanners(parsed);
          } catch(e) { console.error(e); }
        }
        setOuvidoriaTitle(data.ouvidoriaTitle || 'Ouvidoria Copercana');
        setOuvidoriaDescription(data.ouvidoriaDescription || 'Seu canal direto de comunicação. Envie sua dúvida, reclamação ou sugestão e retornaremos o mais breve possível.');
        setBannerPreview(data.bannerPreview || null);
        setBannerMobilePreview(data.bannerMobilePreview || null);
        setSettings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar configurações:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ouvidoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({
            nome: '', contato: '', cidade: '', servico: '', assunto: '', mensagem: ''
          });
        }, 5000);
      } else {
        alert('Erro ao enviar mensagem. Tente novamente mais tarde.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToFooter = () => {
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  const defaultServices = [
    { id: 1, name: 'Postos', email: 'postos@copercana.com.br' },
    { id: 2, name: 'Lojas', email: 'lojas@copercana.com.br' },
    { id: 3, name: 'Supermercados', email: 'supermercados@copercana.com.br' },
    { id: 4, name: 'Unidade de Grão', email: 'grao@copercana.com.br' },
    { id: 5, name: 'Distribuidora', email: 'distribuidora@copercana.com.br' },
    { id: 6, name: 'CoperMais', email: 'copermais@copercana.com.br' },
    { id: 7, name: 'Outros', email: 'diretoria@copercana.com.br' }
  ];
  const services = settings?.services ? JSON.parse(settings.services) : defaultServices;

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <Confetti recycle={false} numberOfPieces={500} gravity={0.2} />
        <div className="success-message" style={{ background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <CheckCircle className="success-icon" size={64} style={{ color: '#16a34a', margin: '0 auto 1.5rem', display: 'block' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Mensagem Recebida!</h2>
          <p className="description" style={{ color: '#6b7280', fontSize: '1.1rem' }}>Agradecemos o seu contato. Nossa equipe analisará sua solicitação e retornará em breve.</p>
          <button className="btn-submit" style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#0b4e29', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }} onClick={() => setIsSuccess(false)}>
            Enviar nova mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="navbar" style={{ position: 'relative' }}>
        <div className="navbar-container">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon size={28} /> : <Menu size={28} />}
          </button>

          <a href="#" className="navbar-logo" style={{ textDecoration: 'none', margin: '0 auto' }}>
            <img
              src={logoHorizontal}
              alt="Copercana Logo"
              className="logo-desktop"
            />
            <img
              src={logoVertical}
              alt="Copercana Logo"
              className="logo-mobile"
            />
          </a>

          <button className="btn-outline desktop-btn" onClick={scrollToFooter} type="button">
            Contatos
          </button>

          <div className="mobile-spacer"></div>

          <div className="mobile-menu-overlay">
            <button className="btn-outline" style={{ width: '100%' }} onClick={scrollToFooter} type="button">
              Contatos
            </button>
          </div>
        </div>
      </header>

      <style>
        {`
          .banner-slider {
             position: relative;
             width: 100%;
             height: 520px;
             overflow: hidden;
          }
          .dynamic-banner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 1s ease-in-out;
          }
          .dynamic-banner.active {
            opacity: 1;
          }
          .banner-indicators {
             position: absolute;
             bottom: 1rem;
             left: 0;
             width: 100%;
             display: flex;
             justify-content: center;
             gap: 0.5rem;
             z-index: 10;
          }
          .indicator {
             width: 10px;
             height: 10px;
             border-radius: 50%;
             background: rgba(255,255,255,0.5);
             cursor: pointer;
             transition: background 0.3s;
          }
          .indicator.active {
             background: white;
          }
          .logo-desktop { display: none; }
          .logo-mobile { display: block; height: 55px; width: auto; margin: 0 auto; }

          .mobile-menu-btn { display: block; background: none; border: none; color: white; cursor: pointer; padding: 0; }
          .desktop-btn { display: none; }
          .mobile-spacer { display: block; width: 28px; }

          .mobile-menu-overlay {
            display: ${isMobileMenuOpen ? 'flex' : 'none'};
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: #0b4e29;
            padding: 1.5rem 2rem;
            z-index: 50;
            flex-direction: column;
            border-top: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          @media (min-width: 768px) {
            .logo-desktop { display: block; height: 75px; width: auto; }
            .logo-mobile { display: none; }
            
            .mobile-menu-btn { display: none; }
            .desktop-btn { display: block; }
            .mobile-spacer { display: none; }
            .mobile-menu-overlay { display: none !important; }
          }
        `}
      </style>
      
      {banners.length > 0 ? (
        <div className="banner-slider">
          {banners.map((b, idx) => (
             <div 
               key={b.id || idx}
               className={`dynamic-banner ${idx === currentBannerIndex ? 'active' : ''}`}
               style={{ 
                  backgroundImage: window.innerWidth >= 768 
                    ? `url(${b.desktop || bannerPreview})` 
                    : `url(${b.mobile || b.desktop || bannerMobilePreview || bannerPreview})` 
               }}
             ></div>
          ))}
          {banners.length > 1 && (
            <div className="banner-indicators">
               {banners.map((_, idx) => (
                  <div key={idx} className={`indicator ${idx === currentBannerIndex ? 'active' : ''}`} onClick={() => setCurrentBannerIndex(idx)}></div>
               ))}
            </div>
          )}
        </div>
      ) : (
        <div className="banner-slider">
          <div className="dynamic-banner active" style={{ backgroundImage: window.innerWidth >= 768 ? `url(${bannerPreview})` : `url(${bannerMobilePreview || bannerPreview})` }}></div>
        </div>
      )}

      <main className="main-content container">
        <div className="header-text">
          <h1><strong>{ouvidoriaTitle}</strong></h1>
          <p className="description">
            {ouvidoriaDescription}
          </p>
        </div>

        <form className="survey-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nome">Nome Completo</label>
              <input 
                required 
                type="text" 
                id="nome" 
                name="nome" 
                value={formData.nome} 
                onChange={handleChange} 
                placeholder="Seu nome" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contato">Telefone / WhatsApp</label>
              <PatternFormat 
                format="(##) #####-####" 
                required 
                id="contato"
                name="contato" 
                value={formData.contato} 
                onValueChange={(values) => setFormData(prev => ({ ...prev, contato: values.formattedValue }))} 
                placeholder="(00) 00000-0000" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="cidade">Cidade</label>
              <input 
                required 
                type="text" 
                id="cidade" 
                name="cidade" 
                value={formData.cidade} 
                onChange={handleChange} 
                placeholder="Sua cidade" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="servico">Loja/Serviço Referente</label>
              <select 
                required 
                id="servico"
                name="servico" 
                value={formData.servico} 
                onChange={handleChange} 
              >
                <option value="">Selecione um serviço...</option>
                {/* 
                    Filtro de Lojas/Serviços Públicos:
                    Garante que apenas opções voltadas a Ouvidoria (ou aplicáveis a ambos) 
                    apareçam no dropdown de seleção do cliente, ocultando canais exclusivos de Pesquisa NPS.
                */}
                {services.filter(s => !s.type || s.type === 'ambos' || s.type === 'ouvidoria').map((s, idx) => (
                  <option key={idx} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Detalhes do Contato</h3>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="assunto">Qual o assunto principal?</label>
              <select 
                required 
                id="assunto"
                name="assunto" 
                value={formData.assunto} 
                onChange={handleChange} 
              >
                <option value="">Selecione o assunto...</option>
                <option value="Reclamação">Reclamação</option>
                <option value="Sugestão">Sugestão</option>
                <option value="Elogio">Elogio</option>
                <option value="Dúvida">Dúvida</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mensagem">Sua Mensagem</label>
              <textarea 
                required 
                id="mensagem"
                name="mensagem" 
                value={formData.mensagem} 
                onChange={handleChange} 
                rows="5" 
                placeholder="Descreva sua solicitação em detalhes..." 
              ></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting}
            style={{ marginTop: '1.5rem' }}
          >
            {isSubmitting ? 'Enviando...' : (
              <>
                <Send size={20} />
                Enviar Mensagem
              </>
            )}
          </button>
        </form>
      </main>

      <footer className="footer">
        <div className="footer-container" style={{ padding: '0 2rem' }}>
          <div className="footer-col" style={{ alignItems: 'center' }}>
            <img
              src={logoVertical}
              alt="Copercana"
              style={{ width: '120px', height: 'auto', marginBottom: '1rem' }}
            />
            <div className="footer-socials" style={{ gap: '1.5rem', paddingTop: '0.2rem', flexDirection: 'row' }}>
              <a href="https://facebook.com/copercana" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://instagram.com/copercana" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-info-item">
              <MapPin size={24} />
              <div>
                <strong>Localização:</strong>
                Rua Dr. Pio Dufles, 510<br />
                Sertãozinho/SP
              </div>
            </div>
            <div className="footer-info-item" style={{ marginTop: '1rem' }}>
              <Phone size={24} />
              <div>
                <strong>Contato Matriz:</strong>
                +55 16 3946 3300
              </div>
            </div>
            <div className="footer-info-item" style={{ marginTop: '1rem' }}>
              <Scale size={32} />
              <div>
                <strong>Canal de Ética</strong>
                <a href="#" style={{ color: '#fff' }}>Clique aqui</a> ou ligue<br />
                Telefone 0800 517 1238.
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            {new Date().getFullYear()} Copercana Todos os direitos reservados.
          </div>
          <div>
            <a href="#">Política de Privacidade</a> |
            <a href="#">Política de Cookies</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Ouvidoria;
