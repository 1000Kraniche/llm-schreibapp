// ====================================================
// NOTIZEN-SIDEBAR LOGIC - KORRIGIERT FÜR SLUGS
// ====================================================

// Lokale Variablen für Sidebar
let noteAutoSaveEnabled = true;
let noteHasUnsavedChanges = false;
let sidebarNotes = [];
let currentNoteData = null;
let sidebarProjectSlug = null; // ✅ KORRIGIERT: Slug statt ID

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
    
    // ✅ KORRIGIERT: Slug extrahieren
    if (!sidebarProjectSlug) {
        const workspaceElement = document.querySelector('[data-project-slug]');
        if (workspaceElement) {
            sidebarProjectSlug = workspaceElement.dataset.projectSlug;
            console.log('📊 Sidebar Project Slug extrahiert:', sidebarProjectSlug);
        }
    }
    
    if (!sidebarProjectSlug) {
        console.error('❌ Keine Projekt-Slug für Sidebar-Notizen');
        return;
    }
    
    try {
        console.log('📋 Lade Sidebar-Notizen für Projekt:', sidebarProjectSlug);
        
        // ✅ KORRIGIERT: Slug-basierter API-Call
        const response = await fetch(`/api/notes/project-slug/${sidebarProjectSlug}`);
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
        const truncatedTitle = note.title.length > 30 ? 
            note.title.substring(0, 27) + '...' : note.title;
        
        html += `
            <li>
                <a class="dropdown-item ${isActive}" href="#" onclick="loadNoteIntoSidebar(${note.id})">
                    <i class="fas fa-sticky-note text-info me-2"></i>
                    ${truncatedTitle}
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
    console.log('📝 Lade Notiz in Sidebar:', noteId);
    
    try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (response.ok) {
            const note = await response.json();
            currentNoteData = note;
            currentNoteId = noteId;
            
            // UI aktualisieren
            const titleInput = document.getElementById('current-note-title-input');
            const contentTextarea = document.getElementById('main-note-textarea');
            const titleDisplay = document.getElementById('current-note-title-display');
            const noteName = document.getElementById('current-note-name');
            
            if (titleInput) titleInput.value = note.title;
            if (contentTextarea) contentTextarea.value = note.content || '';
            if (titleDisplay) titleDisplay.textContent = note.title;
            if (noteName) noteName.textContent = note.title;
            
            // Dropdown aktualisieren
            renderNotesDropdown();
            
            // Status aktualisieren
            updateNoteSaveStatus('Geladen');
            
            // Editor anzeigen
            showNoteEditor();
            
            console.log('✅ Notiz in Sidebar geladen:', note.title);
        } else {
            console.error('❌ Fehler beim Laden der Notiz:', response.status);
            showTempMessage('Fehler beim Laden der Notiz', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz:', error);
        showTempMessage('Fehler beim Laden der Notiz: ' + error.message, 'danger');
    }
}

function showNoteEditor() {
    console.log('🎯 showNoteEditor() aufgerufen');
    
    const noNoteDiv = document.getElementById('no-note-selected');
    const editorDiv = document.getElementById('note-editor');
    
    if (noNoteDiv) {
        noNoteDiv.classList.add('d-none');
        console.log('✅ "Keine Notiz" versteckt mit Bootstrap');
    }
    
    if (editorDiv) {
        editorDiv.classList.remove('d-none');
        console.log('✅ "Editor" angezeigt mit Bootstrap');
    }
}

function showEmptyNotesState() {
    const container = document.getElementById('notes-dropdown-list');
    if (container) {
        container.innerHTML = `
            <li>
                <span class="dropdown-item-text text-muted small">
                    <i class="fas fa-exclamation-triangle me-1"></i> 
                    Fehler beim Laden
                </span>
            </li>
        `;
    }
}

// ====================================================
// NOTIZ SPEICHERN
// ====================================================

async function saveCurrentNoteFromSidebar() {
    if (!currentNoteId) {
        showTempMessage('Keine Notiz ausgewählt', 'warning');
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
            
            // AUCH in allNotes aktualisieren (für Modal-Sync)
            if (typeof allNotes !== 'undefined') {
                const globalNoteIndex = allNotes.findIndex(n => n.id === currentNoteId);
                if (globalNoteIndex !== -1) {
                    allNotes[globalNoteIndex] = updatedNote;
                }
            }
            
            // UI aktualisieren
            const noteName = document.getElementById('current-note-name');
            const titleDisplay = document.getElementById('current-note-title-display');
            
            if (noteName) noteName.textContent = title;
            if (titleDisplay) titleDisplay.textContent = title;
            
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
    
    // ✅ KORRIGIERT: Slug extrahieren falls nicht vorhanden
    if (!sidebarProjectSlug) {
        const workspaceElement = document.querySelector('[data-project-slug]');
        if (workspaceElement) {
            sidebarProjectSlug = workspaceElement.dataset.projectSlug;
        }
    }
    
    if (!sidebarProjectSlug) {
        showTempMessage('❌ Keine Projekt-Slug gefunden', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                project_slug: sidebarProjectSlug, // ✅ KORRIGIERT: Slug statt ID
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
            console.log('✅ Neue Notiz erstellt mit ID:', newNote.id);
            
        } else {
            const error = await response.json();
            showTempMessage('❌ Fehler beim Erstellen: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Notiz:', error);
        showTempMessage('❌ Fehler beim Erstellen der Notiz: ' + error.message, 'danger');
    }
}

// ====================================================
// GLOBALE FUNKTIONEN
// ====================================================

window.loadNoteIntoSidebar = loadNoteIntoSidebar;
window.saveCurrentNoteFromSidebar = saveCurrentNoteFromSidebar;
window.createNewNoteFromSidebar = createNewNoteFromSidebar;
window.loadSidebarNotes = loadSidebarNotes;

// ====================================================
// INITIALIZATION
// ====================================================

$(document).ready(function() {
    console.log('📋 Notes-Sidebar initialisiert');
    
    // Project Slug extrahieren
    const workspaceElement = document.querySelector('[data-project-slug]');
    if (workspaceElement) {
        sidebarProjectSlug = workspaceElement.dataset.projectSlug;
        console.log('📊 Sidebar Project Slug:', sidebarProjectSlug);
    }
    
    // Auto-Save für Sidebar-Notizen
    const titleInput = document.getElementById('current-note-title-input');
    const contentTextarea = document.getElementById('main-note-textarea');
    
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            noteHasUnsavedChanges = true;
            updateNoteSaveStatus('Ungespeichert');
        });
    }
    
    if (contentTextarea) {
        contentTextarea.addEventListener('input', function() {
            noteHasUnsavedChanges = true;
            updateNoteSaveStatus('Ungespeichert');
            
            // Auto-Save nach 3 Sekunden
            if (noteAutoSaveEnabled) {
                clearTimeout(window.noteAutoSaveTimer);
                window.noteAutoSaveTimer = setTimeout(function() {
                    saveCurrentNoteFromSidebar();
                }, 3000);
            }
        });
    }
});

console.log('📝 Notes-Sidebar.js geladen!');