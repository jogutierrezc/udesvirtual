import React, { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
// Math extension temporarily omitted due to unavailable package; KaTeX can be added later
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link2, List, ListOrdered, Heading1, Heading2, Heading3, Image as ImageIcon, Undo2, Redo2, Code, Sigma } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  height?: number | string;
};

export const RichTextEditor: React.FC<Props> = ({ value, onChange, height = 420 }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image.configure({ HTMLAttributes: { class: "rounded" } }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-3 min-h-[200px]",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL del enlace', prev);
    if (url === null) return; // canceled
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const path = `inline/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('faq-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('faq-assets').getPublicUrl(path);
      const url = data.publicUrl;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Upload failed', err);
      alert('No se pudo subir la imagen.');
    } finally {
      e.currentTarget.value = '';
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-md p-3 text-sm text-muted-foreground">Cargando editor…</div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/40">
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita" className={editor.isActive('bold') ? 'bg-muted' : ''}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva" className={editor.isActive('italic') ? 'bg-muted' : ''}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Subrayado" className={editor.isActive('underline') ? 'bg-muted' : ''}>
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="Tachado" className={editor.isActive('strike') ? 'bg-muted' : ''}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1" className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2" className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="H3" className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista" className={editor.isActive('bulletList') ? 'bg-muted' : ''}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista ordenada" className={editor.isActive('orderedList') ? 'bg-muted' : ''}>
          <ListOrdered className="h-4 w-4" />
        </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCodeBlock().run()} aria-label="Código" className={editor.isActive('codeBlock') ? 'bg-muted' : ''}>
            <Code className="h-4 w-4" />
          </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="ghost" size="icon" onClick={setLink} aria-label="Enlace" className={editor.isActive('link') ? 'bg-muted' : ''}>
          <Link2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={triggerUpload} aria-label="Imagen">
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} aria-label="Deshacer">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} aria-label="Rehacer">
          <Redo2 className="h-4 w-4" />
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
      </div>
      <div style={{ height }} className="overflow-y-auto">
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>
    </div>
  );
};

export default RichTextEditor;
