// ====================================================
// NOTIZEN-MANAGER.JS - MODAL-SIDEBAR SYNC + AUTO-SAVE FREE
// ====================================================

console.log('📋 Notes-Manager.js wird geladen...');

// Globale Variablen
let allNotes = [];
let projectSlugForNotes = null;
let currentFolderId = null;

// Sidebar-Variablen (Auto-Save entfernt)
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
    
    // ✅ CLEANUP: Modal Summernote zerstören falls aktiv
    if ($('#modal-summernote-editor').length && $('#modal-summernote-editor').hasClass('note-editor')) {
        $('#modal-summernote-editor').summernote('destroy');
        console.log('🗑️ Modal Summernote zerstört');
    }
    
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
            <div class="row g-3" id="items-grid">
                <div class="col-12 text-center text-muted py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Lade Notizen...</span>
                    </div>
                    <p class="text-muted mt-2">Notizen werden geladen...</p>
                </div>
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
            
            // Notizen im Modal anzeigen (ORIGINAL CARD DESIGN)
            renderNotesInModal();
            
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
// MODAL RENDERING (EINFACHE LISTEN-ANSICHT)
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
    
    // EINFACHE LISTE (Original Design)
    let html = '<div class="list-group">';
    
   allNotes.forEach(note => {
    const cleanTitle = note.title ? note.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
    
    const createdRaw = note.created_at;
    const updatedRaw = note.updated_at;
    
    const createdDate = formatDate(createdRaw);
    const updatedDate = updatedRaw ? formatDate(updatedRaw) : null;
    
    html += `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
                <h6 class="mb-1">
                    <a href="#" onclick="editNoteInModal(${note.id}); return false;" class="text-decoration-none">
                        ${escapeHtml(cleanTitle)}
                    </a>
                </h6>
                <small class="text-muted">
                    <i class="fas fa-plus-circle me-1"></i>Erstellt: ${escapeHtml(createdDate)}
                    ${updatedRaw && updatedRaw !== createdRaw ? ` • <i class="fas fa-edit me-1"></i>Bearbeitet: ${escapeHtml(updatedDate)}` : ''}
                </small>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-sm" onclick="editNoteInModal(${note.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteNoteFromModal(${note.id})">
                    <i class="fas fa-trash"></i>
                </button>
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
            <div class="row g-3">
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-muted">Fehler beim Laden</h5>
                    <p class="text-muted">${escapeHtml(message)}</p>
                    <button class="btn btn-outline-primary" onclick="loadNotes()">
                        <i class="fas fa-redo"></i> Erneut versuchen
                    </button>
                </div>
            </div>
        `;
    }
}

// ====================================================
// SIDEBAR-FUNKTIONEN (AUTO-SAVE FREE)
// ====================================================

/**
 * Notiz in Sidebar laden UND Inhalt anzeigen
 */
