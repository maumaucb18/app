document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar banco de dados
    const database = new Database();
    
    try {
        await database.initializeDB();
        await database.loadInitialData();
        
        // Inicializar módulos
        const products = new Products(database);
        const cart = new Cart(database);
        const orders = new Orders(database);
        
        // Carregar dados iniciais
        await products.loadProducts();
        await orders.loadOrders();
        
        // Navegação por tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                UI.showScreen(target);
            });
        });
        
        // Botão editar produtos
        document.getElementById('editProductsBtn').addEventListener('click', () => {
            products.openEditModal();
        });
        
        // Botão histórico
        document.getElementById('historyBtn').addEventListener('click', () => {
            UI.showScreen('history');
        });
        // Botão de exclusão de produto
        document.getElementById('deleteProduct').addEventListener('click', () => {
            products.deleteCurrentProduct();
        });
        // Botão flutuante do carrinho
        document.getElementById('floatingCart').addEventListener('click', () => {
            UI.showScreen('cart');
        });
        
        // Finalizar pedido
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            cart.checkout();
        });
        
        // Modal de produto
        document.getElementById('closeModal').addEventListener('click', () => {
            UI.hideModal();
        });
        
        document.getElementById('cancelProduct').addEventListener('click', () => {
            UI.hideModal();
        });
        
        document.getElementById('saveProduct').addEventListener('click', () => {
            products.saveProduct();
        });
        
        // Botão de excluir produto
        document.getElementById('deleteProduct').addEventListener('click', () => {
            products.deleteCurrentProduct();
        });
        
        // Modal de pedido
        document.getElementById('closeOrderModal').addEventListener('click', () => {
            UI.hideOrderModal();
        });
        
        document.getElementById('viewHistoryBtn').addEventListener('click', () => {
            UI.hideOrderModal();
            UI.showScreen('history');
        });
        
        document.getElementById('printOrderBtn').addEventListener('click', () => {
            const orderNumber = document.getElementById('orderNumber').textContent.replace('#', '');
            orders.printOrder(parseInt(orderNumber));
        });
        
        // Eventos de impressão e compartilhamento (delegados)
        document.getElementById('ordersList').addEventListener('click', (e) => {
            if (e.target.closest('.print-btn')) {
                const id = parseInt(e.target.closest('.print-btn').dataset.id);
                orders.printOrder(id);
            } else if (e.target.closest('.share-btn')) {
                const id = parseInt(e.target.closest('.share-btn').dataset.id);
                orders.shareOrder(id);
            }
        });

        // Eventos para os produtos
        document.getElementById('productsGrid').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id);
            
            if (action === 'add') {
                cart.addToCart(id);
            } else if (action === 'edit') {
                products.openEditModal(id);
            }
        });

        // Eventos para o carrinho
        document.getElementById('cartItems').addEventListener('click', (e) => {
            const minusBtn = e.target.closest('.minus');
            const plusBtn = e.target.closest('.plus');
            const removeBtn = e.target.closest('.remove');
            
            if (minusBtn) {
                const id = parseInt(minusBtn.dataset.id);
                cart.updateQuantity(id, -1);
            } else if (plusBtn) {
                const id = parseInt(plusBtn.dataset.id);
                cart.updateQuantity(id, 1);
            } else if (removeBtn) {
                const id = parseInt(removeBtn.dataset.id);
                cart.removeFromCart(id);
            }
        });
        
        // PWA Installation
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            const installButton = document.createElement('button');
            installButton.textContent = 'Instalar App';
            installButton.className = 'btn';
            installButton.style.marginLeft = '10px';
            installButton.addEventListener('click', () => {
                e.prompt();
                installButton.style.display = 'none';
            });
            document.querySelector('.actions').appendChild(installButton);
        });
    } catch (error) {
        console.error('Erro ao inicializar o aplicativo:', error);
        UI.showToast('Erro ao carregar o aplicativo!');
    }
});