// ====================================================
// WORKSPACE MAIN.JS - Komplette LLM Schreibapp Logic
// ====================================================

// Globale Variablen
let editor = null;
let projectId = null;
let documentId = null;
let autoSaveEnabled = true;
let hasUnsavedChanges = false;
let allNotes = [];
let currentFolderId = null;
let currentNoteId = null;

// ====================================================
// SUMMERNOTE EDITOR SETUP
// ====================================================

function initializeSummernoteEditor() {
    console.log('🟡 initializeSummernoteEditor() gestartet');
    
    // Projekt-Daten aus HTML extrahieren
    const editorContainer = document.querySelector('#summernote-editor');
    if (editorContainer) {
        projectId = editorContainer.dataset.projectId;
        documentId = editorContainer.dataset.documentId;
        console.log('📊 Daten extrahiert: projectId=', projectId, 'documentId=', documentId);
    }

    // Prüfen ob Summernote verfügbar ist
    if (typeof $.fn.summernote === 'undefined') {
        console.error('❌ Summernote ist nicht verfügbar!');
        return;
    }

    console.log('✅ Summernote ist verfügbar, initialisiere Editor...');

    // Summernote initialisieren
    $('#summernote-editor').summernote({
        height: 500,
        lang: 'de-DE',
        focus: true,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'hr']],
            ['view', ['fullscreen', 'codeview']]
        ],
        callbacks: {
            onInit: function() {
                console.log('✅ Summernote Editor erfolgreich initialisiert!');
            },
            onChange: function(contents, $editable) {
                hasUnsavedChanges = true;
                updateWordCount(contents);
                
                // Auto-Save nach 3 Sekunden Inaktivität
                if (autoSaveEnabled) {
                    clearTimeout(window.autoSaveTimer);
                    window.autoSaveTimer = setTimeout(function() {
                        saveContent(false); // false = kein manueller Save
                    }, 3000);
                }
            },
            onError: function(error) {
                console.error('❌ Summernote Fehler:', error);
            }
        }
    });

    // Initialer Wort-Count
    const initialContent = $('#summernote-editor').summernote('code');
    updateWordCount(initialContent);
    console.log('📝 Editor initialisiert mit Content-Länge:', initialContent.length);
}

// ====================================================
// EDITOR FUNKTIONEN
// ====================================================

function updateWordCount(content) {
    try {
        const text = $(content).text();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        $('#word-count-number').text(wordCount);
    } catch (error) {
        console.error('Fehler beim Word Count:', error);
    }
}

function saveContent(isManual = true) {
    const content = $('#summernote-editor').summernote('code');
    
    if (!projectId) {
        console.error('Keine Projekt-ID gefunden');
        return;
    }
    
    console.log('💾 Speichere Content für Projekt:', projectId);
    
    fetch('/api/textdocument/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_id: projectId,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            hasUnsavedChanges = false;
            const now = new Date().toLocaleTimeString();
            $('#save-status').html(`<i class="fas fa-check text-success"></i> Gespeichert um ${now}`);
            
            if (isManual) {
                showTempMessage('Erfolgreich gespeichert!', 'success');
            }
        } else {
            $('#save-status').html(`<i class="fas fa-exclamation-triangle text-warning"></i> Fehler beim Speichern`);
            if (isManual) {
                showTempMessage('Fehler beim Speichern!', 'danger');
            }
        }
    })
    .catch(error => {
        console.error('Save Error:', error);
        $('#save-status').html(`<i class="fas fa-times text-danger"></i> Speichern fehlgeschlagen`);
        if (isManual) {
            showTempMessage('Speichern fehlgeschlagen: ' + error.message, 'danger');
        }
    });
}

function saveNow() {
    console.log('💾 Manuelles Speichern gestartet');
    saveContent(true);
}

function showWordCount() {
    const content = $('#summernote-editor').summernote('code');
    const text = $(content).text();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;
    
    showTempMessage(`Wörter: ${wordCount} | Zeichen: ${charCount}`, 'info');
}

function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    const status = autoSaveEnabled ? 'Ein' : 'Aus';
    
    $('#autosave-status').html(`Auto-Save: ${status}`);
    showTempMessage(`Auto-Save ist jetzt ${status.toLowerCase()}`, 'info');
}

// ====================================================
// LLM CHAT FUNKTIONEN - KORREKT ZUSAMMENGEFÜGT
// ====================================================

