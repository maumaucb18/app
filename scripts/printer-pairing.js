class PrinterPairing {
    constructor() {
        this.printer = window.ThermalPrinter;
        this.selectedPrinter = null;
        this.paperSize = 80; // Default 80mm
    }

    // Inicializar o sistema de pareamento
    async initialize() {
        // Carregar configurações salvas
        this.loadSavedSettings();
        
        // Criar elementos da interface
        this.createUI();
    }

    // Carregar configurações salvas
    loadSavedSettings() {
        const savedPrinter = localStorage.getItem('selectedPrinter');
        const savedPaperSize = localStorage.getItem('paperSize');
        
        if (savedPrinter) {
            this.selectedPrinter = JSON.parse(savedPrinter);
        }
        
        if (savedPaperSize) {
            this.paperSize = parseInt(savedPaperSize);
        }
    }

    // Criar interface de pareamento
    createUI() {
        // Criar container principal
        this.container = document.createElement('div');
        this.container.className = 'printer-pairing-container';
        this.container.style.display = 'none';
        this.container.innerHTML = `
            <div class="printer-modal">
                <div class="modal-header">
                    <h3>Configurar Impressora</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="printer-status">
                        <div class="status-indicator">
                            <span class="status-dot"></span>
                            <span class="status-text">Desconectado</span>
                        </div>
                        <div class="current-printer">
                            <span>Nenhuma impressora selecionada</span>
                        </div>
                    </div>
                    
                    <div class="printer-controls">
                        <div class="paper-size">
                            <label>Tamanho do Papel:</label>
                            <div class="radio-group">
                                <label>
                                    <input type="radio" name="paperSize" value="80" checked> 80mm
                                </label>
                                <label>
                                    <input type="radio" name="paperSize" value="56"> 56mm
                                </label>
                            </div>
                        </div>
                        
                        <button class="btn scan-btn">
                            <i class="fas fa-search"></i> Buscar Impressoras
                        </button>
                    </div>
                    
                    <div class="printer-list">
                        <div class="list-header">
                            <h4>Impressoras Disponíveis</h4>
                            <div class="loading-spinner" style="display: none;">
                                <div class="spinner"></div>
                            </div>
                        </div>
                        <div class="devices-container">
                            <p class="empty-message">Clique em "Buscar Impressoras" para começar</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn test-btn" disabled>
                        <i class="fas fa-print"></i> Testar Impressão
                    </button>
                    <button class="btn save-btn" disabled>
                        <i class="fas fa-save"></i> Salvar Configuração
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Adicionar eventos
        this.container.querySelector('.close-btn').addEventListener('click', () => this.hide());
        this.container.querySelector('.scan-btn').addEventListener('click', () => this.scanPrinters());
        this.container.querySelector('.test-btn').addEventListener('click', () => this.printTestPage());
        this.container.querySelector('.save-btn').addEventListener('click', () => this.saveSettings());
        
        // Atualizar seleção de tamanho de papel
        const paperSizeRadios = this.container.querySelectorAll('input[name="paperSize"]');
        paperSizeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.paperSize = parseInt(e.target.value);
            });
            
            if (parseInt(radio.value) === this.paperSize) {
                radio.checked = true;
            }
        });
    }

    // Mostrar a interface de pareamento
    show() {
        this.container.style.display = 'flex';
        this.updateStatus();
    }

    // Esconder a interface de pareamento
    hide() {
        this.container.style.display = 'none';
    }

    // Atualizar status da impressora
    updateStatus() {
        const statusDot = this.container.querySelector('.status-dot');
        const statusText = this.container.querySelector('.status-text');
        const currentPrinter = this.container.querySelector('.current-printer span');
        const testBtn = this.container.querySelector('.test-btn');
        const saveBtn = this.container.querySelector('.save-btn');
        
        if (this.selectedPrinter) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Conectado';
            currentPrinter.textContent = this.selectedPrinter.device_name;
            testBtn.disabled = false;
            saveBtn.disabled = false;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Desconectado';
            currentPrinter.textContent = 'Nenhuma impressora selecionada';
            testBtn.disabled = true;
            saveBtn.disabled = true;
        }
    }

    // Buscar impressoras Bluetooth disponíveis
    async scanPrinters() {
        try {
            // Solicitar permissão Bluetooth
            const available = await navigator.bluetooth.getAvailability();
            if (!available) {
                throw new Error('Bluetooth não disponível');
            }

            // Procurar dispositivos
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ namePrefix: 'Printer' }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            if (device) {
                this.selectedPrinter = {
                    device_name: device.name,
                    inner_mac_address: device.id
                };
                await this.printerManager.connect(device);
                this.updateStatus();
            }
        } catch (error) {
            console.error('Erro ao buscar impressoras:', error);
            this.showError('Verifique se o Bluetooth está ativado e tente novamente');
        }
    }

    // Conectar a uma impressora
    async connectPrinter(device) {
        const loadingSpinner = this.container.querySelector('.loading-spinner');
        loadingSpinner.style.display = 'flex';
        
        try {
            await this.printer.connectPrinter(device.inner_mac_address);
            return true;
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    // Imprimir página de teste
    async printTestPage() {
        if (!this.selectedPrinter) return;
        
        const loadingSpinner = this.container.querySelector('.loading-spinner');
        loadingSpinner.style.display = 'flex';
        
        try {
            // Configurar tamanho do papel
            this.printer.setPaperSize(this.paperSize);
            
            // Formatar conteúdo para impressão térmica
            const maxWidth = this.paperSize === 56 ? 24 : 32;
            const printContent = this.formatTestContent(maxWidth);
            
            // Enviar para impressão
            await this.printer.printBlob({ data: printContent });
        } catch (error) {
            console.error('Erro na impressão:', error);
            alert('Falha na impressão. Verifique a conexão com a impressora.');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    // Formatar conteúdo de teste
    formatTestContent(maxWidth) {
        return [
            { text: "TESTE DE IMPRESSÃO", align: "CENTER", bold: true, width: 2 },
            { text: "-".repeat(maxWidth), align: "CENTER" },
            { text: "Esta é uma página de teste", align: "CENTER" },
            { text: "para verificar a conexão", align: "CENTER" },
            { text: `Papel: ${this.paperSize}mm`, align: "CENTER" },
            { text: " ", align: "CENTER" },
            { text: "SuperMarket PWA", align: "CENTER" },
            { text: new Date().toLocaleString('pt-BR'), align: "CENTER" },
            { text: " ", align: "CENTER" },
            { text: " ", align: "CENTER" }
        ];
    }

    // Salvar configurações
    saveSettings() {
        if (!this.selectedPrinter) return;
        
        localStorage.setItem('selectedPrinter', JSON.stringify(this.selectedPrinter));
        localStorage.setItem('paperSize', this.paperSize);
        
        alert('Configurações salvas com sucesso!');
        this.hide();
    }
}