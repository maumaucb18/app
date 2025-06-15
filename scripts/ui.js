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
    
    static showModal() {
        document.getElementById('productModal').classList.add('active');
    }
    
    static hideModal() {
        document.getElementById('productModal').classList.remove('active');
    }
    
    static showOrderModal() {
        document.getElementById('orderModal').classList.add('active');
    }
    
    static hideOrderModal() {
        document.getElementById('orderModal').classList.remove('active');
    }
    
    static showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.style.display = 'flex';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}