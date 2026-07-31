# Estágio 1: Build da aplicação React usando Vite
FROM node:18-alpine AS build

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o restante do código
COPY . .

# Construir a versão de produção (Gera os arquivos na pasta /dist)
RUN npm run build

# Estágio 2: Servir os arquivos usando Nginx
FROM nginx:alpine

# Copiar as configurações personalizadas do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos gerados no estágio de build para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expor a porta 80
EXPOSE 80

# Iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
