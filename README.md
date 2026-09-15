

# Plataforma de Satisfação & Ouvidoria

Aplicação full stack para coleta de pesquisas de satisfação, gestão de manifestações de ouvidoria e acompanhamento administrativo.

O projeto utiliza **React + Vite** no frontend e **Node.js + Express + SQLite** no backend, com suporte a **Docker, Docker Compose e Nginx**.

## Funcionalidades

- Pesquisa de satisfação
- Formulário de ouvidoria
- Dashboard administrativo
- Gestão de respostas
- Gestão de manifestações
- Histórico por cliente
- Controle de status e tratativas
- Gestão de usuários
- Configurações do sistema
- Gráficos e indicadores
- Geração de relatórios em PDF
- Processamento de planilhas
- Integração para envio de e-mails

## Arquitetura

```text
React + Vite
     |
   REST API
     |
Node.js + Express
     |
   SQLite

O repositório também possui estrutura para execução em containers:

Nginx / Frontend
       |
       v
    Backend
       |
       v
Persistent SQLite data
Frontend

Principais tecnologias:

React 19
React Router
Vite
Recharts
jsPDF
jsPDF AutoTable
html2canvas
XLSX
Lucide React

A aplicação possui páginas públicas de Pesquisa de Satisfação e Ouvidoria, além de uma área administrativa com Dashboard, Respostas, Painel de Ouvidoria, Histórico de Clientes, Configurações e Usuários.

Backend

Principais tecnologias:

Node.js
Express 5
SQLite
JSON Web Token
bcryptjs
Nodemailer
express-rate-limit
dotenv
CORS

O backend centraliza autenticação, usuários, pesquisas, ouvidoria, configurações da aplicação e persistência dos dados.

Docker

Arquivos principais de infraestrutura:

Dockerfile
backend/Dockerfile
docker-compose.yml
nginx.conf

Para iniciar a aplicação com Docker:

docker compose up -d --build
Desenvolvimento local
Frontend
npm install
npm run dev
Backend
cd backend
npm install
node server.js
Estrutura do projeto
.
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── public/
├── src/
│   ├── assets/
│   ├── contexts/
│   ├── layouts/
│   └── pages/
│       └── admin/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
Valor técnico do projeto

Este projeto demonstra experiência prática com:

Desenvolvimento full stack
React
Node.js e Express
APIs REST
SQLite
Dashboards e visualização de dados
Geração de relatórios
Integração de e-mail
Docker e Docker Compose
Nginx
Fluxos administrativos e de atendimento
Status

Projeto ativo e em evolução.

Autor

Roger Schneider
Software Developer | AI Solutions

LinkedIn · GitHub Profile



