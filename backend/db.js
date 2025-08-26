const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Configuração do banco de dados
const dbPath = path.join(__dirname, 'estoque.db'); //na nuvem aqui deve ficar const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'estoque.db');
const db = new sqlite3.Database(dbPath);

// Inicializar tabelas
function initDatabase() {
    return new Promise((resolve, reject) => {
        // Tabela de usuários
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) reject(err);
        });

        // Tabela de sabores
        db.run(`CREATE TABLE IF NOT EXISTS sabores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) reject(err);
        });

        // Tabela de estoque
        db.run(`CREATE TABLE IF NOT EXISTS estoque (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sabor_id INTEGER NOT NULL,
            peso TEXT NOT NULL CHECK(peso IN ('0.5', '1')),
            quantidade INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sabor_id) REFERENCES sabores (id),
            UNIQUE(sabor_id, peso)
        )`, (err) => {
            if (err) reject(err);
        });

        // Tabela de histórico
        db.run(`CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sabor_id INTEGER NOT NULL,
            peso TEXT NOT NULL,
            usuario_id INTEGER NOT NULL,
            acao TEXT NOT NULL,
            quantidade_anterior INTEGER,
            quantidade_nova INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sabor_id) REFERENCES sabores (id),
            FOREIGN KEY (usuario_id) REFERENCES users (id)
        )`, async (err) => {
            if (err) {
                reject(err);
                return;
            }

            // Inserir dados iniciais
            try {
                await insertInitialData();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Inserir dados iniciais
async function insertInitialData() {
    return new Promise(async (resolve, reject) => {
        // Inserir usuários
        const users = [
            { username: "Eder", password: await bcrypt.hash("zabhyde3", 10), name: "Administrador" },
            { username: "Thyago", password: await bcrypt.hash("zabhyde3", 10), name: "Administrador" }
        ];

        users.forEach(user => {
            db.run(`INSERT OR IGNORE INTO users (username, password, name) VALUES (?, ?, ?)`,
                [user.username, user.password, user.name]);
        });

        // Inserir sabores
        const sabores = [
            "Abacaxi", "Abacaxi com Hortelã", "Acerola", "Acerola c/ Laranja",
            "Açaí", "Amora", "Cajú", "Cupuaçú", "Goiaba", "Graviola",
            "Mamão", "Mamão c/ Laranja", "Manga", "Maracujá", "Morango", "Uva"
        ];

        sabores.forEach(async (sabor) => {
            db.run(`INSERT OR IGNORE INTO sabores (nome) VALUES (?)`, [sabor], function(err) {
                if (err) {
                    console.error("Erro ao inserir sabor:", err);
                    return;
                }
                
                // Inserir estoque inicial para cada sabor
                const saborId = this.lastID;
                if (saborId) {
                    db.run(`INSERT OR IGNORE INTO estoque (sabor_id, peso, quantidade) VALUES (?, '0.5', ?)`,
                        [saborId, Math.floor(Math.random() * 100)]);
                    db.run(`INSERT OR IGNORE INTO estoque (sabor_id, peso, quantidade) VALUES (?, '1', ?)`,
                        [saborId, Math.floor(Math.random() * 100)]);
                }
            });
        });

        resolve();
    });
}

// Funções do banco de dados
const database = {
    // Usuários
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Sabores
    getAllSabores: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM sabores ORDER BY nome", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Estoque
    getEstoque: () => {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT s.nome as sabor, e.peso, e.quantidade, e.updated_at
                FROM estoque e
                JOIN sabores s ON e.sabor_id = s.id
                ORDER BY s.nome, e.peso
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    updateEstoque: (sabor, peso, novaQuantidade, usuarioId) => {
        return new Promise((resolve, reject) => {
            db.run(`
                UPDATE estoque 
                SET quantidade = ?, updated_at = CURRENT_TIMESTAMP
                WHERE sabor_id = (SELECT id FROM sabores WHERE nome = ?) AND peso = ?
            `, [novaQuantidade, sabor, peso], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                // Registrar no histórico
                if (this.changes > 0) {
                    db.run(`
                        INSERT INTO historico (sabor_id, peso, usuario_id, acao, quantidade_nova)
                        VALUES (
                            (SELECT id FROM sabores WHERE nome = ?), 
                            ?, 
                            ?, 
                            'UPDATE', 
                            ?
                        )
                    `, [sabor, peso, usuarioId, novaQuantidade]);
                }

                resolve(this.changes);
            });
        });
    },

    // Histórico
    getHistorico: (limit = 50) => {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT h.*, s.nome as sabor, u.name as usuario
                FROM historico h
                JOIN sabores s ON h.sabor_id = s.id
                JOIN users u ON h.usuario_id = u.id
                ORDER BY h.timestamp DESC
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = { db, initDatabase, database };