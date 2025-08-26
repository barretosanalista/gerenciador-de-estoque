// Variáveis globais
const API_BASE_URL = 'http://localhost:5500'; //aqui eu coloco a url do servidor 'window.location.origin'
let currentUser = null;
let sabores = [];
let estoque = {};
let historicoAlteracoes = {};

// Função de login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            document.getElementById('currentUser').textContent = currentUser.name;
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            // Carregar dados iniciais
            await carregarDados();
            showNotification('Login realizado com sucesso!');
        } else {
            const error = await response.json();
            alert(error.error || 'Erro no login');
        }
    } catch (error) {
        alert('Erro de conexão com o servidor');
    }
}

// Carregar dados iniciais
async function carregarDados() {
    try {
        // Carregar sabores
        const saboresResponse = await fetch(`${API_BASE_URL}/api/sabores`);
        const saboresData = await saboresResponse.json();
        sabores = saboresData.map(sabor => sabor.nome);
        
        // Carregar estoque
        const estoqueResponse = await fetch(`${API_BASE_URL}/api/estoque`);
        const estoqueData = await estoqueResponse.json();
        
        // Formatando estoque
        estoque = {};
        historicoAlteracoes = {};
        
        estoqueData.forEach(item => {
            if (!estoque[item.sabor]) {
                estoque[item.sabor] = {};
                historicoAlteracoes[item.sabor] = {};
            }
            estoque[item.sabor][item.peso] = item.quantidade;
            historicoAlteracoes[item.sabor][item.peso] = {
                usuario: "Sistema",
                timestamp: new Date(item.updated_at).toLocaleString() || new Date().toLocaleString()
            };
        });
        
        renderSabores();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados do servidor');
    }
}

// Função de logout
function logout() {
    currentUser = null;
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

// Mostrar notificação
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Renderizar a lista de sabores
function renderSabores() {
    const saboresLista = document.getElementById('saboresLista');
    saboresLista.innerHTML = '';
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    sabores.forEach(sabor => {
        if (sabor.toLowerCase().includes(searchTerm)) {
            const saborItem = document.createElement('div');
            saborItem.className = 'sabor-item';
            
            saborItem.innerHTML = `
                <div class="sabor-nome">
                    <span>${sabor}</span>
                    <span class="last-update" id="last-update-${sabor}">
                        Alterado por: ${historicoAlteracoes[sabor]?.["0.5"]?.usuario || "Sistema"} - ${historicoAlteracoes[sabor]?.["0.5"]?.timestamp || new Date().toLocaleString()}
                    </span>
                </div>
                <div class="estoque-info">
                    <div class="peso-item peso-0_5">
                        <div class="peso-label">0.5kg</div>
                        <div class="peso-valor valor-0_5">${estoque[sabor]?.["0.5"] || 0}</div>
                        <div class="controles">
                            <button class="btn btn-diminuir" onclick="alterarEstoque('${sabor}', '0.5', -1)">-</button>
                            <span class="quantidade">${estoque[sabor]?.["0.5"] || 0}</span>
                            <button class="btn btn-aumentar" onclick="alterarEstoque('${sabor}', '0.5', 1)">+</button>
                        </div>
                    </div>
                    <div class="peso-item peso-1">
                        <div class="peso-label">1kg</div>
                        <div class="peso-valor valor-1">${estoque[sabor]?.["1"] || 0}</div>
                        <div class="controles">
                            <button class="btn btn-diminuir" onclick="alterarEstoque('${sabor}', '1', -1)">-</button>
                            <span class="quantidade">${estoque[sabor]?.["1"] || 0}</span>
                            <button class="btn btn-aumentar" onclick="alterarEstoque('${sabor}', '1', 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
            
            saboresLista.appendChild(saborItem);
        }
    });
    
    atualizarTotais();
}

// Alterar quantidade em estoque
async function alterarEstoque(sabor, peso, valor) {
    if (!currentUser) {
        showNotification('Faça login para alterar o estoque!');
        return;
    }
    
    const novoValor = (estoque[sabor]?.[peso] || 0) + valor;
    if (novoValor >= 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/estoque/atualizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sabor,
                    peso,
                    valor,
                    usuarioId: currentUser.id
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Atualizar localmente
                if (!estoque[sabor]) estoque[sabor] = {};
                estoque[sabor][peso] = result.novaQuantidade;
                
                // Atualizar histórico
                if (!historicoAlteracoes[sabor]) historicoAlteracoes[sabor] = {};
                historicoAlteracoes[sabor][peso] = {
                    usuario: currentUser.name,
                    timestamp: new Date().toLocaleString()
                };
                
                renderSabores();
                
                const acao = valor > 0 ? "adicionou" : "removeu";
                showNotification(`${currentUser.name} ${acao} ${Math.abs(valor)} unidade(s) de ${sabor} (${peso}kg)`);
            } else {
                const error = await response.json();
                showNotification('Erro: ' + error.error);
            }
        } catch (error) {
            showNotification('Erro de conexão com o servidor');
        }
    }
}

// Atualizar totais gerais
function atualizarTotais() {
    let total05 = 0;
    let total1 = 0;
    
    sabores.forEach(sabor => {
        total05 += estoque[sabor]?.["0.5"] || 0;
        total1 += estoque[sabor]?.["1"] || 0;
    });
    
    document.getElementById('total-0_5').textContent = total05;
    document.getElementById('total-1').textContent = total1;
}

// Adicionar funcionalidade de busca
document.getElementById('searchInput').addEventListener('input', function() {
    renderSabores();
});

// Permitir login com Enter
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

// Carregar dados quando a página carregar (se já estiver logado)
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        carregarDados();
    }
});