'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'

interface TipTapEditorProps {
  content?: string
  onChange: (html: string) => void
}

export default function TipTapEditor({ content = '', onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex gap-1 p-2 border-b bg-gray-50 flex-wrap">
        <Button type="button" size="sm"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • 목록
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. 목록
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          코드
        </Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}>↩</Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}>↪</Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-[14px] [&_.ProseMirror]:leading-[1.4]"
      />
    </div>
  )
}
