class Products {
    constructor(database) {
        this.db = database;
        this.currentProductId = null;
        this.deleteButton = document.getElementById('deleteProduct');
    }
    
    async loadProducts() {
        try {
            const products = await this.db.getAllProducts();
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '';
            
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <i class="fas fa-${this.db.getProductIcon(product.category)}"></i>
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                        <div class="product-actions">
                            <div class="action-btn" data-action="add" data-id="${product.id}">
                                <i class="fas fa-cart-plus"></i>
                            </div>
                            <div class="action-btn" data-action="edit" data-id="${product.id}">
                                <i class="fas fa-edit"></i>
                            </div>
                        </div>
                    </div>
                `;
                productsGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }
    
    openEditModal(id = null) {
        if (id) {
            this.db.getProduct(id).then(product => {
                if (product) {
                    document.getElementById('modalTitle').textContent = 'Editar Produto';
                    document.getElementById('productName').value = product.name;
                    document.getElementById('productPrice').value = product.price;
                    document.getElementById('productCategory').value = product.category;
                    this.currentProductId = id;
                    this.deleteButton.style.display = 'block'; // Mostrar o botão de exclusão
                    UI.showModal();
                }
            });
        } else {
            document.getElementById('modalTitle').textContent = 'Adicionar Produto';
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productCategory').value = 'alimentos';
            this.currentProductId = null;
            this.deleteButton.style.display = 'none'; // Esconder o botão de exclusão
            UI.showModal();
        }
    }
    
    saveProduct() {
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        
        if (!name || isNaN(price)) {
            UI.showToast('Preencha todos os campos corretamente!');
            return;
        }
        
        const product = {
            name: name,
            price: price,
            category: category
        };
        
        if (this.currentProductId) {
            product.id = this.currentProductId;
            this.db.updateProduct(product).then(() => {
                UI.hideModal();
                UI.showToast('Produto atualizado com sucesso!');
                this.loadProducts();
            }).catch(error => {
                console.error('Erro ao atualizar produto:', error);
                UI.showToast('Erro ao atualizar produto!');
            });
        } else {
            this.db.addProduct(product).then(() => {
                UI.hideModal();
                UI.showToast('Produto adicionado com sucesso!');
                this.loadProducts();
            }).catch(error => {
                console.error('Erro ao adicionar produto:', error);
                UI.showToast('Erro ao adicionar produto!');
            });
        }
    }
    
    deleteCurrentProduct() {
        if (this.currentProductId) {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                this.db.deleteProduct(this.currentProductId).then(() => {
                    UI.hideModal();
                    UI.showToast('Produto excluído com sucesso!');
                    this.loadProducts();
                }).catch(error => {
                    console.error('Erro ao excluir produto:', error);
                    UI.showToast('Erro ao excluir produto!');
                });
            }
        }
    }
}