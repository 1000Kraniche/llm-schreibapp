// ====================================================
// NOTES-MANAGER.JS - Korrigierte Version ohne Syntax-Fehler
// ====================================================

console.log('📝 Notes-Manager.js wird geladen...');

// Globale Variablen für Notizen (mit notes- Prefix um Konflikte zu vermeiden)
let allNotes = [];
let currentFolderId = null;
let currentNoteId = null;
let notesProjectId = null;

// ====================================================
// NOTIZEN LADEN UND ANZEIGEN
// ====================================================

async function loadNotes() {
    if (!notesProjectId) {
        console.error('❌ Keine Projekt-ID für Notizen-Load');
        return;
    }
    
    console.log('📝 Lade Notizen für Projekt:', notesProjectId);
    
    try {
        const response = await fetch('/api/notes/project/' + notesProjectId);
        if (response.ok) {
            allNotes = await response.json();
            console.log('✅ Notizen geladen:', allNotes.length, 'Stück');
            console.log('📋 Erste Notiz:', allNotes[0]); // Debug
            renderNotesList();
            loadSidebarNotes();
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
    console.log('🎨 renderNotesList() gestartet');
    
    const grid = $('#items-grid');
    console.log('🔍 #items-grid gefunden:', grid.length > 0);
    
    if (grid.length === 0) {
        console.log('⚠️ #items-grid nicht gefunden - versuche Fallback');
        
        // Fallback: Direkt in den Modal-Body rendern
        const modalBody = $('#notesModal .modal-body');
        if (modalBody.length > 0) {
            console.log('🔄 Verwende Modal-Body als Fallback');
            renderNotesInModalBody();
        } else {
            console.log('❌ Auch Modal-Body nicht gefunden');
        }
        return;
    }
    
    const currentNotes = allNotes.filter(note => note.parentId === currentFolderId);
    console.log('📋 Aktuelle Notizen für Ordner', currentFolderId, ':', currentNotes.length);
    
    if (currentNotes.length === 0) {
        console.log('📭 Keine Notizen vorhanden');
        showEmptyState();
        return;
    }
    
    let html = '';
    
    currentNotes.forEach((note, index) => {
        console.log(`📝 Rendering Notiz ${index + 1}: "${note.title}" (ID: ${note.id})`);
        
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
                    <div class="card h-100 note-card" onclick="openNote(${note.id})" data-note-id="${note.id}">
                        <div class="card-body text-center p-3 position-relative">
                            <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1" 
                                    onclick="deleteNoteFromGrid(${note.id}, event)" 
                                    style="z-index: 10;"
                                    title="Notiz löschen">
                                <i class="fas fa-trash fa-xs"></i>
                            </button>
                            <i class="fas fa-sticky-note fa-2x text-info mb-2"></i>
                            <h6 class="card-title small">${escapeHtml(note.title)}</h6>
                            <small class="text-muted">ID: ${note.id}</small>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    console.log('🎨 HTML generiert, Länge:', html.length);
    grid.html(html);
    $('#empty-folder').hide();
    console.log('✅ Notizen-Grid aktualisiert');
}

function renderNotesInModalBody() {
    console.log('🔄 Rendere Notizen direkt in Modal-Body (Fallback)');
    
    const modalBody = $('#notesModal .modal-body .container-fluid');
    
    if (modalBody.length === 0) {
        console.log('❌ Modal-Body Container nicht gefunden');
        return;
    }
    
    let html = `
        <div class="row mb-3">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <h6>📁 Projekt Notizen (${allNotes.length} Notizen)</h6>
                    <button class="btn btn-outline-success btn-sm" onclick="createNewNote()">
                        <i class="fas fa-plus"></i> Neue Notiz
                    </button>
                </div>
            </div>
        </div>
        <div class="row g-3" style="max-height: 400px; overflow-y: auto;">
    `;
    
    if (allNotes.length === 0) {
        html += `
            <div class="col-12 text-center text-muted py-5">
                <i class="fas fa-folder-open fa-3x mb-3"></i>
                <p>Noch keine Notizen vorhanden.<br>Erstelle deine erste Notiz!</p>
            </div>
        `;
    } else {
        allNotes.slice(0, 12).forEach(note => { // Erste 12 anzeigen
            html += `
                <div class="col-md-3 col-sm-4 col-6">
                    <div class="card h-100 note-card" onclick="openNote(${note.id})" style="cursor: pointer;">
                        <div class="card-body text-center p-3 position-relative">
                            <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1" 
                                    onclick="deleteNoteFromGrid(${note.id}, event)" 
                                    style="z-index: 10;"
                                    title="Notiz löschen">
                                <i class="fas fa-trash fa-xs"></i>
                            </button>
                            <i class="fas fa-sticky-note fa-2x text-info mb-2"></i>
                            <h6 class="card-title small">${escapeHtml(note.title)}</h6>
                            <small class="text-muted">Notiz</small>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    modalBody.html(html);
    console.log('✅ Notizen-Fallback gerendert:', allNotes.length, 'Notizen');
}

function loadSidebarNotes() {
    console.log('📋 Lade Sidebar-Notizen');
    
    const sidebarContainer = $('#sidebar-notes-list');
    if (sidebarContainer.length === 0) {
        console.log('⚠️ Sidebar-Container nicht gefunden');
        return;
    }
    
    if (allNotes.length === 0) {
        sidebarContainer.html('<p class="small text-muted">Noch keine Notizen vorhanden.</p>');
        return;
    }
    
    // Sortiere Notizen nach ID (neueste zuerst)
    const sortedNotes = [...allNotes].sort((a, b) => b.id - a.id);
    
    // Die ersten 5 neuesten Notizen für die Sidebar
    const recentNotes = sortedNotes.slice(0, 5);
    
    console.log('📋 Zeige neueste Notizen in Sidebar:', recentNotes.map(n => `"${n.title}" (ID: ${n.id})`));
    
    let html = '<ul class="list-unstyled">';
    recentNotes.forEach(note => {
        html += `
            <li class="mb-2">
                <a href="#" onclick="openNoteDirectFromSidebar(${note.id})" class="text-decoration-none">
                    <i class="fas fa-sticky-note text-info me-1"></i>
                    <small>${escapeHtml(note.title)}</small>
                </a>
            </li>
        `;
    });
    html += '</ul>';
    
    sidebarContainer.html(html);
    console.log('✅ Sidebar-Notizen geladen:', recentNotes.length, 'Stück (neueste zuerst)');
}

function showEmptyState() {
    console.log('📭 Zeige leeren Zustand');
    const grid = $('#items-grid');
    if (grid.length > 0) {
        grid.html('<div class="col-12 text-center text-muted py-5"><i class="fas fa-folder-open fa-3x mb-3"></i><p>Keine Notizen vorhanden.<br>Erstelle deine erste Notiz!</p></div>');
        $('#empty-folder').hide();
    }
}

// ====================================================
// NOTIZEN ERSTELLEN UND BEARBEITEN
// ====================================================

async function createNewNote() {
    const title = prompt('Notiz-Titel:', 'Neue Notiz');
    if (!title || !title.trim()) return;
    
    if (!notesProjectId) {
        console.error('❌ Keine Projekt-ID zum Erstellen der Notiz');
        return;
    }
    
    console.log('➕ Erstelle neue Notiz:', title);
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                project_id: notesProjectId,
                parent_id: currentFolderId
            })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            allNotes.push(newNote);
            renderNotesList();
            loadSidebarNotes();
            showTempMessage('Notiz "' + title + '" erstellt!', 'success');
            
            // Notiz direkt öffnen
            openNote(newNote.id);
        } else {
            const error = await response.json();
            showTempMessage('Fehler: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Notiz:', error);
        showTempMessage('Fehler beim Erstellen der Notiz: ' + error.message, 'danger');
    }
}

async function openNote(noteId) {
    console.log('📖 Öffne Notiz mit ID:', noteId, '(Type:', typeof noteId, ')');
    
    // Sicherstellen dass noteId eine Zahl ist
    const numericNoteId = parseInt(noteId);
    if (isNaN(numericNoteId)) {
        console.error('❌ Ungültige Notiz-ID:', noteId);
        showTempMessage('Ungültige Notiz-ID', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/notes/' + numericNoteId);
        console.log('📥 API Response Status:', response.status);
        
        if (response.ok) {
            const note = await response.json();
            console.log('📄 Notiz-Objekt von API:', note);
            
            // Prüfe ob es wirklich ein Notiz-Objekt ist
            if (!note || !note.id || !note.title) {
                console.error('❌ API gab kein gültiges Notiz-Objekt zurück:', note);
                showTempMessage('Fehler: Ungültige Notiz-Daten erhalten', 'danger');
                return;
            }
            
            // Prüfe ob Notiz-Editor Elemente vorhanden sind
            const noteEditorSection = $('#note-editor-section');
            const notesContent = $('#notes-content');
            
            console.log('🔍 Note-Editor-Section gefunden:', noteEditorSection.length > 0);
            console.log('🔍 Notes-Content gefunden:', notesContent.length > 0);
            
            if (noteEditorSection.length === 0) {
                console.log('⚠️ Notiz-Editor-Elemente nicht gefunden - zeige Notiz-Inhalt direkt');
                alert(`Notiz: ${note.title}\n\n${note.content || 'Kein Inhalt'}`);
                return;
            }
            
            // Notizen-Liste verstecken, Editor anzeigen
            notesContent.hide();
            noteEditorSection.show();
            
            // Notiz-Daten in Editor laden
            $('#current-note-title').text(note.title);
            $('#note-title-input').val(note.title);
            $('#note-content').val(note.content || '');
            
            // HTML-Content auch schön anzeigen
            const displayDiv = $('#note-content-display');
            if (displayDiv.length > 0) {
                if (note.content && note.content.trim()) {
                    displayDiv.html(note.content);
                    displayDiv.show();
                    $('#note-content').hide();
                    $('#view-toggle-text').text('Text bearbeiten');
                    $('#view-toggle-icon').removeClass('fa-eye').addClass('fa-edit');
                } else {
                    displayDiv.hide();
                    $('#note-content').show();
                    $('#view-toggle-text').text('HTML-Ansicht');
                    $('#view-toggle-icon').removeClass('fa-edit').addClass('fa-eye');
                }
            }
            
            // Aktuelle Notiz-ID speichern
            currentNoteId = numericNoteId;
            
            console.log('✅ Notiz erfolgreich in Editor geladen - Titel:', note.title);
            
        } else {
            console.error('❌ Fehler beim Laden der Notiz - Status:', response.status);
            showTempMessage('Fehler beim Laden der Notiz (Status: ' + response.status + ')', 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Notiz:', error);
        showTempMessage('Fehler beim Laden der Notiz: ' + error.message, 'danger');
    }
}

function openNoteDirectFromSidebar(noteId) {
    console.log('📖 Öffne Notiz direkt von Sidebar:', noteId);
    
    // Finde die Notiz in den bereits geladenen Daten
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
        console.log('📄 Notiz aus Cache gefunden:', note.title);
        
        // Modal öffnen
        $('#notesModal').modal('show');
        
        // Direkt zum Editor wechseln
        setTimeout(() => {
            $('#notes-content').hide();
            $('#note-editor-section').show();
            
            // Notiz-Daten laden
            $('#current-note-title').text(note.title);
            $('#note-title-input').val(note.title);
            $('#note-content').val(note.content || '');
            currentNoteId = noteId;
            
            console.log('✅ Notiz direkt von Sidebar geladen');
        }, 300);
    } else {
        console.log('⚠️ Notiz nicht im Cache - lade von API');
        openNoteInModal(noteId);
    }
}

function openNoteInModal(noteId) {
    console.log('📖 Öffne Notiz in Modal:', noteId);
    
    // Modal öffnen
    $('#notesModal').modal('show');
    
    // Kurz warten bis Modal offen ist, dann direkt zur Notiz
    setTimeout(() => {
        loadNotes().then(() => {
            openNote(noteId);
        });
    }, 300);
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
    
    console.log('💾 Speichere Notiz:', currentNoteId);
    
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
            loadSidebarNotes(); // Sidebar aktualisieren
            
            console.log('✅ Notiz gespeichert');
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
    }
}

async function saveQuickNote() {
    const content = $('#quick-note-content').val().trim();
    if (!content) {
        showTempMessage('Bitte gib einen Text ein', 'warning');
        return;
    }
    
    if (!notesProjectId) {
        showTempMessage('Keine Projekt-ID gefunden', 'warning');
        return;
    }
    
    // Benutzer nach Titel fragen
    const suggestedTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
    const title = prompt('Titel für die Notiz:', suggestedTitle);
    
    if (!title || !title.trim()) {
        return; // Benutzer hat abgebrochen
    }
    
    console.log('📝 Speichere Schnelle Notiz mit Titel:', title);
    
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title.trim(),
                content: content,
                project_id: notesProjectId
            })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            
            // Lokale Liste aktualisieren
            allNotes.unshift(newNote); // Am Anfang einfügen
            
            // Sidebar sofort aktualisieren
            loadSidebarNotes();
            
            // Input leeren
            $('#quick-note-content').val('');
            
            showTempMessage('Notiz "' + title + '" gespeichert!', 'success');
            console.log('✅ Schnelle Notiz gespeichert mit ID:', newNote.id);
            
            // Neue Notiz in Sidebar hervorheben
            setTimeout(() => {
                highlightNewNoteInSidebar(newNote.id);
            }, 100);
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        showTempMessage('Fehler beim Speichern: ' + error.message, 'danger');
    }
}

function highlightNewNoteInSidebar(noteId) {
    // Finde die neue Notiz in der Sidebar und hebe sie hervor
    const noteLink = $(`#sidebar-notes-list a[onclick*="${noteId}"]`);
    if (noteLink.length > 0) {
        noteLink.addClass('bg-success bg-opacity-25 rounded p-1');
        
        // Animation entfernen nach 3 Sekunden
        setTimeout(() => {
            noteLink.removeClass('bg-success bg-opacity-25');
        }, 3000);
    }
}

async function deleteCurrentNote() {
    if (!currentNoteId) {
        showTempMessage('Keine Notiz geöffnet', 'warning');
        return;
    }
    
    const noteTitle = $('#current-note-title').text();
    const confirmDelete = confirm(`Möchtest du die Notiz "${noteTitle}" wirklich löschen?\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`);
    
    if (!confirmDelete) {
        return;
    }
    
    console.log('🗑️ Lösche Notiz:', currentNoteId);
    
    try {
        const response = await fetch('/api/notes/' + currentNoteId, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Notiz aus der lokalen Liste entfernen
            allNotes = allNotes.filter(n => n.id !== currentNoteId);
            
            showTempMessage('Notiz "' + noteTitle + '" gelöscht!', 'success');
            console.log('✅ Notiz gelöscht');
            
            // Zurück zur Übersicht
            closeNoteEditor();
            loadSidebarNotes(); // Sidebar aktualisieren
            
        } else {
            const error = await response.json();
            showTempMessage('Fehler beim Löschen: ' + (error.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('Fehler beim Löschen: ' + error.message, 'danger');
    }
}

function deleteNoteFromGrid(noteId, event) {
    event.stopPropagation(); // Verhindert, dass die Notiz geöffnet wird
    
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const confirmDelete = confirm(`Möchtest du die Notiz "${note.title}" wirklich löschen?`);
    
    if (confirmDelete) {
        console.log('🗑️ Lösche Notiz aus Grid:', noteId);
        
        fetch('/api/notes/' + noteId, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                // Notiz aus der lokalen Liste entfernen
                allNotes = allNotes.filter(n => n.id !== noteId);
                renderNotesList();
                loadSidebarNotes();
                showTempMessage('Notiz gelöscht!', 'success');
            } else {
                showTempMessage('Fehler beim Löschen', 'danger');
            }
        })
        .catch(error => {
            console.error('❌ Fehler beim Löschen:', error);
            showTempMessage('Fehler beim Löschen', 'danger');
        });
    }
}

function closeNoteEditor() {
    $('#note-editor-section').hide();
    $('#notes-content').show();
    currentNoteId = null;
    renderNotesList(); // Liste aktualisieren falls Titel geändert wurde
}

function toggleNoteContentView() {
    const displayDiv = $('#note-content-display');
    const textArea = $('#note-content');
    const toggleText = $('#view-toggle-text');
    const toggleIcon = $('#view-toggle-icon');
    
    if (displayDiv.is(':visible')) {
        // Wechsel zu Text-Editor
        displayDiv.hide();
        textArea.show();
        toggleText.text('HTML-Ansicht');
        toggleIcon.removeClass('fa-edit').addClass('fa-eye');
    } else {
        // Wechsel zu HTML-Ansicht
        const content = textArea.val();
        if (content && content.trim()) {
            displayDiv.html(content);
        } else {
            displayDiv.html('<p class="text-muted"><em>Kein Inhalt vorhanden</em></p>');
        }
        displayDiv.show();
        textArea.hide();
        toggleText.text('Text bearbeiten');
        toggleIcon.removeClass('fa-eye').addClass('fa-edit');
    }
}

function openNotesModal() {
    console.log('📂 Öffne Notizen-Modal (immer zur Übersicht)');
    
    // IMMER Zustand zurücksetzen - egal was vorher war
    currentNoteId = null;
    $('#note-editor-section').hide();
    $('#notes-content').show();
    
    // Modal öffnen
    $('#notesModal').modal('show');
    
    // Kurz warten bis Modal gerendert ist, dann Notizen laden
    setTimeout(() => {
        console.log('🔄 Modal sollte jetzt offen sein, lade Notizen...');
        loadNotes();
    }, 500);
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
// GLOBALE FUNKTIONEN
// ====================================================

window.createNewNote = createNewNote;
window.openNote = openNote;
window.openNoteInModal = openNoteInModal;
window.openNoteDirectFromSidebar = openNoteDirectFromSidebar;
window.saveCurrentNote = saveCurrentNote;
window.saveQuickNote = saveQuickNote;
window.closeNoteEditor = closeNoteEditor;
window.openNotesModal = openNotesModal;
window.deleteCurrentNote = deleteCurrentNote;
window.deleteNoteFromGrid = deleteNoteFromGrid;
window.toggleNoteContentView = toggleNoteContentView;
window.highlightNewNoteInSidebar = highlightNewNoteInSidebar;

// ====================================================
// INITIALIZATION
// ====================================================

$(document).ready(function() {
    console.log('📋 Notes-Manager initialisiert');
    
    // Project ID extrahieren
    const workspaceElement = document.querySelector('[data-project-id]');
    if (workspaceElement) {
        notesProjectId = workspaceElement.dataset.projectId;
        console.log('📊 Project ID für Notizen:', notesProjectId);
        
        // Sidebar-Notizen sofort laden
        setTimeout(() => {
            loadNotes();
        }, 1000);
    }
    
    // Modal-Reset bei jedem Öffnen (Bootstrap-Event)
    $('#notesModal').on('show.bs.modal', function () {
        console.log('🔄 Modal wird geöffnet - setze Zustand zurück');
        currentNoteId = null;
        $('#note-editor-section').hide();
        $('#notes-content').show();
    });
});

console.log('📝 Notes-Manager.js geladen!');