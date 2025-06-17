// orders.js
class Orders {
    constructor(database) {
        this.db = database;
        this.printer = window.ThermalPrinter;
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

   
       async printOrder(orderId) {
        try {
            const orders = await this.db.getAllOrders();
            const order = orders.find(o => o.id === orderId);
            
            if (!order) {
                UI.showToast('Pedido não encontrado!');
                return;
            }
            
            // Obter observações de forma segura
            let notes = '';
            const notesElement = document.getElementById('receiptNotes');
            if (notesElement) {
                notes = notesElement.value || '';
            }
            
            // Obter configuração salva ou usar padrão
            const savedPrinter = localStorage.getItem('selectedPrinter');
            const paperSize = localStorage.getItem('paperSize') || 80;
            
            if (!savedPrinter) {
                UI.showToast('Configure uma impressora primeiro!');
                return;
            }
            
            // Conectar à impressora Bluetooth
            await this.printer.connectPrinter(savedPrinter);
            
            // Configurar papel
            this.printer.setPaperSize(parseInt(paperSize));
            
            // Determinar largura máxima baseada no papel
            const maxWidth = paperSize == 56 ? 24 : 32;
            
            // Formatar conteúdo para impressão térmica
            let printContent = [];
            
            // Cabeçalho
            printContent.push({
                text: "SUPERMARKET PWA",
                align: "CENTER",
                bold: true,
                width: 2,
                height: 2
            });
            
            printContent.push({
                text: `Pedido #${order.id}`,
                align: "CENTER",
                bold: true
            });
            
            printContent.push({
                text: new Date(order.date).toLocaleString('pt-BR'),
                align: "CENTER"
            });
            
            printContent.push({
                text: "-".repeat(maxWidth),
                align: "CENTER"
            });
            
            // Cabeçalho de itens
            printContent.push({
                text: "ITEM",
                align: "LEFT",
                bold: true
            });
            
            printContent.push({
                text: "QTD   VALOR   TOTAL",
                align: "RIGHT"
            });
            
            printContent.push({
                text: "-".repeat(maxWidth),
                align: "CENTER"
            });
            
            // Itens do pedido
            order.items.forEach(item => {
                const name = this.truncate(item.name, maxWidth - 15);
                const qty = item.quantity.toString().padStart(2, ' ');
                const price = item.price.toFixed(2).padStart(6, ' ');
                const total = (item.price * item.quantity).toFixed(2).padStart(6, ' ');
                
                printContent.push({
                    text: name,
                    align: "LEFT"
                });
                
                printContent.push({
                    text: `${qty}x ${price} ${total}`,
                    align: "RIGHT"
                });
            });
            
            printContent.push({
                text: "-".repeat(maxWidth),
                align: "CENTER"
            });
            
            // Observações do pedido
            if (order.notes && order.notes.trim() !== '') {
                const obsLines = this.wrapText(`OBS: ${order.notes}`, maxWidth);
                obsLines.forEach(line => {
                    printContent.push({
                        text: line,
                        align: "LEFT",
                        width: 0.8
                    });
                });
            }
            
            // Mensagem adicional
            if (notes.trim() !== '') {
                const msgLines = this.wrapText(`MSG: ${notes}`, maxWidth);
                msgLines.forEach(line => {
                    printContent.push({
                        text: line,
                        align: "LEFT",
                        width: 0.8
                    });
                });
            }
            
            // Total
            printContent.push({
                text: `TOTAL: R$ ${order.total.toFixed(2)}`,
                align: "RIGHT",
                bold: true,
                width: 2
            });
            
            printContent.push({
                text: " ",
                align: "CENTER"
            });
            
            // Rodapé
            printContent.push({
                text: "Obrigado pela preferência!",
                align: "CENTER"
            });
            
            printContent.push({
                text: " ",
                align: "CENTER"
            });
            
            // Imprimir
            await this.printer.printBlob({
                data: printContent
            });
            
            // Desconectar
            await this.printer.disconnectPrinter();
            
            UI.showToast('Pedido impresso com sucesso!');
            
            // Limpar campo de observações se existir
            if (notesElement) {
                notesElement.value = '';
            }
            
        } catch (error) {
            console.error('Erro na impressão:', error);
            UI.showToast('Falha na impressão. Verifique a conexão.');
        }
    }

    truncate(str, maxLength) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 1) + '…';
    }
    
    wrapText(text, maxLength) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if (currentLine.length + word.length + 1 <= maxLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    async shareOrder(orderId) {
        try {
            const orders = await this.db.getAllOrders();
            const order = orders.find(o => o.id === orderId);
            
            if (!order) {
                UI.showToast('Pedido não encontrado!');
                return;
            }
            
            // Obter observações de forma segura
            let notes = '';
            const notesElement = document.getElementById('receiptNotes');
            if (notesElement) {
                notes = notesElement.value || '';
            }
            
            // Formatar conteúdo para compartilhamento
            let shareContent = `*Pedido #${order.id}*\n`;
            shareContent += `*Data:* ${new Date(order.date).toLocaleString('pt-BR')}\n\n`;
            shareContent += "*Itens:*\n";
            
            order.items.forEach(item => {
                shareContent += `- ${item.quantity}x ${item.name}: R$ ${(item.price * item.quantity).toFixed(2)}\n`;
            });
            
            // Adicionar observações do pedido
            if (order.notes && order.notes.trim() !== '') {
                shareContent += `\n*Observações:* ${order.notes}\n`;
            }
            
            // Adicionar mensagem adicional
            if (notes.trim() !== '') {
                shareContent += `\n*Mensagem:* ${notes}\n`;
            }
            
            shareContent += `\n*Total: R$ ${order.total.toFixed(2)}*`;
            
            // Codificar para URL do WhatsApp
            const encodedContent = encodeURIComponent(shareContent);
            const whatsappUrl = `https://wa.me/?text=${encodedContent}`;
            
            // Abrir WhatsApp
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Erro ao compartilhar pedido:', error);
            UI.showToast('Erro ao compartilhar pedido!');
        }
    }
}