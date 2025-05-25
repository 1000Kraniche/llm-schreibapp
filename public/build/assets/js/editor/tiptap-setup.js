import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import ListItem from '@tiptap/extension-list-item'

import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'

export function createEditor(elementSelector, content = '') {
  return new Editor({
    element: document.querySelector(elementSelector),
    content,
    autofocus: true,
    editable: true,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),

      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),

      TextStyle, // Basis für fontSize und fontFamily
      FontFamily,

      Underline,
      Strike,

      BulletList,
      OrderedList,
      TaskList,
      TaskItem,
      ListItem,

      Link.configure({
        openOnClick: true,
      }),

      Image,

      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,

      Color,
      Highlight,

      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
  })
}
