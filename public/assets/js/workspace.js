// ====================================================
// WORKSPACE.JS - VOLLSTÄNDIGE EDITOR & WORKSPACE LOGIC
// ====================================================

console.log('🚀 Workspace.js wird geladen...');

// Globale Variablen
let projectSlug = null;
let documentId = null;
let autoSaveEnabled = true;
let hasUnsavedChanges = false;

// ====================================================
// SUMMERNOTE EDITOR SETUP
// ====================================================

function initializeSummernoteEditor() {
    console.log('🟡 initializeSummernoteEditor() gestartet');
    
    // Warten bis DOM und jQuery bereit sind
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery ist nicht verfügbar!');
        return;
    }
    
    // Warten bis Summernote geladen ist
    if (typeof $.fn.summernote === 'undefined') {
        console.error('❌ Summernote ist nicht verfügbar!');
        setTimeout(initializeSummernoteEditor, 100);
        return;
    }
    
    console.log('✅ jQuery und Summernote verfügbar');
    
    // Projekt-Daten aus HTML extrahieren
    const mainElement = document.querySelector('[data-project-slug]');
    if (mainElement) {
        projectSlug = mainElement.dataset.projectSlug;
        console.log('📊 Project Slug gefunden:', projectSlug);
    } else {
        console.error('❌ Kein data-project-slug Element gefunden!');
    }

    const editorElement = $('#summernote-editor');
    if (editorElement.length === 0) {
        console.error('❌ #summernote-editor Element nicht gefunden!');
        return;
    }
    
    console.log('✅ Editor Element gefunden, initialisiere Summernote...');

    // Summernote initialisieren
    editorElement.summernote({
        height: 500,
        focus: true,
        
        toolbar: [
            ['heading', ['p', 'h1', 'h2', 'h3', 'h4']],
            ['font', ['bold', 'italic', 'underline', 'strikethrough']],
            ['para', ['paragraph', 'ul', 'ol']],
            ['color', ['color']],
            ['insert', ['link', 'picture', 'table', 'hr']],
            ['view', ['fullscreen', 'codeview']]
        ],
        
        buttons: {
            p: function(context) {
                var ui = $.summernote.ui;
                return ui.button({
                    contents: 'P',
                    tooltip: 'Normal Text',
                    click: function() {
                        context.invoke('formatBlock', 'p');
                    }
                }).render();
            },
            h1: function(context) {
                var ui = $.summernote.ui;
                return ui.button({
                    contents: 'H1',
                    tooltip: 'Überschrift 1',
                    click: function() {
                        context.invoke('formatBlock', 'h1');
                    }
                }).render();
            },
            h2: function(context) {
                var ui = $.summernote.ui;
                return ui.button({
                    contents: 'H2',
                    tooltip: 'Überschrift 2',
                    click: function() {
                        context.invoke('formatBlock', 'h2');
                    }
                }).render();
            },
            h3: function(context) {
                var ui = $.summernote.ui;
                return ui.button({
                    contents: 'H3',
                    tooltip: 'Überschrift 3',
                    click: function() {
                        context.invoke('formatBlock', 'h3');
                    }
                }).render();
            },
            h4: function(context) {
                var ui = $.summernote.ui;
                return ui.button({
                    contents: 'H4',
                    tooltip: 'Überschrift 4',
                    click: function() {
                        context.invoke('formatBlock', 'h4');
                    }
                }).render();
            }
        },

        fontNames: [
            'Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Verdana'
        ],
        
        colors: [
            ['#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F3F7', '#FFFFFF'],
            ['#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF'],
            ['#F7C6CE', '#FFE7CE', '#FFEAA7', '#D1F2A5', '#AEDFF7', '#A29BFE', '#DDA0DD', '#F8BBD0']
        ],
        
        callbacks: {
            onInit: function() {
                console.log('🎉 Summernote Editor erfolgreich initialisiert!');
                updateWordCount(editorElement.summernote('code'));
            },
            onChange: function(contents, $editable) {
                console.log('📝 Content geändert, Länge:', contents.length);
                hasUnsavedChanges = true;
                updateWordCount(contents);
                
                // Auto-Save nach 3 Sekunden Inaktivität
                if (autoSaveEnabled) {
                    clearTimeout(window.autoSaveTimer);
                    window.autoSaveTimer = setTimeout(function() {
                        saveContent(false);
                    }, 3000);
                }
            },
            onError: function(error) {
                console.error('❌ Summernote Fehler:', error);
            }
        }
    });
}

// ====================================================
// EDITOR FUNKTIONEN
// ====================================================

function updateWordCount(content) {
    try {
        const text = $(content).text();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;
        
        $('#word-count-number').text(wordCount);
        
        console.log('📊 Word Count Update: Wörter=', wordCount, 'Zeichen=', charCount);
    } catch (error) {
        console.error('❌ Fehler beim Word Count:', error);
    }
}

