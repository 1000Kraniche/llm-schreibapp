// ====================================================
// NOTIZEN-SIDEBAR LOGIC
// ====================================================


// Lokale Variablen für Sidebar
let noteAutoSaveEnabled = true;
let noteHasUnsavedChanges = false;
let sidebarNotes = [];
let currentNoteData = null;


// ====================================================
// SIDEBAR NOTIZEN LADEN
// ====================================================

async function loadSidebarNotes() {
    console.log('📋 Nutze bereits geladene Notizen aus notes-manager...');
    
    // Warte bis notes-manager fertig ist
    if (typeof allNotes !== 'undefined' && allNotes.length > 0) {
        sidebarNotes = allNotes;
        console.log('✅ Sidebar nutzt geladene Notizen:', sidebarNotes.length);
        renderNotesDropdown();
        
        // Erste Notiz automatisch laden
        if (sidebarNotes.length > 0) {
            await loadNoteIntoSidebar(sidebarNotes[0].id);
        }
        return;
    }
    
    // Fallback: eigener API-Call (nur wenn notes-manager fehlschlägt)
    console.log('⚠️ Fallback: Eigener API-Call...');
    
    if (!projectId) {
        console.error('❌ Keine Projekt-ID für Sidebar-Notizen');
        return;
    }
    
    try {
        console.log('📋 Lade Sidebar-Notizen für Projekt:', projectId);
        
        const response = await fetch(`/api/notes/${projectId}`);
        if (response.ok) {
            sidebarNotes = await response.json();
            console.log('✅ Sidebar-Notizen geladen:', sidebarNotes.length, 'Stück');
            
            renderNotesDropdown();
            
            // Erste Notiz automatisch laden, falls vorhanden
            if (sidebarNotes.length > 0 && !currentNoteId) {
                await loadNoteIntoSidebar(sidebarNotes[0].id);
            }
        } else {
            console.error('❌ Fehler beim Laden der Sidebar-Notizen:', response.status);
            showEmptyNotesState();
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Sidebar-Notizen:', error);
        showEmptyNotesState();
    }
}

function renderNotesDropdown() {
    const container = document.getElementById('notes-dropdown-list');
    if (!container) return;
    
    if (sidebarNotes.length === 0) {
        container.innerHTML = `
            <li>
                <span class="dropdown-item-text text-muted small">
                    <i class="fas fa-inbox me-1"></i> Keine Notizen vorhanden
                </span>
            </li>
        `;
        return;
    }
    
    let html = '';
    sidebarNotes.forEach(note => {
        const isActive = note.id === currentNoteId ? 'active' : '';
        const truncatedTitle = note.title.length > 30 ? note.title.substring(0, 30) + '...' : note.title;
        
        html += `
            <li>
                <button class="dropdown-item ${isActive}" data-note-id="${note.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>
                            <i class="fas fa-sticky-note text-info me-2"></i>
                            ${escapeHtml(truncatedTitle)}
                        </span>
                        ${isActive ? '<i class="fas fa-check text-success"></i>' : ''}
                    </div>
                </button>
            </li>
        `;
    });
    
    container.innerHTML = html;
    
    // Event-Listener für alle Buttons hinzufügen
    container.querySelectorAll('[data-note-id]').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.dataset.noteId);
            loadNoteIntoSidebar(noteId);
        });
    });
}

// ====================================================
// NOTIZ IN SIDEBAR LADEN
// ====================================================

