// orders.js
class Orders {
    constructor(database) {
        this.db = database;
        this.printer = window.ThermalPrinter;
        this.currentOrderId = null; // Para armazenar o ID durante tentativas
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
        this.currentOrderId = orderId; // Armazena para retentativas
        
        try {
            // Obter o pedido
            const orders = await this.db.getAllOrders();
            const order = orders.find(o => o.id === orderId);
            
            if (!order) {
                UI.showToast('Pedido não encontrado!', 'error');
                return;
            }
            
            // Obter observações de forma segura
            let notes = '';
            const notesElement = document.getElementById('receiptNotes');
            if (notesElement) {
                notes = notesElement.value || '';
            }
            
            // Obter configuração salva
            const savedPrinter = localStorage.getItem('selectedPrinter');
            const paperSize = localStorage.getItem('paperSize') || 80;
            
            if (!savedPrinter) {
                UI.showToast('Configure uma impressora primeiro!', 'error');
                return;
            }
            
            // 1. Verificar permissões Bluetooth
            if (!await this.checkBluetoothPermissions()) {
                return;
            }
            
            // 2. Tentar conexão com timeout
            UI.showToast('Conectando à impressora...', 'info');
            await this.connectWithTimeout(savedPrinter, 15000); // 15 segundos
            
            // 3. Verificar conexão
            const isConnected = await this.printer.isConnected();
            if (!isConnected) {
                throw new Error('Falha na conexão após timeout');
            }
            
            // Configurar papel
            this.printer.setPaperSize(parseInt(paperSize));
            const maxWidth = paperSize == 56 ? 24 : 32;
            
            // Formatar conteúdo
            let printContent = this.formatReceiptContent(order, notes, maxWidth);
            
            // 4. Imprimir
            await this.printer.printBlob({ data: printContent });
            UI.showToast('Pedido impresso com sucesso!', 'success');
            
            // Limpar campo de observações
            if (notesElement) notesElement.value = '';
            
        } catch (error) {
            console.error('Erro na impressão:', error);
            this.handlePrintError(error);
        } finally {
            // 5. Sempre desconectar
            try {
                await this.printer.disconnectPrinter();
            } catch (e) {
                console.warn('Erro ao desconectar:', e);
            }
        }
    }

    formatReceiptContent(order, notes, maxWidth) {
        let content = [];
        
        // Cabeçalho
        content.push({ text: "SUPERMARKET PWA", align: "CENTER", bold: true, width: 2, height: 2 });
        content.push({ text: `Pedido #${order.id}`, align: "CENTER", bold: true });
        content.push({ text: new Date(order.date).toLocaleString('pt-BR'), align: "CENTER" });
        content.push({ text: "-".repeat(maxWidth), align: "CENTER" });
        
        // Itens
        content.push({ text: "ITEM", align: "LEFT", bold: true });
        content.push({ text: "QTD   VALOR   TOTAL", align: "RIGHT" });
        content.push({ text: "-".repeat(maxWidth), align: "CENTER" });
        
        order.items.forEach(item => {
            const name = this.truncate(item.name, maxWidth - 15);
            const qty = item.quantity.toString().padStart(2, ' ');
            const price = item.price.toFixed(2).padStart(6, ' ');
            const total = (item.price * item.quantity).toFixed(2).padStart(6, ' ');
            
            content.push({ text: name, align: "LEFT" });
            content.push({ text: `${qty}x ${price} ${total}`, align: "RIGHT" });
        });
        
        content.push({ text: "-".repeat(maxWidth), align: "CENTER" });
        
        // Observações
        if (order.notes && order.notes.trim() !== '') {
            this.wrapText(`OBS: ${order.notes}`, maxWidth).forEach(line => {
                content.push({ text: line, align: "LEFT", width: 0.8 });
            });
        }
        
        // Mensagem adicional
        if (notes.trim() !== '') {
            this.wrapText(`MSG: ${notes}`, maxWidth).forEach(line => {
                content.push({ text: line, align: "LEFT", width: 0.8 });
            });
        }
        
        // Total
        content.push({ text: `TOTAL: R$ ${order.total.toFixed(2)}`, align: "RIGHT", bold: true, width: 2 });
        content.push({ text: " ", align: "CENTER" });
        content.push({ text: "Obrigado pela preferência!", align: "CENTER" });
        content.push({ text: " ", align: "CENTER" });
        
        return content;
    }

    async checkBluetoothPermissions() {
        try {
            // Verificar suporte a Bluetooth
            if (!navigator.bluetooth) {
                UI.showToast('Bluetooth não suportado neste navegador!', 'error');
                return false;
            }

            // Verificar permissões (não disponível em todos os navegadores)
            if (navigator.permissions && navigator.permissions.query) {
                const permission = await navigator.permissions.query({ name: 'bluetooth' });
                if (permission.state === 'denied') {
                    UI.showToast('Permissão Bluetooth negada!', 'error');
                    return false;
                }
            }
            
            return true;
        } catch (e) {
            console.error('Erro nas permissões:', e);
            UI.showToast('Erro ao verificar permissões Bluetooth', 'error');
            return false;
        }
    }

    async connectWithTimeout(deviceId, timeoutMs) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: Impressora não respondeu'));
            }, timeoutMs);

            try {
                await this.printer.connectPrinter(deviceId);
                clearTimeout(timeout);
                resolve();
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    handlePrintError(error) {
        let message = 'Erro desconhecido';
        
        if (error.message.includes('Timeout')) {
            message = 'Impressora não encontrada! Verifique:';
        } else if (error.message.includes('permission')) {
            message = 'Permissão Bluetooth necessária!';
        } else if (error.message.includes('connect')) {
            message = 'Falha na conexão Bluetooth!';
        } else {
            message = `Erro: ${error.message}`;
        }

        UI.showToast(message, 'error');
        
        // Mostrar modal de ajuda
        UI.showModal(`
            <div class="print-error-modal">
                <h3>Solução de Problemas</h3>
                <ol>
                    <li>✅ Verifique se a impressora está ligada</li>
                    <li>✅ Ative o Bluetooth no dispositivo</li>
                    <li>✅ Aproxime-se da impressora</li>
                    <li>✅ Repareie se necessário</li>
                </ol>
                
                <div class="button-group">
                    <button id="retryPrint" class="btn primary">Tentar Novamente</button>
                    <button id="configurePrinter" class="btn secondary">Configurar Impressora</button>
                </div>
            </div>
        `);
        
        // Configurar eventos dos botões
        document.getElementById('retryPrint')?.addEventListener('click', () => {
            UI.closeModal();
            if (this.currentOrderId) this.printOrder(this.currentOrderId);
        });
        
        document.getElementById('configurePrinter')?.addEventListener('click', () => {
            UI.closeModal();
            window.router.navigate('/settings'); // Supondo que existe rota para configurações
        });
    }

    // Métodos auxiliares
    truncate(str, maxLength) {
        return str.length <= maxLength ? str : str.substring(0, maxLength - 1) + '…';
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
                UI.showToast('Pedido não encontrado!', 'error');
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
            UI.showToast('Erro ao compartilhar pedido!', 'error');
        }
    }
}