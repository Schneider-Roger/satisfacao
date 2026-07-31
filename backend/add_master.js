const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function addMaster() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('R@g55028', salt);
  
  db.run(`INSERT INTO users (name, email, password, role) VALUES ('Roger Santos', 'rogersantos@copercana.com.br', ?, 'admin')`, [hash], function(err) {
    if (err) {
      console.error('Erro ao inserir:', err.message);
    } else {
      console.log('Usuário master inserido com sucesso, ID:', this.lastID);
    }
    db.close();
  });
}

addMaster();
