// Configuração de Variáveis de Ambiente
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Chave secreta usada para assinar e validar tokens JWT.
// ATENÇÃO: Em produção, defina sempre uma chave forte no arquivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-1234';

// Configuração do Middleware de CORS
// Permite que o frontend (Vite) se comunique com este servidor backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middlewares para parsing do corpo das requisições (JSON e URL Encoded)
// Limite estendido para 2mb para suportar uploads de imagens em base64 nas configurações do banner
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/**
 * Middleware para Autenticação JWT genérica.
 * Verifica se a requisição possui o cabeçalho 'Authorization' com um token válido.
 * Anexa os dados decodificados do usuário em `req.user` para uso nas rotas.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * Middleware para Autenticação de Administrador.
 * Deve ser colocado após o authMiddleware.
 * Garante que apenas usuários com papel 'admin' acessem rotas críticas.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
};

// Inicialização e Estruturação do Banco de Dados SQLite
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Roda comandos sequencialmente para evitar conflitos de sincronia
    db.serialize(() => {
      // Criação da tabela de Pesquisas de Satisfação (NPS)
      db.run(`CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        contato TEXT,
        cidade TEXT,
        servico TEXT,
        satisfacao INTEGER, -- Nota de satisfação (0-10)
        recomendacao INTEGER, -- Nota de recomendação (0-10)
        precos TEXT,
        promocoes TEXT,
        produtos TEXT,
        primeiraVez TEXT,
        motivacao TEXT,
        sugestao TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, () => {
        // Scripts de Migração/Ajuste estrutural caso colunas antigas estejam faltando
        db.run("ALTER TABLE surveys ADD COLUMN tratativa TEXT", () => {});
        db.run("ALTER TABLE surveys ADD COLUMN status TEXT DEFAULT 'Pendente'", () => {});
      });

      // Criação da tabela da Ouvidoria
      db.run(`CREATE TABLE IF NOT EXISTS ouvidoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        contato TEXT,
        cidade TEXT,
        servico TEXT,
        assunto TEXT,
        mensagem TEXT,
        tratativa TEXT,
        status TEXT DEFAULT 'Pendente',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, () => {});

      // Criação da tabela de Configurações Gerais do Site
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1), -- Garante registro único de ID = 1
        mainEmail TEXT,
        bannerTitle TEXT,
        bannerPreview TEXT,
        bannerMobilePreview TEXT
      )`, () => {
        // Adiciona colunas extras se não existirem em migrações anteriores
        db.serialize(() => {
          db.run("ALTER TABLE settings ADD COLUMN banners TEXT", () => {});
          db.run("ALTER TABLE settings ADD COLUMN surveyDescription TEXT", () => {});
          db.run("ALTER TABLE settings ADD COLUMN ouvidoriaTitle TEXT", () => {});
          db.run("ALTER TABLE settings ADD COLUMN ouvidoriaDescription TEXT", () => {});
          db.run("ALTER TABLE settings ADD COLUMN services TEXT", () => {});
        });
      });

      // Serviços padrão configurados caso a tabela settings esteja vazia
      const defaultServices = JSON.stringify([
        { id: 1, name: 'Postos', email: 'postos@copercana.com.br', type: 'ambos' },
        { id: 2, name: 'Lojas', email: 'lojas@copercana.com.br', type: 'ambos' },
        { id: 3, name: 'Supermercados', email: 'supermercados@copercana.com.br', type: 'ambos' },
        { id: 4, name: 'Unidade de Grão', email: 'grao@copercana.com.br', type: 'ambos' },
        { id: 5, name: 'Distribuidora', email: 'distribuidora@copercana.com.br', type: 'ambos' },
        { id: 6, name: 'CoperMais', email: 'copermais@copercana.com.br', type: 'ouvidoria' },
        { id: 7, name: 'Outros', email: 'diretoria@copercana.com.br', type: 'ambos' }
      ]);
      
      // Cria a configuração inicial se for a primeira inicialização do sistema
      db.get("SELECT id FROM settings WHERE id = 1", [], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO settings (id, mainEmail, bannerTitle, services) VALUES (1, 'diretoria@copercana.com.br', 'Pesquisa de Satisfação', ?)`, [defaultServices]);
        }
      });

      // Criação da tabela de Usuários e conta master padrão
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, async (err) => {
        if (!err) {
          // Cria usuário administrador padrão caso a tabela esteja vazia
          db.get("SELECT id FROM users WHERE email = 'marketing@copercana.com.br'", [], async (err, row) => {
            if (!row) {
              const salt = await bcrypt.genSalt(10);
              const hash = await bcrypt.hash('Coper@2026', salt);
              db.run(`INSERT INTO users (name, email, password, role) VALUES ('Administrador', 'marketing@copercana.com.br', ?, 'admin')`, [hash]);
            }
          });
        }
      });
    });
  }
});

// Configuração do Transportador de E-mails (Nodemailer)
let transporter;
async function setupMailer() {
  // Se houver configurações de SMTP no .env, usa o servidor de produção
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Using Production SMTP server');
  } else {
    // Caso contrário, configura uma conta de testes no Ethereal Email (ideal para dev)
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('Using Ethereal (Test) SMTP server');
  }
}
setupMailer();

// Rate Limiters para proteção do servidor contra ataques de força bruta ou SPAM
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 5, // Limita a 5 tentativas de login por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 10, // Limita a 10 envios de pesquisas/ouvidorias por IP a cada 15 min
  message: { error: 'Muitas requisições enviadas deste IP. Tente novamente mais tarde.' }
});

// Auth Routes
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// Users Routes
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  db.all("SELECT id, name, email, role, createdAt FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
  }

  // Force valid role
  const safeRole = (role === 'admin') ? 'admin' : 'user';

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, [name, email, hash, safeRole], function(err) {
    if (err) return res.status(400).json({ error: 'Email já cadastrado ou erro no banco' });
    res.json({ message: 'Usuário criado', id: this.lastID });
  });
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  if (req.user.id.toString() === req.params.id) {
    return res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
  }

  if (req.params.id === '1') {
    return res.status(403).json({ error: 'A conta principal não pode ser excluída' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Usuário removido' });
  });
});

app.put('/api/users/:id/password', authMiddleware, adminMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
  
  if (req.params.id === '1' && req.user.id !== 1 && req.user.id !== '1') {
    return res.status(403).json({ error: 'Somente a própria conta principal pode alterar sua senha' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Senha atualizada com sucesso' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar nova senha' });
  }
});

app.get('/api/settings', (req, res) => {
  db.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/settings', authMiddleware, adminMiddleware, (req, res) => {
  const { mainEmail, bannerTitle, bannerPreview, bannerMobilePreview, services, banners, surveyDescription, ouvidoriaTitle, ouvidoriaDescription } = req.body;
  
  const updateSettings = () => {
    db.run(
      `UPDATE settings SET mainEmail = ?, bannerTitle = ?, bannerPreview = ?, bannerMobilePreview = ?, services = ?, banners = ?, surveyDescription = ?, ouvidoriaTitle = ?, ouvidoriaDescription = ? WHERE id = 1`,
      [mainEmail, bannerTitle, bannerPreview, bannerMobilePreview, JSON.stringify(services), JSON.stringify(banners || []), surveyDescription, ouvidoriaTitle, ouvidoriaDescription],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Settings updated successfully" });
      }
    );
  };

  db.run(
    `UPDATE settings SET mainEmail = ?, bannerTitle = ?, bannerPreview = ?, bannerMobilePreview = ?, services = ?, banners = ?, surveyDescription = ?, ouvidoriaTitle = ?, ouvidoriaDescription = ? WHERE id = 1`,
    [mainEmail, bannerTitle, bannerPreview, bannerMobilePreview, JSON.stringify(services), JSON.stringify(banners || []), surveyDescription, ouvidoriaTitle, ouvidoriaDescription],
    function(err) {
      if (err) {
         if (err.message.includes('no such column')) {
             // If column didn't exist yet for some reason
             db.serialize(() => {
                 db.run("ALTER TABLE settings ADD COLUMN banners TEXT", () => {});
                 db.run("ALTER TABLE settings ADD COLUMN surveyDescription TEXT", () => {});
                 db.run("ALTER TABLE settings ADD COLUMN ouvidoriaTitle TEXT", () => {});
                 db.run("ALTER TABLE settings ADD COLUMN ouvidoriaDescription TEXT", () => {
                     updateSettings();
                 });
             });
         } else {
             return res.status(500).json({ error: err.message });
         }
      } else {
         res.json({ message: "Settings updated successfully" });
      }
    }
  );
});

app.post('/api/survey', publicApiLimiter, async (req, res) => {
  const { nome, contato, cidade, servico, satisfacao, recomendacao, precos, promocoes, produtos, primeiraVez, motivacao, sugestao } = req.body;
  db.run(
    `INSERT INTO surveys (nome, contato, cidade, servico, satisfacao, recomendacao, precos, promocoes, produtos, primeiraVez, motivacao, sugestao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, contato, cidade, servico, satisfacao, recomendacao, precos, promocoes, produtos, primeiraVez, motivacao, sugestao],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const surveyId = this.lastID;
      try {
        db.get("SELECT mainEmail, services FROM settings WHERE id = 1", [], async (err, settings) => {
          if (err || !settings) return;
          let servicesList = [];
          try {
            servicesList = JSON.parse(settings.services || '[]');
          } catch (e) {
            console.error("Erro ao fazer parse dos serviços:", e);
          }
          const selectedService = servicesList.find(s => s.name === servico);
          const serviceEmail = selectedService ? selectedService.email : null;
          const mainEmail = settings.mainEmail || 'diretoria@copercana.com.br';
          
          // E-mail de destino (responsável pelo setor) e cópia (e-mail global do administrador/auditoria)
          const destEmail = serviceEmail || mainEmail;
          const ccEmail = (serviceEmail && serviceEmail !== mainEmail) ? mainEmail : undefined;

          const emailContent = `
            <h2>Nova Avaliação Recebida!</h2>
            <p><strong>Serviço:</strong> ${servico}</p>
            <p><strong>Cliente:</strong> ${nome} (${cidade}) - ${contato}</p>
            <hr/>
            <p><strong>Satisfação Geral:</strong> ${satisfacao}/10</p>
            <p><strong>Recomendaria?:</strong> ${recomendacao}/10</p>
            <p><strong>Preços:</strong> ${precos}</p>
            <p><strong>Promoções Atrativas:</strong> ${promocoes}</p>
            <p><strong>Encontrou o que procurava:</strong> ${produtos}</p>
            <p><strong>Primeira vez:</strong> ${primeiraVez}</p>
            <br/>
            <p><strong>Motivação:</strong> ${motivacao}</p>
            <p><strong>Sugestões:</strong> ${sugestao}</p>
          `;
          const emailOptions = {
            from: '"Copercana Pesquisas" <no-reply@copercana.com.br>',
            to: destEmail,
            cc: ccEmail,
            subject: `Nova Avaliação: ${servico} - Nota ${satisfacao}`,
            html: emailContent,
          };
          
          if (transporter) {
            try {
              let info = await transporter.sendMail(emailOptions);
              console.log("Email sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
            } catch (emailErr) {
              console.error("Erro ao disparar SMTP para pesquisa:", emailErr);
            }
          }
        });
      } catch (e) {
        console.error("Erro ao enviar email de notificação:", e);
      }
      res.json({ message: "Survey submitted successfully", id: surveyId });
    }
  );
});
// ==========================================
// OUVIDORIA
// ==========================================

app.post('/api/ouvidoria', publicApiLimiter, async (req, res) => {
  const { nome, contato, cidade, servico, assunto, mensagem } = req.body;
  db.run(
    `INSERT INTO ouvidoria (nome, contato, cidade, servico, assunto, mensagem) VALUES (?, ?, ?, ?, ?, ?)`,
    [nome, contato, cidade, servico, assunto, mensagem],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const ouvidoriaId = this.lastID;
      
      try {
        db.get("SELECT mainEmail, services FROM settings WHERE id = 1", [], async (err, settings) => {
          if (err || !settings) return;
          let servicesList = [];
          try {
            servicesList = JSON.parse(settings.services || '[]');
          } catch (e) {
            console.error("Erro ao fazer parse dos serviços:", e);
          }
          const selectedService = servicesList.find(s => s.name === servico);
          const serviceEmail = selectedService ? selectedService.email : null;
          const mainEmail = settings.mainEmail || 'diretoria@copercana.com.br';

          // E-mail de destino (responsável pelo setor) e cópia (e-mail global do administrador/auditoria)
          const destEmail = serviceEmail || mainEmail;
          const ccEmail = (serviceEmail && serviceEmail !== mainEmail) ? mainEmail : undefined;

          const emailContent = `
            <h2>Nova Mensagem na Ouvidoria!</h2>
            <p><strong>Assunto:</strong> ${assunto}</p>
            <p><strong>Serviço/Loja:</strong> ${servico}</p>
            <p><strong>Cliente:</strong> ${nome} (${cidade}) - ${contato}</p>
            <hr/>
            <p><strong>Mensagem:</strong><br/> ${mensagem.replace(/\\n/g, '<br/>')}</p>
          `;
          const emailOptions = {
            from: '"Copercana Ouvidoria" <no-reply@copercana.com.br>',
            to: destEmail,
            cc: ccEmail,
            subject: `Ouvidoria (${assunto}): ${servico}`,
            html: emailContent,
          };
          if (transporter) {
            try {
              let info = await transporter.sendMail(emailOptions);
              console.log("Email Ouvidoria sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
            } catch (emailErr) {
              console.error("Erro ao disparar SMTP para ouvidoria:", emailErr);
            }
          }
        });
      } catch (e) {
        console.error("Erro ao enviar email da ouvidoria:", e);
      }

      res.json({ message: "Ouvidoria submitted successfully", id: ouvidoriaId });
    }
  );
});

app.get('/api/ouvidoria', authMiddleware, (req, res) => {
  db.all("SELECT * FROM ouvidoria ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/ouvidoria/:id/tratativa', authMiddleware, adminMiddleware, (req, res) => {
  const { tratativaText } = req.body;
  db.run(`UPDATE ouvidoria SET tratativa = ?, status = 'Concluído' WHERE id = ?`, [tratativaText, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tratativa saved successfully', id: req.params.id });
  });
});

// ==========================================
// HISTORY / DOSSIÊ DO CLIENTE
// ==========================================

app.get('/api/history/:contato', authMiddleware, (req, res) => {
  const contato = req.params.contato;
  
  db.all("SELECT id, servico, satisfacao, createdAt, tratativa, status FROM surveys WHERE contato = ? ORDER BY createdAt DESC", [contato], (err1, surveys) => {
    if (err1) return res.status(500).json({ error: err1.message });
    
    db.all("SELECT id, servico, assunto, mensagem, createdAt, tratativa, status FROM ouvidoria WHERE contato = ? ORDER BY createdAt DESC", [contato], (err2, ouvidoria) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      res.json({ surveys, ouvidoria });
    });
  });
});

app.get('/api/surveys', authMiddleware, (req, res) => {
  db.all("SELECT * FROM surveys ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/surveys/:id/tratativa', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { tratativa } = req.body;
  db.run(`UPDATE surveys SET tratativa = ?, status = 'Concluído' WHERE id = ?`, [tratativa, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Tratativa saved successfully", id });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
