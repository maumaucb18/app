class Database {
    constructor() {
        this.db = null;
        this.initializeDB();
    }
    
    initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SupermarketDB', 2);
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                if (!this.db.objectStoreNames.contains('products')) {
                    const productsStore = this.db.createObjectStore('products', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    productsStore.createIndex('category', 'category', { unique: false });
                }
                
                if (!this.db.objectStoreNames.contains('orders')) {
                    const ordersStore = this.db.createObjectStore('orders', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    ordersStore.createIndex('date', 'date', { unique: false });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    async loadInitialData() {
        const products = await this.getAllProducts();
        if (products.length === 0) {
            const initialProducts = [
                
            ];
            
            for (const product of initialProducts) {
                await this.addProduct(product);
            }
        }
    }
    
    // Operações CRUD para produtos
    addProduct(product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.add(product);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    updateProduct(product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.put(product);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    deleteProduct(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    getAllProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    getProduct(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Operações para pedidos
    addOrder(order) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['orders'], 'readwrite');
            const store = transaction.objectStore('orders');
             // Garantir que observações existam mesmo quando vazias
            order.notes = order.notes || '';
             // Adicionar timestamp para ordenação
            order.timestamp = new Date().getTime();
            const request = store.add(order);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    
    // Adicione este método à classe Database
getAllOrders() {
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['orders'], 'readonly');
        const store = transaction.objectStore('orders');
        const request = store.getAll();
        
        request.onsuccess = () => {
            // Ordenar por data (mais recente primeiro)
            const orders = request.result.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            resolve(orders);
        };
        
        request.onerror = () => reject(request.error);
    });
   
}
    
    // Utilitários
    getProductIcon(category) {
        const icons = {
            'alimentos': 'bread-slice',
            'bebidas': 'wine-bottle',
            'outros': 'shopping-bag'
        };
        return icons[category] || 'shopping-bag';
    }
}