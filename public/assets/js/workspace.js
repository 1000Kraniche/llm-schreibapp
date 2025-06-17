// ====================================================
// WORKSPACE.JS - API ROUTE FIX + AUTO-SAVE COLORS
// ====================================================

console.log('📝 Workspace.js wird geladen...');

// Globale Variablen
let editor = null;
let hasUnsavedChanges = false;
let autoSaveEnabled = true;
let autoSaveTimer = null;
let projectSlug = null;
let wordCountUpdateTimer = null;

// ====================================================
// EDITOR INITIALISIERUNG
// ====================================================

function initializeSummernoteEditor() {
    console.log('🔧 Initialisiere Summernote Editor...');
    
    // Project Slug extrahieren
    const workspaceElement = document.querySelector('[data-project-slug]');
    if (workspaceElement) {
        projectSlug = workspaceElement.dataset.projectSlug;
        console.log('📊 Project Slug gefunden:', projectSlug);
    } else {
        console.error('❌ Kein data-project-slug gefunden!');
    }
    
    // Auto-Save Button initial korrekt setzen
    updateAutoSaveButtonColors();
    
    // Summernote initialisieren
    $('#summernote-editor').summernote({
        height: 500,
        minHeight: 400,
        maxHeight: 800,
        placeholder: 'Beginne hier zu schreiben...',
        lang: 'de-DE',
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['forecolor', 'backcolor']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        callbacks: {
            onChange: function(contents, $editable) {
                handleContentChange(contents);
            },
            onInit: function() {
                console.log('✅ Summernote Editor initialisiert');
                // Erste Wort-Zählung
                updateWordCount();
            }
        }
    });
    
    // Editor-Referenz speichern
    editor = $('#summernote-editor');
    
    console.log('✅ Editor initialisiert');
}

// ====================================================
// CONTENT CHANGE HANDLING
// ====================================================

function handleContentChange(contents) {
    hasUnsavedChanges = true;
    updateSaveStatus('Ungespeichert');
    
    // Wort-Zählung mit Debounce
    if (wordCountUpdateTimer) {
        clearTimeout(wordCountUpdateTimer);
    }
    wordCountUpdateTimer = setTimeout(() => {
        updateWordCount();
    }, 500);
    
    // Auto-Save
    if (autoSaveEnabled) {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        autoSaveTimer = setTimeout(() => {
            saveNow();
        }, 3000); // Auto-Save nach 3 Sekunden
    }
}

// ====================================================
// SPEICHER-FUNKTIONEN (API-FIX!)
// ====================================================

async function saveNow() {
    if (!editor || !projectSlug) {
        console.error('❌ Editor oder Project Slug nicht verfügbar');
        return;
    }
    
    const content = editor.summernote('code');
    console.log('💾 Speichere Dokument...', content.length, 'Zeichen');
    
    try {
        // BEHOBEN: Richtige API-Route verwenden!
        const response = await fetch('/api/textdocument/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: content,
                project_slug: projectSlug  // Project Slug mitschicken
            })
        });
        
        if (response.ok) {
            hasUnsavedChanges = false;
            updateSaveStatus('Gespeichert');
            showTempMessage('✅ Dokument gespeichert', 'success');
            console.log('✅ Dokument erfolgreich gespeichert');
        } else {
            const error = await response.json();
            showTempMessage('❌ Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
            console.error('❌ Speicher-Fehler:', error);
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('❌ Verbindungsfehler beim Speichern', 'danger');
    }
}

function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    
    // Button-Farben und Text aktualisieren
    updateAutoSaveButtonColors();
    
    const message = autoSaveEnabled ? '✅ Auto-Save aktiviert' : '⚠️ Auto-Save deaktiviert';
    showTempMessage(message, autoSaveEnabled ? 'success' : 'warning');
    
    console.log('🤖 Auto-Save:', autoSaveEnabled ? 'aktiviert' : 'deaktiviert');
}

// ====================================================
// UI UPDATE FUNKTIONEN
// ====================================================

function updateAutoSaveButtonColors() {
    const autoSaveButton = document.querySelector('button[onclick="toggleAutoSave()"]');
    const statusElement = document.getElementById('autosave-status');
    
    if (autoSaveButton && statusElement) {
        if (autoSaveEnabled) {
            // Auto-Save AN -> Primary (blau)
            autoSaveButton.className = 'btn btn-primary btn-sm';
            statusElement.textContent = 'Auto-Save: Ein';
        } else {
            // Auto-Save AUS -> Warning (orange/gelb)
            autoSaveButton.className = 'btn btn-warning btn-sm';
            statusElement.textContent = 'Auto-Save: Aus';
        }
    }
}

function updateSaveStatus(status) {
    const saveTimeElement = document.getElementById('editor-save-time');
    if (saveTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (status === 'Gespeichert') {
            saveTimeElement.textContent = `Gespeichert um ${timeString}`;
            saveTimeElement.className = 'text-success';
        } else {
            saveTimeElement.textContent = status;
            saveTimeElement.className = 'text-warning';
        }
    }
}

function updateWordCount() {
    if (!editor) return;
    
    const content = editor.summernote('code');
    const textContent = content.replace(/<[^>]*>/g, ''); // HTML-Tags entfernen
    const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length;
    
    const wordCountElement = document.getElementById('word-count-number');
    if (wordCountElement) {
        wordCountElement.textContent = wordCount.toLocaleString('de-DE');
    }
}

function showWordCount() {
    updateWordCount();
    const wordCountElement = document.getElementById('word-count-number');
    if (wordCountElement) {
        const count = wordCountElement.textContent;
        showTempMessage(`📊 Aktuell: ${count} Wörter`, 'info');
    }
}

// ====================================================
// HILFSFUNKTIONEN
// ====================================================

function showTempMessage(message, type = 'info') {
    // Prüfen ob bereits eine Nachricht existiert
    let alertContainer = document.getElementById('temp-alert-container');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'temp-alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        alertContainer.style.minWidth = '300px';
        document.body.appendChild(alertContainer);
    }
    
    // Neue Alert erstellen
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-Hide nach 3 Sekunden
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 150);
        }
    }, 3000);
}

function openNotesModal() {
    const notesModal = new bootstrap.Modal(document.getElementById('notesModal'));
    notesModal.show();
}

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

window.saveNow = saveNow;
window.showWordCount = showWordCount;
window.toggleAutoSave = toggleAutoSave;
window.openNotesModal = openNotesModal;
window.initializeSummernoteEditor = initializeSummernoteEditor;

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