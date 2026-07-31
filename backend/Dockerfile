FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install --production

# Copiar o restante do código
COPY . .

# Expor a porta que a API utiliza
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "server.js"]
