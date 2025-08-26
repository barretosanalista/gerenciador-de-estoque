const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { initDatabase, database } = require('./db');

const app = express();
const PORT = process.env.PORT || 5500; //porta da nuvem ou local

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend funcionando' });
});

// Inicializar banco de dados
initDatabase().then(() => {
    console.log('Banco de dados inicializado com sucesso');
}).catch(err => {
    console.error('Erro ao inicializar banco de dados:', err);
});

// Rotas da API

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await database.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        res.json({
            id: user.id,
            username: user.username,
            name: user.name
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Obter todos os sabores com estoque
app.get('/api/estoque', async (req, res) => {
    try {
        const estoque = await database.getEstoque();
        res.json(estoque);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
});

// Atualizar estoque
app.post('/api/estoque/atualizar', async (req, res) => {
    try {
        const { sabor, peso, valor, usuarioId } = req.body;
        
        // Primeiro busca a quantidade atual
        const estoqueData = await database.getEstoque();
        const item = estoqueData.find(item => item.sabor === sabor && item.peso === peso);
        
        if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        const novaQuantidade = item.quantidade + valor;
        if (novaQuantidade < 0) {
            return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
        }

        await database.updateEstoque(sabor, peso, novaQuantidade, usuarioId);
        res.json({ success: true, novaQuantidade });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar estoque' });
    }
});

// Obter histórico
app.get('/api/historico', async (req, res) => {
    try {
        const historico = await database.getHistorico();
        res.json(historico);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// Obter todos os sabores
app.get('/api/sabores', async (req, res) => {
    try {
        const sabores = await database.getAllSabores();
        res.json(sabores);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar sabores' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Acesse: http://localhost:${PORT}`);
});