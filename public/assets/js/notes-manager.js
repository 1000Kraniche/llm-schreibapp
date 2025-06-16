// ====================================================
// NOTIZEN-SIDEBAR LOGIC - CLEAN SLUG VERSION
// ====================================================

console.log('📝 Notes-Sidebar.js wird geladen...');

// Lokale Variablen für Sidebar
let noteAutoSaveEnabled = true;
let noteHasUnsavedChanges = false;
let sidebarNotes = [];
let currentNoteData = null;
let sidebarProjectSlug = null; // NUR SLUG, keine ID mehr!

// ====================================================
// SIDEBAR NOTIZEN LADEN
// ====================================================

async function loadSidebarNotes() {
    console.log('📋 Lade Sidebar-Notizen...');
    
    // Warte auf notes-manager allNotes
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
    
    // Fallback: eigener API-Call
    console.log('⚠️ Fallback: Eigener API-Call für Sidebar...');
    
    if (!sidebarProjectSlug) {
        console.error('❌ Keine Projekt-Slug für Sidebar-Notizen');
        return;
    }
    
    try {
        // CLEAN: Nur noch slug-basierte API  
        const apiUrl = `/api/notes/project/${sidebarProjectSlug}`;
        console.log('📋 Lade Sidebar-Notizen von:', apiUrl);
        
        const response = await fetch(apiUrl);
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
        
        // Titel bereinigen (HTML-Tags entfernen)
        const cleanTitle = note.title ? note.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
        const truncatedTitle = cleanTitle.length > 30 ? cleanTitle.substring(0, 27) + '...' : cleanTitle;
        
        html += `
            <li>
                <a class="dropdown-item ${isActive}" href="#" onclick="loadNoteIntoSidebar(${note.id}); return false;">
                    <i class="fas fa-sticky-note me-2"></i>
                    ${escapeHtml(truncatedTitle)}
                </a>
            </li>
        `;
    });
    
    container.innerHTML = html;
}

// ====================================================
// NOTIZ IN SIDEBAR LADEN
// ====================================================

async function loadNoteIntoSidebar(noteId) {
    console.log('📖 Lade Notiz in Sidebar:', noteId);
    
    try {
        const response = await fetch('/api/notes/' + noteId);
        if (response.ok) {
            currentNoteData = await response.json();
            currentNoteId = noteId;
            
            console.log('✅ Notiz in Sidebar geladen:', currentNoteData.title);
            
            // UI aktualisieren
            updateNoteDisplay();
            showNoteEditor();
            
        } else {
            console.error('❌ Fehler beim Laden der Notiz:', response.status);
            showTempMessage('Fehler beim Laden der Notiz', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz:', error);
        showTempMessage('Fehler beim Laden der Notiz: ' + error.message, 'danger');
    }
}

// ====================================================
// NEUE NOTIZ ERSTELLEN (SIDEBAR) - SLUG-BASIERT
// ====================================================

async function createNewNoteFromSidebar() {
    if (!sidebarProjectSlug) {
        showTempMessage('Keine Projekt-Slug gefunden', 'warning');
        return;
    }
    
    const title = prompt('Titel für die neue Notiz:');
    if (!title || !title.trim()) {
        return;
    }
    
    console.log('📝 Erstelle neue Notiz aus Sidebar:', title);
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                content: '',
                project_slug: sidebarProjectSlug // SLUG statt ID!
            })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            console.log('✅ Neue Notiz erstellt:', newNote);
            
            // Notiz zur Sidebar-Liste hinzufügen
            sidebarNotes.unshift(newNote);
            
            // UI aktualisieren
            renderNotesDropdown();
            
            // Neue Notiz direkt laden
            await loadNoteIntoSidebar(newNote.id);
            
            showTempMessage('✅ Notiz "' + title + '" erstellt!', 'success');
            
            // Notes-Manager informieren (falls verfügbar)
            if (typeof window.loadNotes === 'function') {
                setTimeout(() => {
                    window.loadNotes();
                }, 100);
            }
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Notiz:', error);
        showTempMessage('Fehler beim Erstellen der Notiz: ' + error.message, 'danger');
    }
}

// ====================================================
// UI-STEUERUNG
// ====================================================