async function loadNoteIntoSidebar(noteId) {
    if (noteHasUnsavedChanges) {
        if (!confirm('Du hast ungespeicherte Änderungen. Trotzdem zur anderen Notiz wechseln?')) {
            return;
        }
    }
    
    try {
        console.log('📝 Lade Notiz in Sidebar:', noteId);
        
        const response = await fetch(`/api/notes/${noteId}`);
        if (response.ok) {
            currentNoteData = await response.json();
            currentNoteId = noteId;
            
            // UI aktualisieren
            showNoteEditor();
            updateNoteDisplay();
            
            // Dropdown schließen
            const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('notesDropdown'));
            if (dropdown) dropdown.hide();
            
            console.log('✅ Notiz in Sidebar geladen:', currentNoteData.title);
        } else {
            showTempMessage('Fehler beim Laden der Notiz', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz in Sidebar:', error);
        showTempMessage('Fehler beim Laden der Notiz: ' + error.message, 'danger');
    }
}

function showNoteEditor() {
    console.log('🎯 showNoteEditor() aufgerufen');
    
    const noNote = document.getElementById('no-note-selected');
    const editor = document.getElementById('note-editor-area');
    
    if (noNote) {
        noNote.classList.add('d-none');
        noNote.classList.remove('d-flex');
        console.log('✅ "Keine Notiz" versteckt mit Bootstrap');
    }
    
    if (editor) {
        editor.classList.remove('d-none');
        editor.classList.add('d-flex', 'flex-column');
        console.log('✅ "Editor" angezeigt mit Bootstrap');
    }
}

function showEmptyNotesState() {
    const noNote = document.getElementById('no-note-selected');
    const editor = document.getElementById('note-editor-area');
    
    if (editor) {
        editor.classList.add('d-none');
        editor.classList.remove('d-flex');
    }
    
    if (noNote) {
        noNote.classList.remove('d-none');
        noNote.classList.add('d-flex');
    }
    
    document.getElementById('current-note-name').textContent = 'Keine Notiz ausgewählt';
}

function updateNoteDisplay() {
    if (!currentNoteData) return;
    
    // Header aktualisieren
    document.getElementById('current-note-name').textContent = currentNoteData.title;
    
    // Titel anzeigen
    document.getElementById('current-note-title-display').textContent = currentNoteData.title;
    document.getElementById('current-note-title-input').value = currentNoteData.title;
    
    // Content in Textarea laden
    const textarea = document.getElementById('main-note-textarea');
    textarea.value = currentNoteData.content || '';
    
    // Status zurücksetzen
    noteHasUnsavedChanges = false;
    updateNoteSaveStatus('Geladen');
    
    // Dropdown neu rendern für aktive Markierung
    renderNotesDropdown();
}

// ====================================================
// NOTIZ SPEICHERN
// ====================================================

async function saveCurrentNote() {
    if (!currentNoteId || !currentNoteData) {
        showTempMessage('Keine Notiz zum Speichern ausgewählt', 'warning');
        return;
    }
    
    const title = document.getElementById('current-note-title-input').value.trim();
    const content = document.getElementById('main-note-textarea').value;
    
    if (!title) {
        showTempMessage('Titel ist erforderlich', 'warning');
        return;
    }
    
    try {
        console.log('💾 Speichere Sidebar-Notiz:', title);
        
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            
            // Lokale Daten aktualisieren
            currentNoteData = updatedNote;
            
            // Notiz in der Liste aktualisieren
            const noteIndex = sidebarNotes.findIndex(n => n.id === currentNoteId);
            if (noteIndex !== -1) {
                sidebarNotes[noteIndex] = updatedNote;
            }
            
            // UI aktualisieren
            document.getElementById('current-note-name').textContent = title;
            document.getElementById('current-note-title-display').textContent = title;
            
            noteHasUnsavedChanges = false;
            updateNoteSaveStatus('Gespeichert');
            
            renderNotesDropdown();
            showTempMessage('✅ Notiz gespeichert!', 'success');
            
        } else {
            const error = await response.json();
            showTempMessage('❌ Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Sidebar-Notiz:', error);
        showTempMessage('❌ Fehler beim Speichern: ' + error.message, 'danger');
    }
}

function updateNoteSaveStatus(status) {
    const statusElement = document.getElementById('note-save-status');
    if (!statusElement) return;
    
    const now = new Date().toLocaleTimeString();
    
    switch (status) {
        case 'Gespeichert':
            statusElement.innerHTML = `<i class="fas fa-check text-success"></i> Gespeichert um ${now}`;
            break;
        case 'Geladen':
            statusElement.innerHTML = `<i class="fas fa-folder-open text-info"></i> Geladen um ${now}`;
            break;
        case 'Ungespeichert':
            statusElement.innerHTML = `<i class="fas fa-exclamation-triangle text-warning"></i> Ungespeicherte Änderungen`;
            break;
        default:
            statusElement.innerHTML = `<i class="fas fa-clock"></i> ${status}`;
    }
}

// ====================================================
// NEUE NOTIZ ERSTELLEN
// ====================================================

async function createNewNoteFromSidebar() {
    const title = prompt('Notiz-Titel:', 'Neue Notiz');
    if (!title || !title.trim()) return;
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                project_id: projectId,
                parent_id: null
            })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            
            // ZU BEIDEN Listen hinzufügen!
            sidebarNotes.unshift(newNote);
            
            // AUCH zu allNotes hinzufügen (für Modal-Sync)
            if (typeof allNotes !== 'undefined') {
                allNotes.unshift(newNote);
            }
            
            // Modal-Liste auch aktualisieren
            if (typeof renderNotesList === 'function') {
                renderNotesList();
            }
            
            // Neue Notiz direkt laden
            await loadNoteIntoSidebar(newNote.id);
            
            showTempMessage('✅ Notiz "' + title + '" erstellt!', 'success');
            
        } else {
            const error = await response.json();
            showTempMessage('❌ Fehler: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Notiz:', error);
        showTempMessage('❌ Fehler beim Erstellen: ' + error.message, 'danger');
    }
}

