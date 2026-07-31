import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, MapPin, Phone, Scale, Menu, X as CloseIcon } from 'lucide-react';
import logoHorizontal from '../assets/logos/Copercana_Horizontal-bco.png';
import logoVertical from '../assets/logos/Copercana_logo-bco.png';
import '../App.css';

function Survey() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerMobilePreview, setBannerMobilePreview] = useState(null);
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerTitle, setBannerTitle] = useState('Pesquisa de Satisfação');
  const [surveyDescription, setSurveyDescription] = useState('Queremos ouvir você! Por favor, dedique alguns minutos para avaliar nosso atendimento e serviços. Sua opinião nos ajuda a crescer e oferecer o melhor.');
  const [services, setServices] = useState([]);

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
        setBannerTitle(data.bannerTitle || 'Pesquisa de Satisfação');
        setSurveyDescription(data.surveyDescription || 'Queremos ouvir você! Por favor, dedique alguns minutos para avaliar nosso atendimento e serviços. Sua opinião nos ajuda a crescer e oferecer o melhor.');
        setBannerPreview(data.bannerPreview || null);
        setBannerMobilePreview(data.bannerMobilePreview || null);
        setServices(data.services ? JSON.parse(data.services) : defaultServices);
        setSettings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching settings:", err);
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

  const defaultServices = [
    { id: 1, name: 'Postos', email: 'postos@copercana.com.br' },
    { id: 2, name: 'Lojas', email: 'lojas@copercana.com.br' },
    { id: 3, name: 'Supermercados', email: 'supermercados@copercana.com.br' },
    { id: 4, name: 'Unidade de Grão', email: 'grao@copercana.com.br' },
    { id: 5, name: 'Distribuidora', email: 'distribuidora@copercana.com.br' },
    { id: 6, name: 'CoperMais', email: 'copermais@copercana.com.br' },
    { id: 7, name: 'Outros', email: 'diretoria@copercana.com.br' }
  ];

  const initialFormData = {
    nome: '',
    contato: '',
    cidade: '',
    servico: '',
    satisfacao: null,
    recomendacao: null,
    precos: '',
    promocoes: '',
    produtos: '',
    primeiraVez: '',
    motivacao: '',
    sugestao: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const [submitted, setSubmitted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRating = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL != null ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Erro ao enviar a pesquisa. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro de conexão ao tentar enviar a pesquisa.");
    }
  };

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="success-message">
          <CheckCircle className="success-icon" size={64} />
          <h2>Obrigado pelo seu feedback!</h2>
          <p className="description">A sua opinião é muito importante para continuarmos melhorando os serviços da Copercana.</p>
          <button className="btn-submit" style={{ marginTop: '2rem' }} onClick={() => setSubmitted(false)}>
            Enviar nova avaliação
          </button>
        </div>
      </div>
    );
  }

  const scrollToFooter = () => {
    const footer = document.querySelector('.footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

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
          
          .nps-scale {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }
          .nps-btn {
            flex: 1;
            min-width: 40px;
            height: 45px;
            background-color: #f4f4f4;
            border: 1px solid #dee2e6;
            border-radius: var(--radius-md);
            font-weight: 600;
            color: #5C5B60;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nps-btn:hover {
            background-color: #e2e8f0;
          }
          .nps-btn.active {
            background-color: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
            box-shadow: inset 0 0 0 2px rgba(255,255,255,0.2);
          }
          
          .radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-top: 0.5rem;
          }
          .radio-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-weight: 400;
            color: var(--color-text-dark);
          }
          .radio-label input[type="radio"] {
            width: 1.2rem;
            height: 1.2rem;
            accent-color: var(--color-primary);
            cursor: pointer;
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
          <h1><strong>{bannerTitle}</strong></h1>
          <p className="description">
            {surveyDescription}
          </p>
        </div>

        <form className="survey-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nome">Nome Completo</label>
              <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome" required />
            </div>
            <div className="form-group">
              <label htmlFor="contato">Telefone / WhatsApp</label>
              <input type="tel" id="contato" name="contato" value={formData.contato} onChange={handleChange} placeholder="(00) 00000-0000" required />
            </div>
            <div className="form-group">
              <label htmlFor="cidade">Cidade</label>
              <input type="text" id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Sua cidade" required />
            </div>
            <div className="form-group">
              <label htmlFor="servico">Loja/Serviço Referente</label>
              <select id="servico" name="servico" value={formData.servico} onChange={handleChange} required>
                <option value="" disabled>Selecione um serviço...</option>
                {/* 
                    Filtro de Lojas/Serviços Públicos:
                    Garante que apenas opções voltadas a Pesquisas de Satisfação (ou aplicáveis a ambos) 
                    apareçam no dropdown de seleção do cliente, ocultando canais exclusivos de Ouvidoria.
                */}
                {services.filter(s => !s.type || s.type === 'ambos' || s.type === 'satisfacao').map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
              <h2>Sua Experiência</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Avalie os pontos abaixo para entendermos melhor a sua experiência com a Copercana.</p>
            </div>

            <div className="form-group full-width">
              <label>De 0 a 10, qual seu nível de satisfação com a Copercana?</label>
              <div className="nps-scale">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    type="button"
                    key={num}
                    className={`nps-btn ${formData.satisfacao === num ? 'active' : ''}`}
                    onClick={() => handleRating('satisfacao', num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group full-width">
              <label>De 0 a 10, quanto você recomendaria a Copercana para outras pessoas?</label>
              <div className="nps-scale">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    type="button"
                    key={num}
                    className={`nps-btn ${formData.recomendacao === num ? 'active' : ''}`}
                    onClick={() => handleRating('recomendacao', num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="precos">Como avalia nossos preços?</label>
              <select id="precos" name="precos" value={formData.precos} onChange={handleChange} required>
                <option value="" disabled>Selecione uma opção</option>
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
                <option value="Péssimo">Péssimo</option>
              </select>
            </div>

            <div className="form-group">
              <label>As promoções são atrativas para você?</label>
              <div className="radio-group">
                {['Sim', 'Não', 'Às vezes'].map(opt => (
                  <label key={opt} className="radio-label">
                    <input type="radio" name="promocoes" value={opt} checked={formData.promocoes === opt} onChange={handleChange} required />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Encontrou os produtos que procurava?</label>
              <div className="radio-group">
                {['Sim', 'Não', 'Parcialmente'].map(opt => (
                  <label key={opt} className="radio-label">
                    <input type="radio" name="produtos" value={opt} checked={formData.produtos === opt} onChange={handleChange} required />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Foi sua primeira vez na Copercana?</label>
              <div className="radio-group">
                {['Sim', 'Não'].map(opt => (
                  <label key={opt} className="radio-label">
                    <input type="radio" name="primeiraVez" value={opt} checked={formData.primeiraVez === opt} onChange={handleChange} required />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '1rem' }}>
              <label htmlFor="motivacao">O que o motivou para procurar a Copercana?</label>
              <textarea
                id="motivacao"
                name="motivacao"
                value={formData.motivacao}
                onChange={handleChange}
                maxLength={500}
                placeholder="Ex: Preço bom, recomendação de um amigo, vi uma propaganda..."
                style={{ minHeight: '80px' }}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="sugestao">Qual sua sugestão de melhoria?</label>
              <textarea
                id="sugestao"
                name="sugestao"
                value={formData.sugestao}
                onChange={handleChange}
                maxLength={2000}
                placeholder="O que podemos fazer para tornar sua próxima experiência ainda melhor?"
                style={{ minHeight: '120px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit">
            Enviar Avaliação <Send size={20} />
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

export default Survey;
