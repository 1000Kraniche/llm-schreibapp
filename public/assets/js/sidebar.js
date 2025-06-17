// ====================================================
// SIDEBAR.JS - SIDEBAR-SPEZIFISCHE UI-FUNKTIONEN + SUMMERNOTE
// ====================================================

console.log('🎛️ Sidebar.js wird geladen...');

// ====================================================
// SUMMERNOTE SIDEBAR INTEGRATION
// ====================================================

let sidebarRichTextEnabled = false;

/**
 * Summernote für Sidebar-Textarea initialisieren (mit versteckbarer Toolbar)
 */
function initializeSidebarSummernote() {
    const textarea = document.getElementById('main-note-textarea');
    
    if (textarea && !sidebarRichTextEnabled) {
        $(textarea).summernote({
            height: 250,
            lang: 'de-DE',
            toolbar: [
                // Reduzierte Toolbar - nur die wichtigsten Funktionen
                ['style', ['bold', 'italic', 'underline']],
                ['para', ['ul', 'ol']],
                ['misc', ['undo', 'redo']]
            ],
            placeholder: 'Hier steht der Inhalt deiner Notiz...\n\nDu kannst hier direkt schreiben und formatieren.',
            focus: false,
            disableResizeEditor: true,
            callbacks: {
                onChange: function(contents, $editable) {
                    // Auto-Save Trigger
                    if (typeof noteHasUnsavedChanges !== 'undefined') {
                        noteHasUnsavedChanges = true;
                    }
                    if (typeof updateNoteSaveStatus === 'function') {
                        updateNoteSaveStatus('Ungespeichert');
                    }
                    
                    if (typeof noteAutoSaveEnabled !== 'undefined' && noteAutoSaveEnabled) {
                        clearTimeout(window.noteAutoSaveTimer);
                        window.noteAutoSaveTimer = setTimeout(() => {
                            if (typeof saveCurrentNote === 'function') {
                                saveCurrentNote();
                            }
                        }, 3000);
                    }
                },
                onFocus: function() {
                    showSummernoteToolbar();
                },
                onBlur: function(e) {
                    // Nur verstecken wenn Focus nicht auf Toolbar ist
                    setTimeout(() => {
                        if (!$(document.activeElement).closest('.note-toolbar').length) {
                            hideSummernoteToolbar();
                        }
                    }, 150);
                }
            }
        });
        
        // Toolbar initial verstecken
        hideSummernoteToolbar();
        
        sidebarRichTextEnabled = true;

        console.log('✅ Summernote für Sidebar aktiviert (mit versteckbarer Toolbar)');
    }
}

/**
 * Summernote Toolbar anzeigen (slide-in von links)
 */
function showSummernoteToolbar() {
    const toolbar = $('.note-side .note-toolbar');
    if (toolbar.length) {
        toolbar.addClass('toolbar-visible');
        console.log('📝 Toolbar eingeblendet');
    }
}

/**
 * Summernote Toolbar verstecken (slide-out nach links)
 */
function hideSummernoteToolbar() {
    const toolbar = $('.note-side .note-toolbar');
    if (toolbar.length) {
        toolbar.removeClass('toolbar-visible');
        console.log('📝 Toolbar ausgeblendet');
    }
}

/**
 * Summernote für Sidebar zerstören 
 */
function destroySidebarSummernote() {
    const textarea = document.getElementById('main-note-textarea');
    if (textarea && sidebarRichTextEnabled) {
        $(textarea).summernote('destroy');
        sidebarRichTextEnabled = false;

        console.log('🗑️ Summernote für Sidebar deaktiviert');
    }
}

/**
 * Content in Sidebar Editor laden (unterstützt beide Modi)
 */
function loadContentInSidebarEditor(content) {
    const textarea = document.getElementById('main-note-textarea');
    if (!textarea) return;
    
    if (sidebarRichTextEnabled) {
        // Summernote-Content setzen
        $(textarea).summernote('code', content || '');
    } else {
        // Plain-Text: HTML-Tags entfernen
        const cleanContent = content ? content.replace(/<[^>]*>/g, '') : '';
        textarea.value = cleanContent;
    }
    
    console.log('✅ Content in Sidebar Editor geladen (Rich-Text:', sidebarRichTextEnabled, ')');
}