function initializeLLMChat() {
    console.log('🤖 LLM Chat wird initialisiert');
    
    // Enter-Taste Support für das Textarea
    $('#llm-input').on('keydown', function(e) {
        console.log('🔍 Taste gedrückt:', e.key, 'Shift:', e.shiftKey);
        // Enter ohne Shift = Submit
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Verhindert Zeilenumbruch
            console.log('✅ Enter gedrückt - sende Formular');
            $('#llm-form').submit(); // Sendet das Formular
        }
        // Shift+Enter = neue Zeile (normales Verhalten)
    });

    // Form Submit Handler
    $('#llm-form').on('submit', function(e) {
        e.preventDefault();
        
        const prompt = $('#llm-input').val().trim();
        if (!prompt) return;
        
        console.log('🤖 LLM Anfrage:', prompt.substring(0, 50) + '...');
        
        // Projekt-ID aus dem Data-Attribut holen
        const projectId = $('[data-project-id]').data('project-id');
        
        $('#llm-response').html(`
            <div class="d-flex align-items-center">
                <i class="fas fa-spinner fa-spin me-2"></i> 
                <span>Der KI-Assistent analysiert dein Projekt und denkt nach...</span>
            </div>
        `);
        
        // LLM-API mit Projekt-Kontext aufrufen
        fetch('/api/llm/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                project_id: projectId  // <- NEU: Projekt-ID mitsenden
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ LLM Antwort erhalten');
            if (data.response) {
                // Schönere Antwort-Darstellung
                $('#llm-response').html(`
                    <div class="llm-answer">
                        <small class="text-muted">
                            <i class="fas fa-robot"></i> KI-Assistent (mit Projekt-Kontext):
                        </small>
                        <div class="mt-2">${formatLLMResponse(data.response)}</div>
                    </div>
                `);
                
                // Optional: Antwort in Editor einfügen
                if ($('#insert-to-editor').is(':checked')) {
                    const formattedResponse = `
                        <blockquote class="llm-suggestion">
                            <small><i class="fas fa-robot"></i> KI-Vorschlag:</small><br>
                            ${data.response}
                        </blockquote>
                    `;
                    $('#summernote-editor').summernote('pasteHTML', formattedResponse);
                }
                
                $('#llm-input').val(''); // Input leeren
                
                // Success-Feedback
                showTempMessage('KI-Assistent hat mit Projekt-Kontext geantwortet!', 'success');
                
            } else {
                $('#llm-response').html(`
                    <div class="text-danger">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Fehler: ${data.error || 'Unbekannter Fehler'}
                    </div>
                `);
            }
        })
        .catch(error => {
            console.log('❌ LLM Verbindungsfehler:', error);
            $('#llm-response').html(`
                <div class="text-danger">
                    <i class="fas fa-wifi"></i> 
                    Verbindungsfehler: ${error.message}
                </div>
            `);
        });
    });
}

// Hilfsfunktion für schönere LLM-Antworten
function formatLLMResponse(response) {
    // Einfache Formatierung: Zeilenumbrüche zu <br>
    return response
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.*)$/, '<p>$1</p>');
}

// Quick-Prompt Buttons hinzufügen
function addQuickPrompts() {
    const quickPrompts = [
        "Hilf mir beim Weiterschreiben",
        "Fasse den bisherigen Text zusammen", 
        "Welche Ideen hast du für dieses Projekt?",
        "Verbessere meinen letzten Absatz",
        "Erstelle eine Gliederung basierend auf meinen Notizen"
    ];
    
    let buttonsHtml = '<div class="quick-prompts mb-2">';
    quickPrompts.forEach(prompt => {
        buttonsHtml += `
            <button type="button" class="btn btn-outline-primary btn-sm me-1 mb-1" 
                    onclick="useQuickPrompt('${prompt}')">
                ${prompt}
            </button>
        `;
    });
    buttonsHtml += '</div>';
    
    $('#llm-form').prepend(buttonsHtml);
}

function useQuickPrompt(prompt) {
    $('#llm-input').val(prompt);
    $('#llm-form').submit();
}

// ====================================================
// NOTIZEN MANAGEMENT 
// ====================================================

