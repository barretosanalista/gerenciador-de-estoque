// Dados dos usuários
const users = {
    "Eder": { password: "zabhyde3", name: "Administrador" },
    "Thyago": { password: "zabhyde3", name: "Administrador" }
};

// Dados dos sabores
const sabores = [
    "Abacaxi", 
    "Abacaxi com Hortelã", 
    "Acerola", 
    "Acerola c/ Laranja", 
    "Açaí", 
    "Amora", 
    "Cajú", 
    "Cupuaçú", 
    "Goiaba", 
    "Graviola", 
    "Mamão", 
    "Mamão c/ Laranja", 
    "Manga", 
    "Maracujá", 
    "Morango", 
    "Uva"
];

// Inicializar estoque
let estoque = {};
let currentUser = null;
let historicoAlteracoes = {};

sabores.forEach(sabor => {
    estoque[sabor] = {
        "0.5": Math.floor(Math.random() * 100),
        "1": Math.floor(Math.random() * 100)
    };
    
    historicoAlteracoes[sabor] = {
        "0.5": { usuario: "Sistema", timestamp: new Date().toLocaleString() },
        "1": { usuario: "Sistema", timestamp: new Date().toLocaleString() }
    };
});

// Função de login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (users[username] && users[username].password === password) {
        currentUser = users[username];
        document.getElementById('currentUser').textContent = currentUser.name;
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        renderSabores();
        showNotification('Login realizado com sucesso!');
    } else {
        alert('Usuário ou senha incorretos!');
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
                        Alterado por: ${historicoAlteracoes[sabor]["0.5"].usuario} - ${historicoAlteracoes[sabor]["0.5"].timestamp}
                    </span>
                </div>
                <div class="estoque-info">
                    <div class="peso-item peso-0_5">
                        <div class="peso-label">0.5kg</div>
                        <div class="peso-valor valor-0_5">${estoque[sabor]["0.5"]}</div>
                        <div class="controles">
                            <button class="btn btn-diminuir" onclick="alterarEstoque('${sabor}', '0.5', -1)">-</button>
                            <span class="quantidade">${estoque[sabor]["0.5"]}</span>
                            <button class="btn btn-aumentar" onclick="alterarEstoque('${sabor}', '0.5', 1)">+</button>
                        </div>
                    </div>
                    <div class="peso-item peso-1">
                        <div class="peso-label">1kg</div>
                        <div class="peso-valor valor-1">${estoque[sabor]["1"]}</div>
                        <div class="controles">
                            <button class="btn btn-diminuir" onclick="alterarEstoque('${sabor}', '1', -1)">-</button>
                            <span class="quantidade">${estoque[sabor]["1"]}</span>
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
function alterarEstoque(sabor, peso, valor) {
    if (!currentUser) {
        showNotification('Faça login para alterar o estoque!');
        return;
    }
    
    const novoValor = estoque[sabor][peso] + valor;
    if (novoValor >= 0) {
        estoque[sabor][peso] = novoValor;
        
        // Registrar quem fez a alteração
        historicoAlteracoes[sabor][peso] = {
            usuario: currentUser.name,
            timestamp: new Date().toLocaleString()
        };
        
        renderSabores();
        
        // Mostrar notificação de alteração
        const acao = valor > 0 ? "adicionou" : "removeu";
        showNotification(`${currentUser.name} ${acao} ${Math.abs(valor)} unidade(s) de ${sabor} (${peso}kg)`);
    }
}

// Atualizar totais gerais
function atualizarTotais() {
    let total05 = 0;
    let total1 = 0;
    
    sabores.forEach(sabor => {
        total05 += estoque[sabor]["0.5"];
        total1 += estoque[sabor]["1"];
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