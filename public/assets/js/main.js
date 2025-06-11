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
        // WICHTIG: Diese Einstellungen helfen bei P-Tags
        styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        defaultTextareaRows: 4,
        lineHeights: ['0.2', '0.3', '0.4', '0.5', '0.6', '0.8', '1.0', '1.2', '1.4', '1.5', '2.0', '3.0'],
        followingToolbar: false,
        
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
            },
            
            // WICHTIG: Beim Fokus P-Tag setzen falls leer
            onFocus: function() {
                const content = $('#summernote-editor').summernote('code');
                if (!content.trim() || content === '<br>' || content === '<div><br></div>') {
                    $('#summernote-editor').summernote('code', '<p><br></p>');
                }
            },
            
            // WICHTIG: Nach Eingabe P-Tag korrigieren
            onKeyup: function(e) {
                const content = $('#summernote-editor').summernote('code');
                
                // Wenn nur Text ohne Tags, in P-Tag wrappen
                if (content && !content.includes('<') && content.trim()) {
                    $('#summernote-editor').summernote('code', '<p>' + content + '</p>');
                }
                
                // Wenn nur BR-Tags, durch P ersetzen
                if (content === '<br>' || content === '<div><br></div>') {
                    $('#summernote-editor').summernote('code', '<p><br></p>');
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
    try {
        // Sicherer Weg, HTML zu Text zu konvertieren
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        $('#word-count-number').text(wordCount);
        
        console.log('📊 Wort-Count aktualisiert:', wordCount, 'für Text:', text.substring(0, 50));
    } catch (error) {
        console.error('❌ Fehler beim Wort-Count:', error);
        $('#word-count-number').text('?');
    }
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
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
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
// SCHNELLE PROJEKT-NOTIZEN (Sidebar)
// ====================================================

function saveQuickNote() {
    console.log('🟡 saveQuickNote() gestartet');
    
    const noteText = $('#quick-note-input').val().trim();
    console.log('📝 Notiz-Text:', noteText);
    
    if (!noteText) {
        console.log('❌ Kein Text eingegeben');
        showTempMessage('Bitte Text eingeben', 'warning');
        return;
    }
    
    const title = noteText.length > 30 ? noteText.substring(0, 30) + '...' : noteText;
    console.log('📋 Notiz-Titel:', title);
    console.log('🆔 Projekt-ID:', projectId);
    
    const requestData = {
        title: title,
        content: noteText,
        project_id: parseInt(projectId)
    };
    console.log('📤 Sende an API:', requestData);
    
    fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('📥 API Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📥 API Response Data:', data);
        if (data.id) {
            $('#quick-note-input').val(''); // Leeren
            showTempMessage('Notiz gespeichert!', 'success');
            console.log('✅ Schnelle Notiz erfolgreich gespeichert, ID:', data.id);
            
            // WICHTIG: Notiz zu allNotes hinzufügen, falls Modal offen ist
            if (allNotes && Array.isArray(allNotes)) {
                allNotes.push(data);
                console.log('📋 Notiz zu allNotes hinzugefügt');
                
                // Falls Modal offen ist, Liste aktualisieren
                if ($('#notesModal').hasClass('show')) {
                    console.log('🔄 Modal ist offen - Liste wird aktualisiert');
                    renderNotesList();
                }
            }
        } else {
            showTempMessage('Fehler beim Speichern', 'danger');
            console.log('❌ Fehler: Keine ID in Response');
        }
    })
    .catch(error => {
        console.log('❌ Fetch-Fehler:', error);
        showTempMessage('Fehler: ' + error.message, 'danger');
    });
}

function saveAsNote() {
    console.log('🟡 saveAsNote() gestartet');
    
    const editorContent = $('#summernote-editor').summernote('code');
    console.log('📝 Editor-Inhalt (HTML):', editorContent);
    
    // Sicherer Text-Extraktor
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const textContent = (tempDiv.textContent || tempDiv.innerText || '').trim();
    console.log('📝 Editor-Inhalt (Text):', textContent);
    
    if (!textContent) {
        console.log('❌ Editor ist leer');
        showTempMessage('Editor ist leer - nichts zu speichern', 'warning');
        return;
    }
    
    const title = prompt('Titel für die Notiz:', 'Notiz vom ' + new Date().toLocaleDateString());
    if (!title) {
        console.log('❌ Kein Titel eingegeben');
        return;
    }
    
    console.log('📋 Notiz-Titel:', title);
    console.log('🆔 Projekt-ID:', projectId);
    
    const requestData = {
        title: title.trim(),
        content: editorContent,
        project_id: parseInt(projectId)
    };
    console.log('📤 Sende an API:', requestData);
    
    fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('📥 API Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📥 API Response Data:', data);
        if (data.id) {
            showTempMessage('Editor-Inhalt als Notiz "' + title + '" gespeichert!', 'success');
            console.log('✅ Editor-Notiz erfolgreich gespeichert, ID:', data.id);
            
            // WICHTIG: Notiz zu allNotes hinzufügen, falls Modal offen ist
            if (allNotes && Array.isArray(allNotes)) {
                allNotes.push(data);
                console.log('📋 Notiz zu allNotes hinzugefügt');
                
                // Falls Modal offen ist, Liste aktualisieren
                if ($('#notesModal').hasClass('show')) {
                    console.log('🔄 Modal ist offen - Liste wird aktualisiert');
                    renderNotesList();
                }
            }
        } else {
            showTempMessage('Fehler beim Speichern', 'danger');
            console.log('❌ Fehler: Keine ID in Response');
        }
    })
    .catch(error => {
        console.log('❌ Fetch-Fehler:', error);
        showTempMessage('Fehler: ' + error.message, 'danger');
    });
}

