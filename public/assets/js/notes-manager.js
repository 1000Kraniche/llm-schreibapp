// ====================================================
// NOTIZEN-MANAGER.JS - MODAL + SIDEBAR (VOLLSTÄNDIG)
// ====================================================

console.log('📋 Notes-Manager.js wird geladen...');

// Globale Variablen
let allNotes = [];
let projectSlugForNotes = null;
let currentFolderId = null;

// Sidebar-Variablen
let noteAutoSaveEnabled = true;
let noteHasUnsavedChanges = false;
let sidebarNotes = [];
let currentNoteData = null;
let currentNoteId = null;
let sidebarProjectSlug = null;

// ====================================================
// HAUPTFUNKTION: NOTIZEN LADEN (FÜR MODAL)
// ====================================================

/**
 * Notizen für Modal-Übersicht laden (SLUG-basiert)
 */
async function loadNotes() {
    console.log('📋 Lade Notizen für Modal...');
    
    // Modal zurück zu normaler Höhe
    const modalDialog = document.querySelector('#notesModal .modal-dialog');
    if (modalDialog) {
        modalDialog.style.maxHeight = '';
        modalDialog.style.height = '';
    }
    
    const modalContent = document.querySelector('#notesModal .modal-content');
    if (modalContent) {
        modalContent.style.height = '';
    }
    
    const modalBody = document.querySelector('#notesModal .modal-body');
    if (modalBody) {
        modalBody.style.height = '';
        modalBody.style.overflowY = '';
    }
    
    // Spinner anzeigen
    const notesContent = document.getElementById('notes-content');
    if (notesContent) {
        notesContent.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Lade Notizen...</span>
                </div>
                <p class="text-muted mt-2">Notizen werden geladen...</p>
            </div>
        `;
    }
    
    // Project Slug extrahieren
    if (!projectSlugForNotes) {
        const workspaceElement = document.querySelector('[data-project-slug]');
        if (workspaceElement) {
            projectSlugForNotes = workspaceElement.dataset.projectSlug;
            console.log('📊 Project Slug für Notizen:', projectSlugForNotes);
        } else {
            console.error('❌ Kein data-project-slug gefunden!');
            showNotesError('Projekt-Slug nicht gefunden');
            return;
        }
    }
    
    try {
        // API-Call mit SLUG
        const apiUrl = `/api/notes/project/${projectSlugForNotes}`;
        console.log('📋 Lade Notizen von:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (response.ok) {
            allNotes = await response.json();
            console.log('✅ Notizen geladen:', allNotes.length, 'Stück');
            
            // Notizen im Modal anzeigen
            renderNotesInModal();
            
            // Sidebar informieren (falls vorhanden)
            if (typeof window.updateSidebarFromManager === 'function') {
                window.updateSidebarFromManager(allNotes);
            }
            
        } else {
            console.error('❌ Fehler beim Laden der Notizen:', response.status);
            showNotesError(`Fehler beim Laden (${response.status})`);
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notizen:', error);
        showNotesError('Verbindungsfehler: ' + error.message);
    }
}

// ====================================================
// MODAL RENDERING
// ====================================================

function renderNotesInModal() {
    const notesContent = document.getElementById('notes-content');
    if (!notesContent) return;
    
    if (allNotes.length === 0) {
        notesContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Keine Notizen vorhanden</h5>
                <p class="text-muted">Erstelle deine erste Notiz über die Sidebar oder den Editor.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="row">';
    
    allNotes.forEach(note => {
        const cleanTitle = note.title ? note.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
        const truncatedTitle = cleanTitle.length > 25 ? cleanTitle.substring(0, 22) + '...' : cleanTitle;
        
        html += `
            <div class="col-md-3 col-sm-4 col-6 mb-3">
                <div class="text-center position-relative">
                    <!-- Löschen Button (oben rechts) -->
                    <button class="btn btn-outline-danger btn-sm position-absolute" 
                            style="top: -8px; right: 8px; z-index: 10; width: 24px; height: 24px; padding: 0;" 
                            onclick="deleteNoteFromModal(${note.id}); event.stopPropagation();"
                            title="Notiz löschen">
                        <i class="fas fa-times" style="font-size: 10px;"></i>
                    </button>
                    
                    <!-- Klickbarer Notiz-Bereich -->
                    <div class="note-item p-3 border rounded bg-light h-100 d-flex flex-column justify-content-center" 
                         style="cursor: pointer; min-height: 100px; transition: all 0.2s;"
                         onclick="editNoteInModal(${note.id})"
                         onmouseover="this.style.backgroundColor='#e9ecef'; this.style.transform='translateY(-2px)'"
                         onmouseout="this.style.backgroundColor='#f8f9fa'; this.style.transform='translateY(0)'">
                        
                        <i class="fas fa-sticky-note fa-2x text-primary mb-2"></i>
                        <small class="text-dark fw-bold">${escapeHtml(truncatedTitle)}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    notesContent.innerHTML = html;
}

function showNotesError(message) {
    const notesContent = document.getElementById('notes-content');
    if (notesContent) {
        notesContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Fehler beim Laden</h5>
                <p class="text-muted">${message}</p>
                <button class="btn btn-primary" onclick="loadNotes()">
                    <i class="fas fa-redo"></i> Erneut versuchen
                </button>
            </div>
        `;
    }
}

// ====================================================
// MODAL AKTIONEN
// ====================================================

// Diese Funktion wird nicht mehr benötigt - direktes Bearbeiten via editNoteInModal

function editNoteInModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    console.log('✏️ Bearbeite Notiz im Modal:', note.title);
    
    // Modal höher machen für Editor
    const modalDialog = document.querySelector('#notesModal .modal-dialog');
    if (modalDialog) {
        modalDialog.style.maxHeight = '95vh'; // 95% der Bildschirmhöhe
        modalDialog.style.height = '95vh';
    }
    
    const modalContent = document.querySelector('#notesModal .modal-content');
    if (modalContent) {
        modalContent.style.height = '100%';
    }
    
    const modalBody = document.querySelector('#notesModal .modal-body');
    if (modalBody) {
        modalBody.style.height = 'calc(95vh - 120px)'; // Abzüglich Header
        modalBody.style.overflowY = 'auto';
    }
    
    // Modal-Content zu Bearbeitungsansicht umschalten
    const notesContent = document.getElementById('notes-content');
    if (notesContent) {
        notesContent.innerHTML = `
            <div class="container-fluid h-100">
                <div class="row h-100">
                    <div class="col-12 h-100 d-flex flex-column">
                        <!-- Zurück Button -->
                        <button class="btn btn-outline-secondary btn-sm mb-3 align-self-start" onclick="loadNotes()">
                            <i class="fas fa-arrow-left me-1"></i> Zurück zur Übersicht
                        </button>
                        
                        <!-- Notiz Editor -->
                        <div class="card flex-grow-1 d-flex flex-column">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">
                                    <i class="fas fa-edit me-2"></i>Notiz bearbeiten
                                </h6>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteNoteFromModalEditor(${note.id})">
                                    <i class="fas fa-trash me-1"></i> Löschen
                                </button>
                            </div>
                            <div class="card-body d-flex flex-column p-3">
                                <!-- Titel -->
                                <div class="mb-3">
                                    <label for="modal-note-title" class="form-label">Titel:</label>
                                    <input type="text" class="form-control" id="modal-note-title" 
                                           value="${escapeHtml(note.title || '')}" placeholder="Notiz-Titel">
                                </div>
                                
                                <!-- Inhalt -->
                                <div class="flex-grow-1 d-flex flex-column">
                                    <label for="modal-note-content" class="form-label">Inhalt:</label>
                                    <textarea class="form-control flex-grow-1" id="modal-note-content" 
                                              style="min-height: 400px; resize: vertical;" 
                                              placeholder="Schreibe hier deine Notiz...">${escapeHtml(note.content || '')}</textarea>
                                </div>
                                
                                <!-- Speichern Button -->
                                <div class="d-flex justify-content-end mt-3">
                                    <button class="btn btn-success" onclick="saveNoteFromModalEditor(${note.id})">
                                        <i class="fas fa-save me-1"></i> Speichern
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

async function saveNoteFromModalEditor(noteId) {
    const title = document.getElementById('modal-note-title').value.trim();
    const content = document.getElementById('modal-note-content').value;
    
    if (!title) {
        showTempMessage('Titel ist erforderlich', 'warning');
        return;
    }
    
    try {
        console.log('💾 Speichere Notiz aus Modal-Editor:', title);
        
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            
            // Notiz in allNotes aktualisieren
            const noteIndex = allNotes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
                allNotes[noteIndex] = updatedNote;
            }
            
            showTempMessage('✅ Notiz gespeichert!', 'success');
            
            // Sidebar informieren (falls verfügbar)
            if (typeof window.updateSidebarFromManager === 'function') {
                window.updateSidebarFromManager(allNotes);
            }
            
            // Zurück zur Übersicht
            setTimeout(() => {
                loadNotes();
            }, 500);
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
    }
}

async function deleteNoteFromModalEditor(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    if (!confirm(`Notiz "${note.title}" wirklich löschen?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Notiz aus lokaler Liste entfernen
            allNotes = allNotes.filter(n => n.id !== noteId);
            
            showTempMessage(`✅ Notiz "${note.title}" gelöscht`, 'success');
            
            // Sidebar informieren
            if (typeof window.updateSidebarFromManager === 'function') {
                window.updateSidebarFromManager(allNotes);
            }
            
            // Zurück zur Übersicht
            setTimeout(() => {
                loadNotes();
            }, 300);
            
        } else {
            showTempMessage('❌ Fehler beim Löschen', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('❌ Verbindungsfehler beim Löschen', 'danger');
    }
}

// ====================================================
// SIDEBAR-FUNKTIONEN
// ====================================================

/**
 * Notiz in Sidebar laden (UMBENANNT!)
 */
async function loadNoteInSidebar(noteId) {
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
            
            // Modal aktualisieren
            if (typeof loadNotes === 'function') {
                setTimeout(() => {
                    loadNotes();
                }, 100);
            }
            
        } else {
            const error = await response.json();
            const errorMsg = error.error || 'Unbekannter Fehler';
            
            // Bei 404: Notiz existiert nicht mehr
            if (response.status === 404) {
                console.log('⚠️ Notiz existiert nicht mehr - zurücksetzen');
                currentNoteId = null;
                currentNoteData = null;
                showEmptyNotesState();
                showTempMessage('Notiz wurde bereits gelöscht', 'warning');
                return;
            }
            
            showTempMessage('Fehler beim Speichern: ' + errorMsg, 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
    }
}

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
                project_slug: sidebarProjectSlug
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
            await loadNoteInSidebar(newNote.id);
            
            showTempMessage('✅ Notiz "' + title + '" erstellt!', 'success');
            
            // Modal aktualisieren
            if (typeof loadNotes === 'function') {
                setTimeout(() => {
                    loadNotes();
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
                    loadNoteInSidebar(sidebarNotes[0].id);
                }, 100);
            }
            
            console.log('✅ Notiz gelöscht und Sidebar aktualisiert');
            
            // Modal aktualisieren
            if (typeof loadNotes === 'function') {
                setTimeout(() => {
                    loadNotes();
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
    if (textarea) {
        textarea.value = currentNoteData.content || '';
    }
    
    // Status zurücksetzen
    noteHasUnsavedChanges = false;
    updateNoteSaveStatus('Geladen');
    
    // Dropdown neu rendern für aktive Markierung
    renderNotesDropdown();
}

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
                <a class="dropdown-item ${isActive}" href="#" onclick="loadNoteInSidebar(${note.id}); return false;">
                    <i class="fas fa-sticky-note me-2"></i>
                    ${escapeHtml(truncatedTitle)}
                </a>
            </li>
        `;
    });
    
    container.innerHTML = html;
}

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

function updateNoteSaveStatus(status) {
    const statusElement = document.getElementById('note-save-status');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Farbe je nach Status
        statusElement.className = 'text-muted';
        if (status === 'Gespeichert') {
            statusElement.className = 'text-success';
        } else if (status === 'Ungespeichert') {
            statusElement.className = 'text-warning';
        }
    }
}

async function loadSidebarNotes() {
    console.log('📋 Lade Sidebar-Notizen...');
    
    // Warte auf notes-manager allNotes
    if (typeof allNotes !== 'undefined' && allNotes.length > 0) {
        sidebarNotes = allNotes;
        console.log('✅ Sidebar nutzt geladene Notizen:', sidebarNotes.length);
        renderNotesDropdown();
        
        // Erste Notiz automatisch laden
        if (sidebarNotes.length > 0) {
            await loadNoteInSidebar(sidebarNotes[0].id);
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
        const apiUrl = `/api/notes/project/${sidebarProjectSlug}`;
        console.log('📋 Lade Sidebar-Notizen von:', apiUrl);
        
        const response = await fetch(apiUrl);
        if (response.ok) {
            sidebarNotes = await response.json();
            console.log('✅ Sidebar-Notizen geladen:', sidebarNotes.length, 'Stück');
            
            renderNotesDropdown();
            
            // Erste Notiz automatisch laden, falls vorhanden
            if (sidebarNotes.length > 0 && !currentNoteId) {
                await loadNoteInSidebar(sidebarNotes[0].id);
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

function initializeSidebarNotes() {
    console.log('📋 Initialisiere Sidebar-Notizen...');
    
    // Project Slug extrahieren
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

// ====================================================
// MODAL EVENT LISTENERS
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Notes-Manager DOM ready');
    
    // Modal Event-Listener
    const notesModal = document.getElementById('notesModal');
    if (notesModal) {
        notesModal.addEventListener('show.bs.modal', function() {
            console.log('📋 Notizen-Modal wird geöffnet - lade Notizen');
            setTimeout(() => {
                loadNotes();
            }, 100);
        });
        
        console.log('✅ Notes-Manager Modal Events registriert');
    }
    
    // Sidebar initialisieren
    setTimeout(() => {
        initializeSidebarNotes();
    }, 200);
    
    console.log('✅ Notes-Manager bereit');
});

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

async function deleteNoteFromModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    if (!confirm(`Notiz "${note.title}" wirklich löschen?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Notiz aus lokaler Liste entfernen
            allNotes = allNotes.filter(n => n.id !== noteId);
            
            // UI aktualisieren
            renderNotesInModal();
            
            // Sidebar informieren
            if (typeof window.updateSidebarFromManager === 'function') {
                window.updateSidebarFromManager(allNotes);
            }
            
            showTempMessage(`✅ Notiz "${note.title}" gelöscht`, 'success');
            
        } else {
            showTempMessage('❌ Fehler beim Löschen', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('❌ Verbindungsfehler beim Löschen', 'danger');
    }
}

// Sidebar-Funktionen
window.loadNoteInSidebar = loadNoteInSidebar;
window.saveCurrentNote = saveCurrentNote;
window.createNewNoteFromSidebar = createNewNoteFromSidebar;
window.createNewNote = createNewNoteFromSidebar; // ALIAS für HTML
window.deleteCurrentNote = deleteCurrentNote;
window.editNoteTitle = editNoteTitle;

console.log('📋 Notes-Manager.js vollständig geladen!');