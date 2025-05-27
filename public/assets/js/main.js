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
    // Projekt-Daten aus HTML extrahieren
    const editorContainer = document.querySelector('#summernote-editor');
    if (editorContainer) {
        projectId = editorContainer.dataset.projectId;
        documentId = editorContainer.dataset.documentId;
    }

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
            }
        }
    });

    // Initialer Wort-Count
    updateWordCount($('#summernote-editor').summernote('code'));
}

// ====================================================
// EDITOR FUNKTIONEN
// ====================================================

function updateWordCount(content) {
    const text = $(content).text();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    $('#word-count-number').text(wordCount);
}

function saveContent(isManual = true) {
    const content = $('#summernote-editor').summernote('code');
    
    if (!projectId) {
        console.error('Keine Projekt-ID gefunden');
        return;
    }
    
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
        $('#save-status').html(`<i class="fas fa-times text-danger"></i> Speichern fehlgeschlagen`);
        if (isManual) {
            showTempMessage('Speichern fehlgeschlagen: ' + error.message, 'danger');
        }
    });
}

function saveNow() {
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
// LLM CHAT FUNKTIONEN
// ====================================================

function initializeLLMChat() {
    $('#llm-form').on('submit', function(e) {
        e.preventDefault();
        
        const prompt = $('#llm-input').val().trim();
        if (!prompt) return;
        
        $('#llm-response').html('<i class="fas fa-spinner fa-spin"></i> Der KI-Assistent denkt nach...');
        
        // LLM-API aufrufen
        fetch('/api/llm/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        })
        .then(response => response.json())
        .then(data => {
            if (data.response) {
                $('#llm-response').html(data.response);
                
                // Optional: Antwort in Editor einfügen
                if ($('#insert-to-editor').is(':checked')) {
                    const formattedResponse = '<p><em>KI-Antwort:</em></p><blockquote>' + data.response + '</blockquote>';
                    $('#summernote-editor').summernote('pasteHTML', formattedResponse);
                }
                
                $('#llm-input').val(''); // Input leeren
            } else {
                $('#llm-response').html('<div class="text-danger">Fehler: ' + (data.error || 'Unbekannter Fehler') + '</div>');
            }
        })
        .catch(error => {
            $('#llm-response').html('<div class="text-danger">Verbindungsfehler: ' + error.message + '</div>');
        });
    });
}

// ====================================================
// NOTIZEN MANAGEMENT
// ====================================================

async function loadNotes() {
    if (!projectId) {
        console.error('Keine Projekt-ID für Notizen-Load');
        return;
    }
    
    try {
        const response = await fetch('/api/notes/' + projectId);
        if (response.ok) {
            allNotes = await response.json();
            console.log('Notizen geladen:', allNotes);
            renderNotesList();
        } else {
            console.error('Fehler beim Laden der Notizen:', response.status);
            showEmptyState();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Notizen:', error);
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
            headers: {
                'Content-Type': 'application/json'
            },
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
    try {
        const response = await fetch('/api/notes/' + noteId);
        if (response.ok) {
            const note = await response.json();
            
            // Notizen-Liste verstecken, Editor anzeigen
            $('#notes-content').hide();
            $('#note-editor-section').show();
            
            // Notiz-Daten in Editor laden
            $('#current-note-title').text(note.title);
            $('#note-title-input').val(note.title);
            $('#note-content').val(note.content || '');
            
            // Aktuelle Notiz-ID speichern
            currentNoteId = noteId;
            
        } else {
            showTempMessage('Fehler beim Laden der Notiz', 'danger');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Notiz:', error);
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
            headers: {
                'Content-Type': 'application/json'
            },
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
    
    // Summernote Editor initialisieren
    initializeSummernoteEditor();
    
    // LLM Chat initialisieren
    initializeLLMChat();
    
    // Project ID aus Dataset extrahieren (falls nicht schon gemacht)
    if (!projectId) {
        const workspaceElement = document.querySelector('[data-project-id]');
        if (workspaceElement) {
            projectId = workspaceElement.dataset.projectId;
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