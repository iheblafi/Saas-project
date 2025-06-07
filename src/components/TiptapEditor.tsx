'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

interface TiptapEditorProps {
  content: any; // TipTap JSON content
  onChange: (newContent: any) => void;
  editable?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // configure extensions here if needed
      }),
      // Add other extensions like Link, Image, Collaboration, etc. as needed
    ],
    content: content || '', // Initial content
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return null; // Or a loading state
  }

  return (
    <div className="prose dark:prose-invert max-w-none border border-gray-300 dark:border-gray-700 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500">
      {/* Add Toolbar here */}
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="min-h-[200px] mt-2" />
    </div>
  );
};

// Basic Toolbar Component (can be expanded)
const EditorToolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-300 dark:border-gray-700 pb-2 mb-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded ${editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        Strike
      </button>
      {/* Add more buttons for headings, lists, links, etc. */}
       <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        H2
      </button>
       <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        Bullet List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50`}
      >
        Ordered List
      </button>
    </div>
  );
};

export default TiptapEditor;