function showNoteEditor() {
    const noNote = document.getElementById('no-note-selected');
    const editor = document.getElementById('note-editor-area');
    
    if (noNote) {
        noNote.classList.add('d-none');
        noNote.classList.remove('d-flex');
    }
    
    if (editor) {
        editor.classList.remove('d-none');
        editor.classList.add('d-flex');
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
    
    // Titel bereinigen (HTML-Tags entfernen)
    const cleanTitle = currentNoteData.title ? currentNoteData.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
    
    // Header aktualisieren
    document.getElementById('current-note-name').textContent = cleanTitle;
    
    // Titel anzeigen
    document.getElementById('current-note-title-display').textContent = cleanTitle;
    document.getElementById('current-note-title-input').value = cleanTitle;
    
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
            
            console.log('✅ Sidebar-Notiz gespeichert');
            
            // Notes-Manager informieren (falls verfügbar)
            if (typeof window.loadNotes === 'function') {
                setTimeout(() => {
                    window.loadNotes();
                }, 100);
            }
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
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
    
    console.log('🗑️ Lösche Notiz aus Sidebar:', currentNoteId);
    
    try {
        const response = await fetch('/api/notes/' + currentNoteId, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Notiz aus lokaler Liste entfernen
            sidebarNotes = sidebarNotes.filter(note => note.id !== currentNoteId);
            
            showTempMessage('✅ Notiz gelöscht!', 'success');
            
            // UI zurücksetzen
            currentNoteId = null;
            currentNoteData = null;
            renderNotesDropdown();
            showEmptyNotesState();
            
            // Erste verbleibende Notiz laden (falls vorhanden)
            if (sidebarNotes.length > 0) {
                setTimeout(() => {
                    loadNoteIntoSidebar(sidebarNotes[0].id);
                }, 100);
            }
            
            console.log('✅ Notiz gelöscht und Sidebar aktualisiert');
            
            // Notes-Manager informieren (falls verfügbar)
            if (typeof window.loadNotes === 'function') {
                setTimeout(() => {
                    window.loadNotes();
                }, 100);
            }
            
        } else {
            showTempMessage('❌ Fehler beim Löschen', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('❌ Fehler beim Löschen: ' + error.message, 'danger');
    }
}

// ====================================================
// TITEL BEARBEITEN
// ====================================================

function editNoteTitle() {
    const titleInput = document.getElementById('current-note-title-input');
    const titleDisplay = document.getElementById('current-note-title-display');
    
    if (titleInput.style.display === 'none' || !titleInput.style.display) {
        // Zu Bearbeitung wechseln
        titleInput.style.display = 'block';
        titleDisplay.style.display = 'none';
        titleInput.focus();
        titleInput.select();
    } else {
        // Bearbeitung beenden
        const newTitle = titleInput.value.trim();
        if (newTitle && currentNoteData) {
            titleDisplay.textContent = newTitle;
            currentNoteData.title = newTitle;
            noteHasUnsavedChanges = true;
            updateNoteSaveStatus('Ungespeichert');
        }
        
        titleInput.style.display = 'none';
        titleDisplay.style.display = 'block';
    }
}

// ====================================================
// EXTERNE SYNCHRONISATION
// ====================================================

// Funktion für notes-manager um Sidebar zu aktualisieren
window.updateSidebarFromManager = function(notes) {
    console.log('🔄 Aktualisiere Sidebar mit Daten aus notes-manager:', notes.length);
    sidebarNotes = notes;
    renderNotesDropdown();
    
    // Falls keine Notiz geladen ist, erste laden
    if (!currentNoteId && sidebarNotes.length > 0) {
        loadNoteIntoSidebar(sidebarNotes[0].id);
    }
};

// ====================================================
// EVENT LISTENERS
// ====================================================

function initializeSidebarNotes() {
    console.log('📋 Initialisiere Sidebar-Notizen...');
    
    // NUR Project Slug extrahieren (keine ID mehr!)
    const workspaceElement = document.querySelector('[data-project-slug]');
    if (workspaceElement) {
        sidebarProjectSlug = workspaceElement.dataset.projectSlug;
        console.log('📊 Project Slug für Sidebar:', sidebarProjectSlug);
    } else {
        console.error('❌ Kein data-project-slug gefunden!');
    }
    
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
    if (sidebarProjectSlug) {
        setTimeout(() => {
            loadSidebarNotes();
        }, 500);
    }
    
    console.log('✅ Sidebar-Notizen initialisiert');
}

// Globale Funktionen verfügbar machen
window.loadNoteIntoSidebar = loadNoteIntoSidebar;
window.saveCurrentNote = saveCurrentNote;
window.createNewNoteFromSidebar = createNewNoteFromSidebar;
window.deleteCurrentNote = deleteCurrentNote;
window.editNoteTitle = editNoteTitle;


console.log('📝 Notes-Sidebar.js geladen!');