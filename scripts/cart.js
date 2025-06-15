class Cart {
    constructor(database) {
        this.db = database;
        this.items = [];
    }
    
    addToCart(productId) {
        this.db.getProduct(productId).then(product => {
            if (!product) return;
            
            const existingItem = this.items.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    quantity: 1
                });
            }
            
            this.updateCart();
            UI.showToast('Produto adicionado ao carrinho!');
        }).catch(error => {
            console.error('Erro ao adicionar produto ao carrinho:', error);
            UI.showToast('Erro ao adicionar produto ao carrinho!');
        });
    }
    
    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
        UI.showToast('Produto removido do carrinho');
    }
    
    updateQuantity(productId, change) {
        const item = this.items.find(item => item.id === productId);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.updateCart();
        }
    }
    
    updateCart() {
        const cartItems = document.getElementById('cartItems');
        cartItems.innerHTML = '';
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            document.getElementById('cartTotal').textContent = 'R$ 0,00';
            document.getElementById('cartBadge').textContent = '0';
            return;
        }
        
        let total = 0;
        
        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <i class="fas fa-${this.db.getProductIcon(item.category)}"></i>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <div class="action-btn remove" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        document.getElementById('cartTotal').textContent = `R$ ${total.toFixed(2)}`;
        document.getElementById('cartBadge').textContent = this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    checkout() {
        if (this.items.length === 0) {
            UI.showToast('Adicione produtos ao carrinho primeiro!');
            return;
        }
        
        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Criar cópia profunda dos itens para garantir que não sejam alterados posteriormente
        const itemsCopy = this.items.map(item => ({ ...item }));
        const order = {
            date: new Date().toISOString(),
            items: itemsCopy,
            total: total
        };
        
        this.db.addOrder(order).then(id => {
            document.getElementById('orderNumber').textContent = `#${id}`;
            document.getElementById('orderTotal').textContent = `R$ ${total.toFixed(2)}`;
            UI.showOrderModal();
            this.items = [];
            this.updateCart();
        }).catch(error => {
            console.error('Erro ao finalizar pedido:', error);
            UI.showToast('Erro ao finalizar pedido!');
        });
    }
}