import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

new Editor({
  element: document.querySelector('#editor'),
  extensions: [StarterKit],
  content: `
    <h2>Willkommen im Editor!</h2>
    <p>Du kannst hier wie in Google Docs schreiben und später Texte speichern oder an ein LLM senden.</p>
  `,
  onUpdate: ({ editor }) => {
    console.log('Aktueller Inhalt:', editor.getHTML())
  },
})