async function loadNotes() {
    if (!projectId) {
        console.error('Keine Projekt-ID für Notizen-Load');
        return;
    }
    
    console.log('📝 Lade Notizen für Projekt:', projectId);
    
    try {
        const response = await fetch('/api/notes/' + projectId);
        if (response.ok) {
            allNotes = await response.json();
            console.log('✅ Notizen geladen:', allNotes.length, 'Stück');
            renderNotesList();
        } else {
            console.error('❌ Fehler beim Laden der Notizen:', response.status);
            showEmptyState();
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notizen:', error);
        showEmptyState();
    }
}

function renderNotesList() {
    const grid = $('#items-grid');
    const currentNotes = allNotes.filter(note => note.parentId === currentFolderId);
    
    if (currentNotes.length === 0) {
        showEmptyState();
        return;
    }
    
    let html = '';
    
    currentNotes.forEach(note => {
        if (note.type === 'folder') {
            html += `
                <div class="col-md-3 col-sm-4 col-6">
                    <div class="card h-100 folder-card" onclick="navigateToFolder(${note.id})">
                        <div class="card-body text-center p-3">
                            <i class="fas fa-folder fa-2x text-warning mb-2"></i>
                            <h6 class="card-title small">${escapeHtml(note.title)}</h6>
                            <small class="text-muted">Ordner</small>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="col-md-3 col-sm-4 col-6">
                    <div class="card h-100 note-card" onclick="openNote(${note.id})">
                        <div class="card-body text-center p-3">
                            <i class="fas fa-sticky-note fa-2x text-info mb-2"></i>
                            <h6 class="card-title small">${escapeHtml(note.title)}</h6>
                            <small class="text-muted">Notiz</small>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    grid.html(html);
    $('#empty-folder').hide();
}

function showEmptyState() {
    $('#items-grid').html('');
    $('#empty-folder').show();
}

async function createNewNote() {
    const title = prompt('Notiz-Titel:', 'Neue Notiz');
    if (!title || !title.trim()) return;
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                project_id: projectId,
                parent_id: currentFolderId
            })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            allNotes.push(newNote);
            renderNotesList();
            showTempMessage('Notiz "' + title + '" erstellt!', 'success');
            
            // Notiz direkt öffnen
            openNote(newNote.id);
        } else {
            const error = await response.json();
            showTempMessage('Fehler: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('Fehler beim Erstellen der Notiz:', error);
        showTempMessage('Fehler beim Erstellen der Notiz: ' + error.message, 'danger');
    }
}

async function openNote(noteId) {
    console.log('📖 openNote() gestartet für ID:', noteId);
    
    try {
        const response = await fetch('/api/notes/' + noteId);
        console.log('📥 Response Status:', response.status);
        
        if (response.ok) {
            const note = await response.json();
            console.log('📄 Notiz geladen:', note);
            
            // Notizen-Liste verstecken, Editor anzeigen
            $('#notes-content').hide();
            $('#note-editor-section').show();
            
            // Notiz-Daten in Editor laden
            $('#current-note-title').text(note.title);
            $('#note-title-input').val(note.title);
            $('#note-content').val(note.content || '');
            
            // Aktuelle Notiz-ID speichern
            currentNoteId = noteId;
            
            console.log('✅ Notiz erfolgreich in Editor geladen');
            
        } else {
            console.error('❌ Fehler beim Laden der Notiz:', response.status);
            showTempMessage('Fehler beim Laden der Notiz', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz:', error);
        showTempMessage('Fehler beim Laden der Notiz: ' + error.message, 'danger');
    }
}

async function saveCurrentNote() {
    if (!currentNoteId) {
        showTempMessage('Keine Notiz geöffnet', 'warning');
        return;
    }
    
    const title = $('#note-title-input').val().trim();
    const content = $('#note-content').val();
    
    if (!title) {
        showTempMessage('Titel ist erforderlich', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/notes/' + currentNoteId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            
            // Notiz in der Liste aktualisieren
            const noteIndex = allNotes.findIndex(n => n.id === currentNoteId);
            if (noteIndex !== -1) {
                allNotes[noteIndex] = updatedNote;
            }
            
            $('#current-note-title').text(title);
            showTempMessage('Notiz gespeichert!', 'success');
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
    }
}

function closeNoteEditor() {
    $('#note-editor-section').hide();
    $('#notes-content').show();
    currentNoteId = null;
    renderNotesList(); // Liste aktualisieren falls Titel geändert wurde
}

function openNotesModal() {
    loadNotes(); // Echte Notizen aus DB laden
    $('#notesModal').modal('show');
}

// ====================================================
// HILFSFUNKTIONEN
// ====================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTempMessage(message, type) {
    const alertClass = `alert-${type}`;
    const alertHtml = `<div class="alert ${alertClass} alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    
    $('body').append(alertHtml);
    
    setTimeout(function() {
        $('.alert').fadeOut();
    }, 3000);
}

// ====================================================
// GLOBALE FUNKTIONEN (für onclick in HTML)
// ====================================================

// Diese Funktionen müssen global verfügbar sein für HTML onclick
window.saveNow = saveNow;
window.showWordCount = showWordCount;
window.toggleAutoSave = toggleAutoSave;
window.createNewNote = createNewNote;
window.openNote = openNote;
window.saveCurrentNote = saveCurrentNote;
window.closeNoteEditor = closeNoteEditor;
window.openNotesModal = openNotesModal;

// ====================================================
// INITIALIZATION
// ====================================================

$(document).ready(function() {
    console.log('🚀 Workspace Main.js wird geladen...');
    
    // Prüfen ob jQuery verfügbar ist
    if (typeof $ === 'undefined') {
        console.error('❌ jQuery ist nicht verfügbar!');
        return;
    }
    console.log('✅ jQuery verfügbar');
    
    // Summernote Editor initialisieren
    try {
        initializeSummernoteEditor();
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren des Editors:', error);
    }
    
    // LLM Chat initialisieren
    try {
        initializeLLMChat();
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren des LLM Chats:', error);
    }
    
    // Project ID aus Dataset extrahieren (falls nicht schon gemacht)
    if (!projectId) {
        const workspaceElement = document.querySelector('[data-project-slug]');
if (workspaceElement) {
    projectId = workspaceElement.dataset.projectSlug;
            console.log('📊 Project ID aus DOM extrahiert:', projectId);
        }
    }
    
    console.log('✅ Workspace initialisiert für Projekt:', projectId);
    
    // Warnung vor ungespeicherten Änderungen
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Du hast ungespeicherte Änderungen. Wirklich verlassen?';
            return e.returnValue;
        }
    });
});

console.log('📝 LLM Schreibapp Main.js geladen!');