function saveContent(isManual = true) {
    if (!projectSlug) {
        console.error('❌ Keine Projekt-Slug zum Speichern!');
        return;
    }
    
    const content = $('#summernote-editor').summernote('code');
    console.log('💾 Speichere Content für Projekt:', projectSlug, 'Länge:', content.length);
    
    fetch('/api/textdocument/save-by-slug', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            project_slug: projectSlug,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            hasUnsavedChanges = false;
            const now = new Date().toLocaleTimeString();
            
            if ($('#save-status').length > 0) {
                $('#save-status').html(`<i class="fas fa-check text-success"></i> Gespeichert um ${now}`);
            }
            
            if (isManual) {
                showTempMessage('✅ Erfolgreich gespeichert!', 'success');
            }
            
            console.log('✅ Content erfolgreich gespeichert!');
        } else {
            console.error('❌ Speichern fehlgeschlagen:', data);
            showTempMessage('❌ Fehler beim Speichern!', 'danger');
        }
    })
    .catch(error => {
        console.error('❌ Speicher-Fehler:', error);
        showTempMessage('❌ Verbindungsfehler beim Speichern!', 'danger');
    });
}

// ====================================================
// TOOLBAR FUNKTIONEN (AUS MAIN.JS)
// ====================================================

function saveNow() {
    console.log('💾 Manuelles Speichern ausgelöst');
    saveContent(true); // true = manueller Save
}

function showWordCount() {
    const content = $('#summernote-editor').summernote('code');
    const text = $(content).text();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;
    
    showTempMessage(`📊 Statistik: ${wordCount} Wörter, ${charCount} Zeichen`, 'info');
}

function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    const status = autoSaveEnabled ? 'Ein' : 'Aus';
    
    $('#autosave-status').text(`Auto-Save: ${status}`);
    
    showTempMessage(`🤖 Auto-Save ${autoSaveEnabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
    
    console.log('🔄 Auto-Save Status:', autoSaveEnabled);
}

function saveAsNote() {
    if (!projectSlug) {
        showTempMessage('Keine Projekt-Slug gefunden', 'warning');
        return;
    }
    
    // Content aus Editor holen
    const content = $('#summernote-editor').summernote('code');
    const text = $(content).text();
    
    if (!text.trim()) {
        showTempMessage('Editor ist leer - nichts zu speichern', 'warning');
        return;
    }
    
    // Titel aus ersten Worten generieren (max 50 Zeichen)
    const firstLine = text.trim().split('\n')[0];
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
    
    console.log('📝 Speichere Editor-Inhalt als Notiz:', title);
    
    fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            content: content,
            project_slug: projectSlug
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success || data.id) {
            showTempMessage('✅ Als Notiz gespeichert: ' + title, 'success');
            console.log('✅ Notiz erstellt mit ID:', data.id);
            
            // Notes-Manager informieren (falls verfügbar)
            if (typeof window.loadNotes === 'function') {
                setTimeout(() => {
                    window.loadNotes();
                }, 300);
            }
            
        } else {
            showTempMessage('❌ Fehler beim Speichern: ' + (data.error || 'Unbekannter Fehler'), 'danger');
        }
    })
    .catch(error => {
        console.error('❌ Fehler beim Speichern als Notiz:', error);
        showTempMessage('❌ Verbindungsfehler beim Speichern', 'danger');
    });
}

// ====================================================
// LLM CHAT INITIALISIERUNG
// ====================================================

function initializeLLMChat() {
    console.log('🤖 LLM Chat wird initialisiert');
    
    const llmForm = document.getElementById('llm-form');
    if (llmForm) {
        llmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const input = document.getElementById('llm-input');
            const query = input.value.trim();
            
            if (query) {
                console.log('🤖 LLM Query:', query);
                // TODO: LLM-Integration implementieren
                showTempMessage('LLM-Integration noch nicht implementiert', 'info');
                input.value = '';
            }
        });
        
        console.log('✅ LLM Form Event-Listener hinzugefügt');
    }
}

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

window.saveNow = saveNow;
window.showWordCount = showWordCount;
window.toggleAutoSave = toggleAutoSave;
window.saveAsNote = saveAsNote;
window.initializeSummernoteEditor = initializeSummernoteEditor;
window.initializeLLMChat = initializeLLMChat;

// ====================================================
// INITIALIZATION
// ====================================================

$(document).ready(function() {
    console.log('📄 DOM ready - starte Workspace Initialisierung');
    
    // Kurz warten bis alle Scripts geladen sind
    setTimeout(function() {
        console.log('🔄 Starte verzögerte Initialisierung...');
        
        try {
            initializeSummernoteEditor();
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren des Editors:', error);
        }
        
        try {
            initializeLLMChat();
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren des LLM Chats:', error);
        }
        
        console.log('✅ Workspace Initialisierung abgeschlossen');
        
    }, 500);
    
    // Warnung vor ungespeicherten Änderungen
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Du hast ungespeicherte Änderungen. Wirklich verlassen?';
            return e.returnValue;
        }
    });
});

console.log('📝 Workspace.js geladen!');