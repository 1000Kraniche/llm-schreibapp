import { createEditor } from './tiptap-setup.js'

let editor = null

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  const editorContainer = document.querySelector('#editorpage')

  if (!editorContainer) {
    console.error('Editor fehlt.')
    return
  }

  const initialContent = editorContainer.dataset.content || '<p>Kein Inhalt geladen</p>'
  const textDocumentId = editorContainer.dataset.id || null

  editor = createEditor('#editorpage', initialContent)

  if (textDocumentId) {
    let saveTimeout = null

    editor.on('update', () => {
      if (saveTimeout) clearTimeout(saveTimeout)

      saveTimeout = setTimeout(() => {
        const jsonContent = editor.getJSON()

        fetch(`/api/textdocument/${textDocumentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: jsonContent }),
        })
          .then(res => {
            if (!res.ok) {
              console.error('Fehler beim Speichern')
            }
          })
          .catch(err => {
            console.error('Netzwerkfehler:', err)
          })
      }, 3000)
    })
  }

  // Toolbar Buttons (alle Aktionen)
  document.querySelectorAll('.editor-toolbar [data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action
      const level = button.dataset.level
      if (!editor) return

      switch (action) {
        case 'toggleBold':
          editor.chain().focus().toggleBold().run()
          break
        case 'toggleItalic':
          editor.chain().focus().toggleItalic().run()
          break
        case 'toggleUnderline':
          editor.chain().focus().toggleUnderline().run()
          break
        case 'toggleStrike':
          editor.chain().focus().toggleStrike().run()
          break
        case 'toggleBulletList':
          editor.chain().focus().toggleBulletList().run()
          break
        case 'toggleOrderedList':
          editor.chain().focus().toggleOrderedList().run()
          break
        case 'toggleTaskList':
          editor.chain().focus().toggleTaskList().run()
          break
        case 'indent':
          editor.chain().focus().sinkListItem('listItem').run()
          break
        case 'outdent':
          editor.chain().focus().liftListItem('listItem').run()
          break
        case 'insertImage': {
          const url = window.prompt('Bild-URL eingeben:')
          if (url) {
            editor.chain().focus().setImage({ src: url }).run()
          }
          break
        }
        case 'insertTable':
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          break
        case 'setHeading':
          if (level) {
            editor.chain().focus().setHeading({ level: parseInt(level) }).run()
          }
          break
      }
    })
  })

  // Blocktyp Dropdown
  const blockType = document.querySelector('#block-type')
  if (blockType) {
    blockType.addEventListener('change', () => {
      const value = blockType.value
      if (!editor) return

      if (value === 'paragraph') {
        editor.chain().focus().setParagraph().run()
      } else if (value.startsWith('heading')) {
        const level = parseInt(value.replace('heading', ''))
        editor.chain().focus().setHeading({ level }).run()
      }
    })
  }

  // Schriftart Dropdown
  const fontFamily = document.querySelector('#font-family')
  if (fontFamily) {
    fontFamily.addEventListener('change', () => {
      const font = fontFamily.value
      if (editor && font) {
        editor.chain().focus().setMark('textStyle', { fontFamily: font }).run()
      }
    })
  }

  // Schriftgröße Dropdown + Input synchronisieren
  const fontSizeDropdown = document.querySelector('#font-size')
  const fontSizeInput = document.querySelector('#font-size-input')

  if (fontSizeDropdown && fontSizeInput) {
    fontSizeDropdown.addEventListener('change', () => {
      const size = fontSizeDropdown.value
      if (editor) {
        editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
        fontSizeInput.value = size
      }
    })

    fontSizeInput.addEventListener('change', () => {
      const size = fontSizeInput.value
      if (editor && size) {
        editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
        fontSizeDropdown.value = size
      }
    })
  }
})