// ====================================================
// NOTIZ LÖSCHEN
// ====================================================

async function deleteCurrentNote() {
    if (!currentNoteId || !currentNoteData) {
        showTempMessage('Keine Notiz zum Löschen ausgewählt', 'warning');
        return;
    }
    
    if (!confirm(`Notiz "${currentNoteData.title}" wirklich löschen?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Aus der Liste entfernen
            sidebarNotes = sidebarNotes.filter(n => n.id !== currentNoteId);
            
            // UI zurücksetzen
            currentNoteId = null;
            currentNoteData = null;
            showEmptyNotesState();
            renderNotesDropdown();
            
            showTempMessage('✅ Notiz gelöscht', 'success');
            
            // Erste verfügbare Notiz laden
            if (sidebarNotes.length > 0) {
                await loadNoteIntoSidebar(sidebarNotes[0].id);
            }
            
        } else {
            showTempMessage('❌ Fehler beim Löschen', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Notiz:', error);
        showTempMessage('❌ Fehler beim Löschen: ' + error.message, 'danger');
    }
}

// ====================================================
// TITEL BEARBEITEN
// ====================================================

function editNoteTitle() {
    const display = document.getElementById('current-note-title-display');
    const input = document.getElementById('current-note-title-input');
    const btn = document.getElementById('edit-title-btn');
    
    if (display.style.display === 'none') {
        // Speichern und zurück zur Anzeige
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== currentNoteData.title) {
            noteHasUnsavedChanges = true;
            updateNoteSaveStatus('Ungespeichert');
        }
        
        display.textContent = newTitle || currentNoteData.title;
        display.style.display = 'block';
        input.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-edit"></i> Titel bearbeiten';
    } else {
        // Wechsel zum Bearbeitungsmodus
        display.style.display = 'none';
        input.style.display = 'block';
        input.focus();
        input.select();
        btn.innerHTML = '<i class="fas fa-check"></i> Titel übernehmen';
    }
}

// ====================================================
// LLM CHAT TOGGLE
// ====================================================

function toggleLLMChat() {
    const content = document.getElementById('llm-content');
    const btn = document.getElementById('llm-toggle-btn');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        content.classList.add('collapsed');
        content.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
}

// ====================================================
// EVENT LISTENERS
// ====================================================

function initializeSidebarNotes() {
    console.log('📋 Initialisiere Sidebar-Notizen...');
    
    // Auto-Save für Notiz-Änderungen
    const textarea = document.getElementById('main-note-textarea');
    if (textarea) {
        textarea.addEventListener('input', function() {
            noteHasUnsavedChanges = true;
            updateNoteSaveStatus('Ungespeichert');
            
            // Auto-Save nach 3 Sekunden
            if (noteAutoSaveEnabled) {
                clearTimeout(window.noteAutoSaveTimer);
                window.noteAutoSaveTimer = setTimeout(() => {
                    saveCurrentNote();
                }, 3000);
            }
        });
    }
    
    // Titel-Input Enter-Handler
    const titleInput = document.getElementById('current-note-title-input');
    if (titleInput) {
        titleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                editNoteTitle(); // Titel übernehmen
            }
        });
    }
    
    // Notizen laden
    if (projectId) {
        loadSidebarNotes();
    }
    
    console.log('✅ Sidebar-Notizen initialisiert');
}

// Globale Funktionen verfügbar machen
window.loadNoteIntoSidebar = loadNoteIntoSidebar;
window.saveCurrentNote = saveCurrentNote;
window.createNewNoteFromSidebar = createNewNoteFromSidebar;
window.deleteCurrentNote = deleteCurrentNote;
window.editNoteTitle = editNoteTitle;
window.toggleLLMChat = toggleLLMChat;
window.initializeSidebarNotes = initializeSidebarNotes;