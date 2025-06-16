// ====================================================
// SIDEBAR.JS - NUR SIDEBAR-SPEZIFISCHE FUNKTIONEN
// ====================================================

console.log('🎛️ Sidebar.js wird geladen...');

// ====================================================
// LLM CHAT STEUERUNG
// ====================================================

function toggleLLMChat() {
    console.log('🤖 Toggle LLM Chat');
    
    const content = document.getElementById('llm-content');
    const btn = document.getElementById('llm-toggle-btn');
    
    if (content && btn) {
        if (content.classList.contains('collapsed')) {
            // Chat aufklappen
            content.classList.remove('collapsed');
            btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            console.log('✅ LLM Chat aufgeklappt');
        } else {
            // Chat zuklappen
            content.classList.add('collapsed');
            btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            console.log('✅ LLM Chat zugeklappt');
        }
    } else {
        console.error('❌ LLM Chat Elemente nicht gefunden');
    }
}

// ====================================================
// HILFSFUNKTIONEN (GENERISCH)
// ====================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTempMessage(message, type = 'info') {
    console.log(`📢 Toast: ${message} (${type})`);
    
    const alertClass = `alert-${type}`;
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-Hide nach 3 Sekunden
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert.textContent.includes(message.replace(/<[^>]*>/g, ''))) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        });
    }, 3000);
}

// ====================================================
// SIDEBAR INITIALISIERUNG
// ====================================================

function initializeSidebar() {
    console.log('🎛️ Initialisiere Sidebar...');
    
    // LLM Chat Setup
    const llmForm = document.getElementById('llm-form');
    if (llmForm) {
        llmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const input = document.getElementById('llm-input');
            const query = input.value.trim();
            
            if (query) {
                console.log('🤖 LLM Query:', query);
                // TODO: LLM-Integration hier
                showTempMessage('LLM-Integration noch nicht implementiert', 'info');
                input.value = '';
            }
        });
        
        console.log('✅ LLM Form Event-Listener hinzugefügt');
    }
    
    // Weitere Sidebar-Initialisierungen hier...
    
    console.log('✅ Sidebar erfolgreich initialisiert');
}

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

window.toggleLLMChat = toggleLLMChat;
window.escapeHtml = escapeHtml;
window.showTempMessage = showTempMessage;
window.initializeSidebar = initializeSidebar;

// ====================================================
// AUTO-INITIALISIERUNG
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    // Kurz warten bis alle anderen Scripts geladen sind
    setTimeout(() => {
        initializeSidebar();
    }, 100);
});

console.log('✅ Sidebar.js geladen!');