// orders.js
class Orders {
    constructor(database) {
        this.db = database;
    }
    
    async loadOrders() {
        const orders = await this.db.getAllOrders();
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p>Nenhum pedido encontrado</p>';
            return;
        }
        
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `
                    <div class="order-item">
                        <div>${item.quantity}x ${item.name}</div>
                        <div>R$ ${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                `;
            });
            
            const date = new Date(order.date);
            const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            orderCard.innerHTML = `
                <div class="order-header">
                    <div class="order-id">Pedido #${order.id}</div>
                    <div class="order-date">${formattedDate}</div>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                <div class="order-total">Total: R$ ${order.total.toFixed(2)}</div>
                <div class="order-actions">
                    <button class="action-button print-btn" data-id="${order.id}">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="action-button share-btn" data-id="${order.id}">
                        <i class="fab fa-whatsapp"></i> Compartilhar
                    </button>
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    }
    
    printOrder(orderId) {
        this.db.getAllOrders().then(orders => {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                // Criar conteúdo formatado para impressão
                let printContent = `
                    <style>
                        @media print {
                            body { font-family: Arial, sans-serif; }
                            .print-header { text-align: center; margin-bottom: 20px; }
                            .print-title { font-size: 18px; font-weight: bold; }
                            .print-subtitle { font-size: 14px; margin-bottom: 10px; }
                            .print-table { width: 100%; border-collapse: collapse; }
                            .print-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px; }
                            .print-table td { padding: 5px; }
                            .print-total { font-weight: bold; margin-top: 10px; text-align: right; }
                            .print-footer { margin-top: 20px; text-align: center; font-size: 12px; }
                        }
                    </style>
                    <div class="print-header">
                        <div class="print-title">Cupom de Retirada</div>
                        <div class="print-subtitle">Pedido #${order.id}</div>
                        <div class="print-subtitle">${new Date(order.date).toLocaleString('pt-BR')}</div>
                    </div>
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd</th>
                                <th>Preço Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Adicionar cada item discriminado
                order.items.forEach(item => {
                    printContent += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>R$ ${item.price.toFixed(2)}</td>
                            <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `;
                });
                
                // Adicionar total
                printContent += `
                        </tbody>
                    </table>
                    <div class="print-total">Total: R$ ${order.total.toFixed(2)}</div>
                    <div class="print-footer">Obrigado pela preferência!</div>
                `;
                
                // Abrir janela de impressão
                const printWindow = window.open('', '_blank');
                printWindow.document.write(printContent);
                printWindow.document.close();
                
                // Aguardar o carregamento para impressão
                printWindow.onload = function() {
                    printWindow.print();
                    printWindow.close();
                };
            }
        });
    }
    
    shareOrder(orderId) {
        this.db.getAllOrders().then(orders => {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                // Formatar conteúdo para PDF/WhatsApp
                let shareContent = `*Pedido #${order.id}*\n`;
                shareContent += `*Data:* ${new Date(order.date).toLocaleString('pt-BR')}\n\n`;
                shareContent += "*Itens:*\n";
                
                order.items.forEach(item => {
                    shareContent += `- ${item.quantity}x ${item.name}: R$ ${(item.price * item.quantity).toFixed(2)}\n`;
                });
                
                shareContent += `\n*Total: R$ ${order.total.toFixed(2)}*`;
                
                // Codificar para URL do WhatsApp
                const encodedContent = encodeURIComponent(shareContent);
                const whatsappUrl = `https://wa.me/?text=${encodedContent}`;
                
                // Abrir WhatsApp
                window.open(whatsappUrl, '_blank');
            }
        });
    }
}