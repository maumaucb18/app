
class PrinterManager {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.paperSize = 80; // Padrão 80mm
    }

    async connect(device) {
        try {
            this.device = device;
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            return true;
        } catch (error) {
            console.error('Erro na conexão:', error);
            return false;
        }
    }

    async print(content) {
        if (!this.characteristic) {
            throw new Error('Não conectado a uma impressora');
        }

        // Converter conteúdo para ArrayBuffer
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        await this.characteristic.writeValue(data);
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }

    async printTestPage() {
        const maxWidth = this.paperSize === 56 ? 24 : 32;
        const content = this.formatTestContent(maxWidth);
        await this.print(content);
    }

    formatTestContent(maxWidth) {
        return [
            "TESTE DE IMPRESSÃO".padCenter(maxWidth),
            "-".repeat(maxWidth),
            "Esta é uma página de teste".padCenter(maxWidth),
            "para verificar a conexão".padCenter(maxWidth),
            `Papel: ${this.paperSize}mm`.padCenter(maxWidth),
            " ",
            "SuperMarket PWA".padCenter(maxWidth),
            new Date().toLocaleString('pt-BR').padCenter(maxWidth),
            "\n\n\n" // Comandos para cortar papel
        ].join("\n");
    }
}

// Extensão para centralizar texto
String.prototype.padCenter = function (width) {
    const padding = Math.max(0, width - this.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + this + ' '.repeat(rightPad);
};