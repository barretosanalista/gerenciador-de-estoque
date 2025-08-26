// Adicionando interatividade simples
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Simulando carregamento de dados com delay
    setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.transform = 'translateY(0)';
        });
    }, 100);
    
    // Adicionar funcionalidade à barra de pesquisa
    const searchInput = document.querySelector('.search-bar input');
    const tableRows = document.querySelectorAll('.products-table tbody tr');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        tableRows.forEach(row => {
            const productName = row.querySelector('td:first-child').textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Adicionar funcionalidade ao botão de novo produto
    const newProductBtn = document.querySelector('.btn');
    
    newProductBtn.addEventListener('click', function() {
        alert('Funcionalidade de adicionar novo produto será implementada aqui!');
        // Em uma aplicação real, isso abriria um modal ou formulário
    });
    
    // Adicionar funcionalidade aos botões de ação
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i').classList;
            const productName = this.closest('tr').querySelector('td:first-child').textContent;
            
            if (icon.contains('fa-edit')) {
                alert(`Editando produto: ${productName}`);
                // Em uma aplicação real, isso abriria um modal de edição
            } else if (icon.contains('fa-trash')) {
                if (confirm(`Tem certeza que deseja excluir ${productName}?`)) {
                    alert(`Produto ${productName} excluído com sucesso!`);
                    // Em uma aplicação real, isso removeria o produto do banco de dados
                }
            }
        });
    });
});