// ====================================================
// WORKSPACE.JS - Nur für den Editor-Workspace
// ====================================================

console.log('🚀 Workspace.js wird geladen...');

// Globale Variablen
let projectId = null;
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
        setTimeout(initializeSummernoteEditor, 100); // Retry nach 100ms
        return;
    }
    
    console.log('✅ jQuery und Summernote verfügbar');
    
    // Projekt-Daten aus HTML extrahieren
    const mainElement = document.querySelector('[data-project-id]');
    if (mainElement) {
        projectId = mainElement.dataset.projectId;
        console.log('📊 Project ID gefunden:', projectId);
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
    if (!projectId) {
        console.error('❌ Keine Projekt-ID zum Speichern!');
        return;
    }
    
    const content = $('#summernote-editor').summernote('code');
    console.log('💾 Speichere Content für Projekt:', projectId, 'Länge:', content.length);
    
    // Hier würde normalerweise der API-Call stehen
    // Für jetzt simulieren wir das Speichern
    setTimeout(() => {
        hasUnsavedChanges = false;
        const now = new Date().toLocaleTimeString();
        
        if ($('#save-status').length > 0) {
            $('#save-status').html(`<i class="fas fa-check text-success"></i> Gespeichert um ${now}`);
        }
        
        if (isManual) {
            showTempMessage('Erfolgreich gespeichert!', 'success');
        }
        
        console.log('✅ Content gespeichert (simuliert)');
    }, 500);
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
    
    if ($('#autosave-status').length > 0) {
        $('#autosave-status').html(`Auto-Save: ${status}`);
    }
    
    showTempMessage(`Auto-Save ist jetzt ${status.toLowerCase()}`, 'info');
    console.log('🔄 Auto-Save Status:', status);
}

function saveAsNote() {
    if (!projectId) {
        showTempMessage('Keine Projekt-ID gefunden', 'warning');
        return;
    }
    
    const content = $('#summernote-editor').summernote('code');
    if (!content || content.trim() === '' || content === '<p><br></p>') {
        showTempMessage('Kein Inhalt zum Speichern vorhanden', 'warning');
        return;
    }
    
    // Besserer Titel-Dialog mit Vorschau
    const textContent = $(content).text();
    const firstLine = textContent.split('\n')[0];
    const suggestedTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
    
    // Zeige Dialog mit Inhalt-Vorschau
    const previewText = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    const confirmMessage = `Editor-Inhalt als Notiz speichern?\n\nVorschau: "${previewText}"\n\nGib einen Titel ein:`;
    
    const title = prompt(confirmMessage, suggestedTitle || 'Editor-Inhalt vom ' + new Date().toLocaleDateString());
    
    if (!title || !title.trim()) {
        return;
    }
    
    console.log('📝 Speichere Editor-Inhalt als Notiz:', title);
    
    // API-Call zum Erstellen der Notiz
    fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title.trim(),
            content: content,
            project_id: projectId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            showTempMessage('✅ Editor-Inhalt als Notiz "' + title + '" gespeichert!', 'success');
            console.log('✅ Notiz erstellt mit ID:', data.id);
            
            // Sidebar-Notizen SOFORT aktualisieren
            if (typeof allNotes !== 'undefined' && typeof loadSidebarNotes === 'function') {
                console.log('🔄 Aktualisiere Notizen-Listen...');
                
                // Neue Notiz zu allNotes hinzufügen
                if (typeof allNotes !== 'undefined') {
                    allNotes.unshift(data); // Am Anfang hinzufügen
                }
                
                // Sidebar sofort neu laden
                loadSidebarNotes();
                
                // Optional: Auch vollständigen Reload für Modal
                setTimeout(() => {
                    if (typeof loadNotes === 'function') {
                        loadNotes();
                    }
                }, 300);
            }
            
            // Alternative: Sidebar direkt aktualisieren ohne vollständigen Reload
            updateSidebarAfterSave(data);
            
        } else {
            showTempMessage('❌ Fehler beim Speichern: ' + (data.error || 'Unbekannter Fehler'), 'danger');
        }
    })
    .catch(error => {
        console.error('❌ Fehler beim Speichern als Notiz:', error);
        showTempMessage('❌ Verbindungsfehler beim Speichern', 'danger');
    });
}

function updateSidebarAfterSave(newNote) {
    console.log('🔄 Aktualisiere Sidebar direkt mit neuer Notiz:', newNote.title);
    
    const sidebarContainer = $('#sidebar-notes-list');
    if (sidebarContainer.length === 0) {
        console.log('⚠️ Sidebar-Container nicht gefunden');
        return;
    }
    
    // Neue Notiz an den Anfang der Liste setzen
    const newNoteHtml = `
        <li class="mb-2">
            <a href="#" onclick="openNoteDirectFromSidebar(${newNote.id})" class="text-decoration-none">
                <i class="fas fa-sticky-note text-success me-1"></i>
                <small><strong>${escapeHtml(newNote.title)}</strong> <span class="text-muted">(neu)</span></small>
            </a>
        </li>
    `;
    
    // Prüfe ob bereits eine Liste existiert
    const existingList = sidebarContainer.find('ul');
    if (existingList.length > 0) {
        // Füge am Anfang der bestehenden Liste hinzu
        existingList.prepend(newNoteHtml);
        
        // Begrenze auf maximal 5 Einträge
        const listItems = existingList.find('li');
        if (listItems.length > 5) {
            listItems.last().remove();
        }
    } else {
        // Erstelle neue Liste
        const newListHtml = `<ul class="list-unstyled">${newNoteHtml}</ul>`;
        sidebarContainer.html(newListHtml);
    }
    
    console.log('✅ Sidebar direkt aktualisiert');
}

// ====================================================
// LLM CHAT FUNKTIONEN
// ====================================================

function initializeLLMChat() {
    console.log('🤖 LLM Chat wird initialisiert');
    
    $('#llm-form').on('submit', function(e) {
        e.preventDefault();
        
        const prompt = $('#llm-input').val().trim();
        if (!prompt) return;
        
        console.log('🤖 LLM Anfrage:', prompt.substring(0, 50) + '...');
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
                console.log('✅ LLM Antwort erhalten');
                
                // Optional: Antwort in Editor einfügen
                if ($('#insert-to-editor').is(':checked')) {
                    const formattedResponse = '<p><em>KI-Antwort:</em></p><blockquote>' + data.response + '</blockquote>';
                    $('#summernote-editor').summernote('pasteHTML', formattedResponse);
                }
                
                $('#llm-input').val(''); // Input leeren
            } else {
                $('#llm-response').html('<div class="text-danger">Fehler: ' + (data.error || 'Unbekannter Fehler') + '</div>');
                console.error('❌ LLM Fehler:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ LLM Verbindungsfehler:', error);
            $('#llm-response').html('<div class="text-danger">Verbindungsfehler: ' + error.message + '</div>');
        });
    });
}

// ====================================================
// HILFSFUNKTIONEN
// ====================================================

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================================================
// GLOBALE FUNKTIONEN (für onclick in HTML)
// ====================================================

window.saveNow = saveNow;
window.showWordCount = showWordCount;
window.toggleAutoSave = toggleAutoSave;
window.saveAsNote = saveAsNote;
window.updateSidebarAfterSave = updateSidebarAfterSave;

// ====================================================
// INITIALIZATION
// ====================================================

// Warten bis alles geladen ist
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
        
    }, 500); // 500ms warten
    
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