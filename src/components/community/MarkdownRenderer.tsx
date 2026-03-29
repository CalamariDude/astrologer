/**
 * Renders markdown content as styled HTML using tiptap's parser.
 */
import { useMemo } from 'react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown as TiptapMarkdown } from 'tiptap-markdown';
import { Editor } from '@tiptap/core';

const extensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Link.configure({ openOnClick: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer', class: 'text-primary underline' } }),
  Image.configure({ inline: true, HTMLAttributes: { class: 'rounded-lg max-h-64 my-2' } }),
  TiptapMarkdown.configure({ html: false }),
];

// Parse markdown to tiptap JSON, then to HTML
function markdownToHTML(md: string): string {
  try {
    const editor = new Editor({ extensions, content: md, immediatelyRender: false });
    const html = generateHTML(editor.getJSON(), extensions);
    editor.destroy();
    return html;
  } catch {
    // Fallback: render as escaped text with line breaks
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');
  }
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = useMemo(() => markdownToHTML(content), [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Strip markdown syntax for plain-text previews */
export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')        // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
    .replace(/^>\s+/gm, '')           // blockquotes
    .replace(/^[-*+]\s+/gm, '')       // list items
    .replace(/^\d+\.\s+/gm, '')       // ordered list items
    .replace(/---+/g, '')             // horizontal rules
    .replace(/\n{2,}/g, '\n')         // collapse newlines
    .trim();
}