// ====================================================
// NOTIZEN MANAGEMENT
// ====================================================

async function loadNotes() {
    console.log('🟡 loadNotes() gestartet');
    console.log('🆔 Projekt-ID:', projectId);
    
    if (!projectId) {
        console.error('❌ Keine Projekt-ID für Notizen-Load');
        return;
    }
    
    try {
        console.log('📤 Lade Notizen von:', '/api/notes/' + projectId);
        const response = await fetch('/api/notes/' + projectId);
        console.log('📥 Response Status:', response.status);
        
        if (response.ok) {
            allNotes = await response.json();
            console.log('✅ Notizen geladen:', allNotes);
            console.log('📊 Anzahl Notizen:', allNotes.length);
            renderNotesList();
        } else {
            console.error('❌ Fehler beim Laden der Notizen, Status:', response.status);
            showEmptyNotesState();
        }
    } catch (error) {
        console.error('❌ Fetch-Fehler beim Laden der Notizen:', error);
        showEmptyNotesState();
    }
}

function renderNotesList() {
    const grid = $('#items-grid');
    
    // Aktuelle Notizen/Ordner für den aktuellen Ordner filtern
    const currentNotes = allNotes.filter(note => {
        // Notizen ohne parentId sind Top-Level
        return note.parentId === currentFolderId;
    });
    
    console.log('Rendering Notizen für Ordner:', currentFolderId, 'Gefunden:', currentNotes.length);
    
    if (currentNotes.length === 0) {
        showEmptyNotesState();
        return;
    }
    
    let html = '';
    
    currentNotes.forEach(note => {
        const createdDate = new Date(note.created_at || Date.now()).toLocaleDateString('de-DE');
        
        html += `
            <div class="col-md-3 col-sm-4 col-6">
                <div class="card h-100 note-card" onclick="openNote(${note.id})">
                    <div class="card-body text-center p-3">
                        <i class="fas fa-sticky-note fa-2x text-info mb-2"></i>
                        <h6 class="card-title small">${escapeHtml(note.title)}</h6>
                        <small class="text-muted">${createdDate}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.html(html);
    $('#empty-folder').hide();
    $('#notes-content').show();
}

function showEmptyNotesState() {
    $('#items-grid').html('');
    $('#empty-folder').show();
    $('#notes-content').show();
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
                project_id: parseInt(projectId),
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
    console.log('🟡 openNote() gestartet für ID:', noteId);
    
    try {
        const response = await fetch('/api/notes/' + noteId);
        console.log('📥 Response Status:', response.status);
        
        if (response.ok) {
            const note = await response.json();
            console.log('📋 Geladene Notiz:', note);
            
            // Notizen-Liste verstecken, Editor anzeigen
            $('#notes-content').hide();
            $('#note-editor-section').show();
            
            // Notiz-Daten in Editor laden
            $('#current-note-title').text(note.title);
            $('#note-title-input').val(note.title);
            
            // WICHTIG: Content richtig anzeigen
            const content = note.content || '';
            $('#note-content').val(content);
            console.log('📝 Content gesetzt:', content.substring(0, 100) + '...');
            
            // Aktuelle Notiz-ID speichern
            currentNoteId = noteId;
            console.log('✅ Notiz erfolgreich geöffnet');
            
        } else {
            console.error('❌ Fehler beim Laden, Status:', response.status);
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
    console.log('🟡 openNotesModal() gestartet');
    currentFolderId = null; // Start bei Top-Level
    console.log('📁 Aktueller Ordner-ID:', currentFolderId);
    loadNotes(); // Echte Notizen aus DB laden
    $('#notesModal').modal('show');
    console.log('📋 Modal geöffnet');
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
window.saveAsNote = saveAsNote;
window.saveQuickNote = saveQuickNote;
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