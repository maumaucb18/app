class Summary {
    constructor(database) {
        this.db = database;
        this.exportInterval = null;
    }
    
    async loadSummary() {
        const orders = await this.db.getAllOrders();
        this.calculateSummary(orders);
        this.updateLastExport();
    }
    
    calculateSummary(orders) {
        // Calcular totais gerais
        const totalOrders = orders.length;
        const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
        
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalAmount').textContent = `R$ ${totalAmount.toFixed(2)}`;
        
        // Calcular resumo por dia
        const dailySummary = {};
        
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            const dateKey = orderDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            
            if (!dailySummary[dateKey]) {
                dailySummary[dateKey] = {
                    date: orderDate,
                    count: 0,
                    total: 0
                };
            }
            
            dailySummary[dateKey].count++;
            dailySummary[dateKey].total += order.total;
        });
        
        // Ordenar por data (mais recente primeiro)
        const sortedDates = Object.keys(dailySummary).sort((a, b) => b.localeCompare(a));
        
        // Atualizar tabela
        const dailySummaryBody = document.getElementById('dailySummary');
        dailySummaryBody.innerHTML = '';
        
        sortedDates.forEach(dateKey => {
            const day = dailySummary[dateKey];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${day.date.toLocaleDateString('pt-BR')}</td>
                <td>${day.count}</td>
                <td>R$ ${day.total.toFixed(2)}</td>
            `;
            
            dailySummaryBody.appendChild(row);
        });
    }
    
    updateLastExport() {
        const lastExport = localStorage.getItem('lastPdfExport');
        if (lastExport) {
            const lastExportDate = new Date(parseInt(lastExport));
            document.getElementById('lastExport').textContent = lastExportDate.toLocaleString('pt-BR');
        } else {
            document.getElementById('lastExport').textContent = 'Nunca';
        }
    }
    
    exportToPDF() {
        this.db.getAllOrders().then(orders => {
            // Acessar o jsPDF corretamente
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurações do documento
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            
            // Cabeçalho
            doc.setFontSize(18);
            doc.text("Relatório de Vendas - Histórico Geral", pageWidth / 2, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
            
            // Informações gerais
            const totalOrders = orders.length;
            const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
            
            doc.setFontSize(14);
            doc.text(`Total de Pedidos: ${totalOrders}`, margin, 40);
            doc.text(`Valor Total: R$ ${totalAmount.toFixed(2)}`, margin, 48);
            
            // Tabela de resumo diário
            const dailySummary = {};
            
            orders.forEach(order => {
                const orderDate = new Date(order.date);
                const dateKey = orderDate.toISOString().split('T')[0];
                
                if (!dailySummary[dateKey]) {
                    dailySummary[dateKey] = {
                        date: orderDate,
                        count: 0,
                        total: 0
                    };
                }
                
                dailySummary[dateKey].count++;
                dailySummary[dateKey].total += order.total;
            });
            
            // Ordenar por data
            const sortedDates = Object.keys(dailySummary).sort((a, b) => b.localeCompare(a));
            
            // Cabeçalho da tabela
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text("Data", margin, 65);
            doc.text("Pedidos", margin + 60, 65);
            doc.text("Valor Total", margin + 100, 65);
            
            doc.setFont(undefined, 'normal');
            let yPos = 70;
            
            // Linhas da tabela
            sortedDates.forEach(dateKey => {
                const day = dailySummary[dateKey];
                
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(day.date.toLocaleDateString('pt-BR'), margin, yPos);
                doc.text(day.count.toString(), margin + 60, yPos);
                doc.text(`R$ ${day.total.toFixed(2)}`, margin + 100, yPos);
                
                yPos += 8;
            });
            
            // Lista de pedidos
            doc.addPage();
            yPos = 20;
            
            doc.setFontSize(16);
            doc.text("Detalhes de Todos os Pedidos", pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;
            
            orders.forEach((order, index) => {
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`Pedido #${order.id} - ${new Date(order.date).toLocaleString('pt-BR')}`, margin, yPos);
                yPos += 7;
                
                doc.setFont(undefined, 'normal');
                order.items.forEach(item => {
                    doc.text(`${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`, margin + 5, yPos);
                    yPos += 6;
                });
                
                if (order.notes && order.notes.trim() !== '') {
                    doc.text(`Observações: ${order.notes}`, margin + 5, yPos);
                    yPos += 6;
                }
                
                doc.text(`Total: R$ ${order.total.toFixed(2)}`, margin + 5, yPos);
                yPos += 10;
                
                // Linha divisória
                if (index < orders.length - 1) {
                    doc.setLineWidth(0.1);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 5;
                }
            });
            
            // Salvar PDF
            const fileName = `historico_vendas_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            // Atualizar última exportação
            localStorage.setItem('lastPdfExport', Date.now());
            this.updateLastExport();
            
            UI.showToast('Histórico exportado em PDF com sucesso!');
        });
    }
    
    scheduleDailyExport() {
        // Cancelar agendamento anterior se existir
        if (this.exportInterval) {
            clearInterval(this.exportInterval);
        }
        
        // Verificar se já passou 24h desde a última exportação
        const lastExport = localStorage.getItem('lastPdfExport');
        const now = Date.now();
        let nextExport;
        
        if (lastExport) {
            const lastExportTime = parseInt(lastExport);
            const nextExportTime = lastExportTime + (24 * 60 * 60 * 1000);
            
            if (now < nextExportTime) {
                nextExport = nextExportTime;
            } else {
                // Se já passou mais de 24h, exportar agora
                this.exportToPDF();
                nextExport = now + (24 * 60 * 60 * 1000);
            }
        } else {
            // Primeira exportação
            this.exportToPDF();
            nextExport = now + (24 * 60 * 60 * 1000);
        }
        
        // Agendar próxima exportação
        const timeUntilNext = nextExport - now;
        
        this.exportInterval = setTimeout(() => {
            this.exportToPDF();
            this.scheduleDailyExport(); // Reagendar para o próximo dia
        }, timeUntilNext);
        
        // Marcar que o agendamento está ativo
        localStorage.setItem('pdfExportScheduled', 'true');
        
        UI.showToast('Exportação diária agendada com sucesso!');
    }
}