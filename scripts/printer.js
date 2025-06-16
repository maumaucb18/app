class PrinterManager {
    constructor() {
        this.printer = window.ThermalPrinter;
        this.paperSize = 80; // Padrão 80mm
    }
    
    async detectPrinters() {
        try {
            const devices = await this.printer.getBluetoothDeviceList();
            return devices;
        } catch (error) {
            console.error('Erro ao detectar impressoras:', error);
            return [];
        }
    }
    
    async connect(device) {
        try {
            await this.printer.connectPrinter(device.inner_mac_address);
            return true;
        } catch (error) {
            console.error('Erro ao conectar:', error);
            return false;
        }
    }
    
    async disconnect() {
        try {
            await this.printer.disconnectPrinter();
            return true;
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            return false;
        }
    }
    
    setPaperSize(size) {
        this.paperSize = size;
        this.printer.setPaperSize(size);
    }
    
    async printTestPage() {
        try {
            const content = [
                {
                    text: "TESTE DE IMPRESSÃO",
                    align: "CENTER",
                    bold: true,
                    width: 2
                },
                {
                    text: "--------------------------------",
                    align: "CENTER"
                },
                {
                    text: "Esta é uma página de teste",
                    align: "CENTER"
                },
                {
                    text: "para verificar a conexão",
                    align: "CENTER"
                },
                {
                    text: `Papel: ${this.paperSize}mm`,
                    align: "CENTER"
                },
                {
                    text: " ",
                    align: "CENTER"
                },
                {
                    text: "SuperMarket PWA",
                    align: "CENTER"
                },
                {
                    text: new Date().toLocaleString('pt-BR'),
                    align: "CENTER"
                }
            ];
            
            await this.printer.printBlob({
                data: content
            });
            
            return true;
        } catch (error) {
            console.error('Erro na impressão:', error);
            return false;
        }
    }
}