async function loadNoteInSidebar(noteId) {
    console.log('📖 Lade Notiz in Sidebar:', noteId);
    
    try {
        const response = await fetch(`/api/notes/${noteId}`);
        
        if (response.ok) {
            currentNoteData = await response.json();
            currentNoteId = noteId;
            
            console.log('✅ Notiz geladen:', currentNoteData.title, 
                       'Content-Länge:', currentNoteData.content ? currentNoteData.content.length : 0);
            
            // Display aktualisieren
            if (typeof updateSidebarNoteDisplay === 'function') {
                updateSidebarNoteDisplay(currentNoteData);
            } else {
                updateNoteDisplay();
            }
            
            showNoteEditor();
            
        } else if (response.status === 404) {
            console.log('⚠️ Notiz nicht gefunden - aus Liste entfernen');
            sidebarNotes = sidebarNotes.filter(note => note.id !== noteId);
            renderNotesDropdown();
            showEmptyNotesState();
            showTempMessage('⚠️ Notiz wurde gelöscht', 'warning');
        } else {
            console.error('❌ Fehler beim Laden der Notiz:', response.status);
            showTempMessage('❌ Fehler beim Laden der Notiz', 'danger');
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz:', error);
        showTempMessage('❌ Verbindungsfehler: ' + error.message, 'danger');
    }
}

async function saveCurrentNote() {
    if (!currentNoteId || !currentNoteData) {
        showTempMessage('❌ Keine Notiz zum Speichern ausgewählt', 'warning');
        return;
    }
    
    // Content aus Sidebar Editor holen
    let updatedContent;
    if (typeof getContentFromSidebarEditor === 'function') {
        updatedContent = getContentFromSidebarEditor();
    } else {
        const textarea = document.getElementById('main-note-textarea');
        updatedContent = textarea ? textarea.value : '';
    }
    
    const titleInput = document.getElementById('current-note-title-input');
    const updatedTitle = titleInput ? titleInput.value.trim() : currentNoteData.title;
    
    console.log('💾 Speichere Sidebar-Notiz:', currentNoteId);
    
    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: updatedTitle || 'Unbenannte Notiz',
                content: updatedContent
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            
            // Lokale Daten aktualisieren
            currentNoteData = updatedNote;
            noteHasUnsavedChanges = false;
            updateNoteSaveStatus('Gespeichert');
            
            // Sidebar-Liste aktualisieren
            const noteIndex = sidebarNotes.findIndex(note => note.id === currentNoteId);
            if (noteIndex !== -1) {
                sidebarNotes[noteIndex] = updatedNote;
                renderNotesDropdown();
            }
            
            console.log('✅ Notiz gespeichert');
        } else {
            console.error('❌ Fehler beim Speichern:', response.status);
            showTempMessage('❌ Fehler beim Speichern der Notiz', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('❌ Verbindungsfehler beim Speichern', 'danger');
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
            
            // Neue Notiz laden (mit delay für Backend)
            setTimeout(async () => {
                await loadNoteInSidebar(newNote.id);
            }, 200);
            
            showTempMessage('✅ Notiz "' + title + '" erstellt!', 'success');
            
            // Modal aktualisieren
            if (typeof loadNotes === 'function') {
                setTimeout(() => {
                    loadNotes();
                }, 300);
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
/**
 * Titel-Edit-Modus starten
 */
function startTitleEdit() {
    if (!currentNoteId) return; // Nur bei geladener Notiz

    const titleDisplay = document.getElementById('current-note-name');
    const titleInput = document.getElementById('current-note-title-input');
    
    if (titleDisplay && titleInput) {
        // Aktuellen Titel ins Input übertragen
        titleInput.value = titleDisplay.textContent.trim();
        
        // Display verstecken, Input zeigen
        titleDisplay.classList.add('d-none');
        titleInput.classList.remove('d-none');
        
        // Input fokussieren und Text markieren
        titleInput.focus();
        titleInput.select();
        
        console.log('📝 Titel-Edit-Modus gestartet');
    }
}

/**
 * Titel-Edit-Modus beenden
 */
function finishTitleEdit() {
    const titleDisplay = document.getElementById('current-note-name');
    const titleInput = document.getElementById('current-note-title-input');
    
    if (titleDisplay && titleInput) {
        const newTitle = titleInput.value.trim() || 'Unbenannte Notiz';
        
        // Display aktualisieren
        titleDisplay.textContent = newTitle;
        
        // Input verstecken, Display zeigen
        titleInput.classList.add('d-none');
        titleDisplay.classList.remove('d-none');
        
        // Titel speichern falls geändert
        if (currentNoteData && newTitle !== currentNoteData.title) {
            updateNoteTitle(newTitle);
        }
        
        console.log('✅ Titel-Edit-Modus beendet:', newTitle);
    }
}

/**
 * Enter/Escape bei Titel-Eingabe behandeln
 */
function handleTitleKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        finishTitleEdit();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        // Änderungen verwerfen
        const titleInput = document.getElementById('current-note-title-input');
        if (titleInput && currentNoteData) {
            titleInput.value = currentNoteData.title || 'Unbenannte Notiz';
        }
        finishTitleEdit();
    }
}

/**
 * Titel in Datenbank aktualisieren
 */
async function updateNoteTitle(newTitle) {
    if (!currentNoteId) return;
    
    try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                content: currentNoteData.content // Content unverändert
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            currentNoteData = updatedNote;
            
            // Dropdown aktualisieren
            const noteIndex = sidebarNotes.findIndex(note => note.id === currentNoteId);
            if (noteIndex !== -1) {
                sidebarNotes[noteIndex] = updatedNote;
                renderNotesDropdown();
            }
            
            showTempMessage('✅ Titel gespeichert', 'success');
            console.log('✅ Titel aktualisiert:', newTitle);
        } else {
            showTempMessage('❌ Fehler beim Speichern des Titels', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Titel-Update:', error);
        showTempMessage('❌ Verbindungsfehler', 'danger');
    }
}


/**
 * UI-Display mit korrektem Content Loading - NUR INPUT VERSION
 */
function updateNoteDisplay() {
    if (!currentNoteData) return;
    
    // Titel bereinigen (HTML-Tags entfernen)
    const cleanTitle = currentNoteData.title ? 
        currentNoteData.title.replace(/<[^>]*>/g, '') : 'Unbenannte Notiz';
    
    console.log('🔄 Aktualisiere Note Display für:', cleanTitle);
    
    // ❌ KEIN current-note-name mehr (small Element weg)
    // ❌ KEIN current-note-title-display mehr (redundanter Titel weg)
    
    // ✅ NUR NOCH Input aktualisieren:
    const titleInput = document.getElementById('current-note-title-input');
    if (titleInput) {
        titleInput.value = cleanTitle;
        console.log('✅ Titel-Input aktualisiert');
    } else {
        console.warn('⚠️ Element #current-note-title-input nicht gefunden');
    }
    
    // Content laden
    if (typeof loadContentInSidebarEditor === 'function') {
        loadContentInSidebarEditor(currentNoteData.content);
    } else {
        // Fallback zur alten Methode
        const textarea = document.getElementById('main-note-textarea');
        if (textarea) {
            const cleanContent = currentNoteData.content ? 
                currentNoteData.content.replace(/<[^>]*>/g, '') : '';
            textarea.value = cleanContent;
            console.log('✅ Content in Textarea geladen:', cleanContent.length, 'Zeichen');
        } else {
            console.error('❌ Textarea #main-note-textarea nicht gefunden!');
        }
    }
    
    // Status zurücksetzen
    noteHasUnsavedChanges = false;
    updateNoteSaveStatus('Geladen');
    
    // Dropdown neu rendern für aktive Markierung
    renderNotesDropdown();
    
    console.log('✅ Note Display vollständig aktualisiert');
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
    
    // MIT NULL-CHECK
    const noteNameElement = document.getElementById('current-note-name');
    if (noteNameElement) {
        noteNameElement.textContent = 'Keine Notiz ausgewählt';
    } else {
        console.warn('⚠️ Element #current-note-name nicht gefunden');
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
        return;
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
// MODAL FUNCTIONS (MIT SYNC-FIXES)
// ====================================================

async function editNoteInModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    console.log('✏️ Bearbeite Notiz im Modal:', note.title);
    
    // Modal höher machen für Editor
    const modalDialog = document.querySelector('#notesModal .modal-dialog');
    if (modalDialog) {
        modalDialog.style.maxHeight = '95vh';
        modalDialog.style.height = '95vh';
    }
    
    const modalContent = document.querySelector('#notesModal .modal-content');
    if (modalContent) {
        modalContent.style.height = '100%';
    }
    
    const modalBody = document.querySelector('#notesModal .modal-body');
    if (modalBody) {
        modalBody.style.height = 'calc(95vh - 120px)';
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
                        <button class="btn btn-outline-secondary mb-3 align-self-start" onclick="loadNotes()">
                            <i class="fas fa-arrow-left me-1"></i> Zurück zur Übersicht
                        </button>
                        
                        <!-- Editor -->
                        <div class="flex-fill d-flex flex-column">
                            <div class="mb-3">
                                <input type="text" 
                                       id="modal-note-title" 
                                       class="form-control" 
                                       value="${escapeHtml(note.title || '')}"
                                       placeholder="Titel der Notiz">
                            </div>
                            
                            <!-- ✅ NEUER SUMMERNOTE EDITOR STATT TEXTAREA -->
                            <div class="flex-fill d-flex flex-column">
                                <div id="modal-summernote-editor" class="flex-fill">
                                    ${note.content || ''}
                                </div>
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
        `;
        
        // ✅ SUMMERNOTE FÜR MODAL INITIALISIEREN
        setTimeout(() => {
            initializeModalSummernote();
        }, 100);
    }
}

async function saveNoteFromModalEditor(noteId) {
    const title = document.getElementById('modal-note-title').value.trim();
    
    // ✅ CONTENT AUS SUMMERNOTE HOLEN STATT TEXTAREA
    const content = $('#modal-summernote-editor').summernote('code');
    
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
                content: content  // Jetzt HTML-Content statt Plain-Text
            })
        });
        
        if (response.ok) {
            const updatedNote = await response.json();
            
            // Notiz in allNotes aktualisieren
            const noteIndex = allNotes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
                allNotes[noteIndex] = updatedNote;
            }
            
            // ✅ SYNC-FIX: Sidebar-Liste aktualisieren
            const sidebarIndex = sidebarNotes.findIndex(n => n.id === noteId);
            if (sidebarIndex !== -1) {
                sidebarNotes[sidebarIndex] = updatedNote;
                renderNotesDropdown();
                
                // Falls diese Notiz gerade aktiv ist, Display aktualisieren
                if (currentNoteId === noteId) {
                    currentNoteData = updatedNote;
                    if (typeof updateSidebarNoteDisplay === 'function') {
                        updateSidebarNoteDisplay(updatedNote);
                    }
                }
            }
            
            showTempMessage('✅ Notiz gespeichert!', 'success');
            
            // Zurück zur Übersicht
            setTimeout(() => {
                // ✅ SUMMERNOTE ZERSTÖREN BEVOR WIR ZURÜCKGEHEN
                if ($('#modal-summernote-editor').length) {
                    $('#modal-summernote-editor').summernote('destroy');
                }
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
            
            // ✅ SYNC-FIX: Sidebar-Liste aktualisieren
            sidebarNotes = sidebarNotes.filter(n => n.id !== noteId);
            renderNotesDropdown();
            
            // Falls gelöschte Notiz gerade aktiv war, andere Notiz laden
            if (currentNoteId === noteId) {
                if (sidebarNotes.length > 0) {
                    await loadNoteInSidebar(sidebarNotes[0].id);
                } else {
                    currentNoteId = null;
                    currentNoteData = null;
                    showEmptyNotesState();
                }
            }
            
            // UI aktualisieren
            renderNotesInModal();
            
            showTempMessage(`✅ Notiz "${note.title}" gelöscht`, 'success');
            
        } else {
            showTempMessage('❌ Fehler beim Löschen', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('❌ Verbindungsfehler beim Löschen', 'danger');
    }
}

// ====================================================
// MODAL-SIDEBAR SYNC HILFSFUNKTIONEN
// ====================================================

async function refreshSidebarFromModal() {
    console.log('🔄 Aktualisiere Sidebar nach Modal-Aktion...');
    
    if (!sidebarProjectSlug) return;
    
    try {
        const apiUrl = `/api/notes/project/${sidebarProjectSlug}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const freshNotes = await response.json();
            sidebarNotes = freshNotes;
            renderNotesDropdown();
            
            console.log('✅ Sidebar-Liste aktualisiert:', sidebarNotes.length, 'Notizen');
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Sidebar:', error);
    }
}

// ====================================================
// HILFSFUNKTIONEN
// ====================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Unbekannt';

    // ✅ FIX: Explizit UTC behandeln wenn Z am Ende fehlt
    let parsedDate;
    if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {
        // Backend gibt "2025-06-18 14:00:00" → als UTC behandeln
        parsedDate = new Date(dateString + 'Z');
    } else {
        parsedDate = new Date(dateString);
    }
    
    const now = new Date();
    const diffMs = now - parsedDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    // Unter 2 Stunden: "vor X min"
    if (diffMinutes < 120) {
        if (diffMinutes < 1) {
            return 'gerade eben';
        }
        return `vor ${diffMinutes} min`;
    } 
    // 2-24 Stunden: "vor X Stunden"
    else if (diffHours < 24) {
        return `vor ${diffHours} Stunden`;
    } 
    // Ab 24 Stunden: Nur Datum
    else {
        return parsedDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}




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

// ====================================================
// EVENT LISTENERS
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
        
        // ✅ SYNC-FIX: Beim Schließen des Modals Sidebar aktualisieren
        notesModal.addEventListener('hidden.bs.modal', function() {
            console.log('📋 Modal geschlossen - aktualisiere Sidebar');
            setTimeout(() => {
                refreshSidebarFromModal();
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

// ✅ NEUE FUNKTION: Modal Summernote initialisieren
function initializeModalSummernote() {
    $('#modal-summernote-editor').summernote({
        height: 400,
        minHeight: 300,
        maxHeight: 600,
        lang: 'de-DE',
        placeholder: 'Schreibe hier deine Notiz...',
        focus: true,
        disableResizeEditor: false, // Resize im Modal erlauben
        
        // ✅ DEINE GEWÜNSCHTE TOOLBAR:
        toolbar: [
            ['style', ['style']],                           // Überschriften (H1, H2, etc.)
            ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']], // Text-Formatierung
            ['color', ['forecolor', 'backcolor']],          // Text- und Hintergrundfarben
            ['para', ['ul', 'ol', 'paragraph']],           // Listen + Textausrichtung
            ['height', ['height']],                         // Zeilenhöhe
            ['view', ['codeview']],                         // Quellcode anzeigen
            ['misc', ['undo', 'redo']]                      // Undo/Redo
        ],
        
        callbacks: {
            onInit: function() {
                console.log('✅ Modal Summernote initialisiert');
                
                // Bootstrap 5 Fix für Modal-Dropdowns
                setTimeout(() => {
                    $('#modal-summernote-editor').closest('.modal').find('.note-btn[data-toggle="dropdown"]').each(function() {
                        $(this).attr('data-bs-toggle', 'dropdown');
                        $(this).removeAttr('data-toggle');
                    });
                }, 100);
            },
            onChange: function(contents, $editable) {
                console.log('📝 Modal Editor Content geändert');
            }
        }
    });
}

// Sidebar-Funktionen
window.loadNoteInSidebar = loadNoteInSidebar;
window.saveCurrentNote = saveCurrentNote;
window.createNewNoteFromSidebar = createNewNoteFromSidebar;
window.createNewNote = createNewNoteFromSidebar; // ALIAS für HTML
window.deleteCurrentNote = deleteCurrentNote;
window.editNoteTitle = editNoteTitle;

// Modal-Funktionen
window.loadNotes = loadNotes;
window.editNoteInModal = editNoteInModal;
window.saveNoteFromModalEditor = saveNoteFromModalEditor;
window.deleteNoteFromModal = deleteNoteFromModal;
window.initializeModalSummernote = initializeModalSummernote; // ✅ NEU

// Utility-Funktionen
window.openNotesModal = function() {
    const notesModal = new bootstrap.Modal(document.getElementById('notesModal'));
    notesModal.show();
};

console.log('📋 Notes-Manager.js vollständig geladen!');