/**
 * Content aus Sidebar Editor holen (unterstützt beide Modi)
 */
function getContentFromSidebarEditor() {
    const textarea = document.getElementById('main-note-textarea');
    if (!textarea) return '';
    
    if (sidebarRichTextEnabled) {
        return $(textarea).summernote('code');
    } else {
        return textarea.value;
    }
}

// ====================================================
// SIDEBAR UI STEUERUNG
// ====================================================

/**
 * LLM Chat UI ein-/ausklappen
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
// SIDEBAR INITIALISIERUNG
// ====================================================

function initializeSidebar() {
    console.log('🎛️ Initialisiere Sidebar UI...');
    
    // Summernote IMMER aktivieren
    setTimeout(() => {
        initializeSidebarSummernote();
    }, 1000);
    
    console.log('✅ Sidebar UI erfolgreich initialisiert');
}

/**
 * Event-Handler für Toolbar-Management
 */
function setupToolbarEvents() {
    // Toolbar bei Klick auf Toolbar-Buttons nicht verstecken
    $(document).on('mousedown', '.note-side .note-toolbar', function(e) {
        e.preventDefault(); // Verhindert Blur-Event
    });
    
    // Toolbar verstecken bei Klick außerhalb
    $(document).on('click', function(e) {
        if (sidebarRichTextEnabled) {
            const $target = $(e.target);
            const isInEditor = $target.closest('.note-editor').length > 0;
            const isInToolbar = $target.closest('.note-toolbar').length > 0;
            
            if (!isInEditor && !isInToolbar) {
                hideSummernoteToolbar();
            }
        }
    });
}

// ====================================================
// HELPER FUNKTIONEN FÜR NOTIZEN-MANAGER
// ====================================================

/**
 * Erweiterte updateNoteDisplay Funktion die Summernote unterstützt
 */
function updateSidebarNoteDisplay(noteData) {
    if (!noteData) return;
    
    // Titel bereinigen (HTML-Tags entfernen)
    const cleanTitle = noteData.title ? 
        noteData.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
    
    console.log('🔄 Aktualisiere Sidebar Note Display für:', cleanTitle);
    
    // Header aktualisieren - MIT NULL-CHECK
    const noteNameElement = document.getElementById('current-note-name');
    if (noteNameElement) {
        noteNameElement.textContent = cleanTitle;
        console.log('✅ Header-Titel aktualisiert');
    } else {
        console.warn('⚠️ Element #current-note-name nicht gefunden');
    }
    
    // Titel anzeigen - MIT NULL-CHECKS
    const titleDisplay = document.getElementById('current-note-title-display');
    const titleInput = document.getElementById('current-note-title-input');
    
    if (titleDisplay) {
        titleDisplay.textContent = cleanTitle;
        console.log('✅ Titel-Display aktualisiert');
    } else {
        console.warn('⚠️ Element #current-note-title-display nicht gefunden');
    }
    
    if (titleInput) {
        titleInput.value = cleanTitle;
        console.log('✅ Titel-Input aktualisiert');
    } else {
        console.warn('⚠️ Element #current-note-title-input nicht gefunden');
    }
    
    // Content laden (unterstützt beide Modi)
    loadContentInSidebarEditor(noteData.content);
    
    console.log('✅ Sidebar Note Display vollständig aktualisiert');
}

// ====================================================
// GLOBALE FUNKTIONEN
// ====================================================

// Summernote Funktionen global machen
window.initializeSidebarSummernote = initializeSidebarSummernote;
window.destroySidebarSummernote = destroySidebarSummernote;
window.loadContentInSidebarEditor = loadContentInSidebarEditor;
window.getContentFromSidebarEditor = getContentFromSidebarEditor;
window.updateSidebarNoteDisplay = updateSidebarNoteDisplay;
window.showSummernoteToolbar = showSummernoteToolbar;
window.hideSummernoteToolbar = hideSummernoteToolbar;

// Bestehende UI Funktionen
window.toggleLLMChat = toggleLLMChat;
window.initializeSidebar = initializeSidebar;

// ====================================================
// AUTO-INITIALISIERUNG
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Sidebar.js DOM ready');
    
    // Kurz warten bis alle anderen Scripts geladen sind
    setTimeout(() => {
        initializeSidebar();
    }, 100);
});

console.log('✅ Sidebar.js vollständig geladen!');