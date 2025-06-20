// ui.js
class UI {
    static showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(screenId + 'Screen').classList.add('active');
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.target === screenId) {
                tab.classList.add('active');
            }
        });
    }
    
    static showModal(content, modalId = 'genericModal') {
        // Criar modal genérico se não existir
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal" id="close${modalId}">&times;</span>
                    <div class="modal-body" id="${modalId}Body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Adicionar evento de fechar
            document.getElementById(`close${modalId}`).addEventListener('click', () => {
                UI.hideModal(modalId);
            });
        }
        
        // Definir conteúdo
        document.getElementById(`${modalId}Body`).innerHTML = content;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    static hideModal(modalId = 'genericModal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }
    
    static closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');
    }
    
    static showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        // Criar toast se não existir
        if (!toast) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast';
            toastContainer.className = 'toast';
            toastContainer.innerHTML = `
                <div id="toastMessage" class="toast-message"></div>
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Configurar mensagem e estilo
        toastMessage.textContent = message;
        toast.className = 'toast show';
        toast.classList.add(type);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Métodos de compatibilidade
    static showProductModal() {
        document.getElementById('productModal').classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    static hideProductModal() {
        document.getElementById('productModal').classList.remove('active');
        document.body.classList.remove('modal-open');
    }
    
    static showOrderModal() {
        document.getElementById('orderModal').classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    static hideOrderModal() {
        document.getElementById('orderModal').classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}