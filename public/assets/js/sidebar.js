// ====================================================
// SIDEBAR.JS - NUR SIDEBAR-SPEZIFISCHE UI-FUNKTIONEN
// ====================================================

console.log('🎛️ Sidebar.js wird geladen...');

// ====================================================
// SIDEBAR UI STEUERUNG (NUR UI!)
// ====================================================

/**
 * LLM Chat UI ein-/ausklappen (NUR UI-TOGGLE!)
 */
function toggleLLMChat() {
    console.log('🤖 Toggle LLM Chat UI');
    
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
        console.error('❌ LLM Chat UI-Elemente nicht gefunden');
    }
}

// ====================================================
// SIDEBAR INITIALISIERUNG (NUR UI!)
// ====================================================

function initializeSidebar() {
    console.log('🎛️ Initialisiere Sidebar UI...');
    
    // Hier könnten weitere Sidebar-UI-Funktionen stehen:
    // - Notizen-Sidebar-Größe anpassen
    // - Sidebar-Panels ein-/ausklappen
    // - Drag & Drop für Notizen
    // etc.
    
    console.log('✅ Sidebar UI erfolgreich initialisiert');
}

// ====================================================
// NUR SIDEBAR-SPEZIFISCHE FUNKTIONEN GLOBAL MACHEN
// ====================================================

window.toggleLLMChat = toggleLLMChat;
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