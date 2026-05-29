import { useState } from 'react';
import { Bold, Italic, Link2, Quote, Code, Heading1, Heading2, List, Eye, Edit2 } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = 'Write your article contents here using markdown...' }) {
  const [isPreview, setIsPreview] = useState(false);

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('markdown-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
    if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
    if (syntax === 'link') replacement = `[${selected || 'link text'}](https://example.com)`;
    if (syntax === 'quote') replacement = `\n> ${selected || 'Blockquote'}\n`;
    if (syntax === 'code') replacement = `\`${selected || 'code'}\``;
    if (syntax === 'code-block') replacement = `\n\`\`\`javascript\n${selected || '// code block'}\n\`\`\`\n`;
    if (syntax === 'h1') replacement = `\n# ${selected || 'Heading 1'}\n`;
    if (syntax === 'h2') replacement = `\n## ${selected || 'Heading 2'}\n`;
    if (syntax === 'list') replacement = `\n- ${selected || 'List item'}\n`;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Refocus & reset cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const renderMarkdown = (md) => {
    if (!md) return '<p class="text-slate-400 italic">No content written yet.</p>';
    
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold text-slate-900 mt-6 mb-4">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-5 mb-3">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-bold text-slate-900 mt-4 mb-2">$1</h3>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-sm overflow-x-auto my-4">$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 rounded px-1.5 py-0.5 font-mono text-sm">$1</code>');

    // Blockquotes
    html = html.replace(/^\> (.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic text-slate-600 my-4">$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^\- (.*?)$/gm, '<li class="list-disc list-inside text-slate-700 ml-4 mb-1">$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 hover:underline font-semibold">$1</a>');

    // Paragraphs (split by double newlines)
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p class="text-slate-700 leading-relaxed mb-4">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Editor Toolbar */}
      <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-2 flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button type="button" onClick={() => insertMarkdown('h1')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Heading 1"><Heading1 className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertMarkdown('h2')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Heading 2"><Heading2 className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          <button type="button" onClick={() => insertMarkdown('bold')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Bold"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertMarkdown('italic')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Italic"><Italic className="h-4 w-4" /></button>
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          <button type="button" onClick={() => insertMarkdown('link')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Link"><Link2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertMarkdown('quote')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Quote"><Quote className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertMarkdown('code')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="Code"><Code className="h-4 w-4" /></button>
          <button type="button" onClick={() => insertMarkdown('list')} className="p-1.5 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" title="List"><List className="h-4 w-4" /></button>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${!isPreview ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${isPreview ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        {!isPreview ? (
          <textarea
            id="markdown-textarea"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[350px] p-4 text-slate-700 focus:outline-none font-mono text-sm leading-relaxed resize-y"
          />
        ) : (
          <div
            className="w-full min-h-[350px] p-6 bg-slate-50/50 prose prose-slate max-w-none overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>
    </div>
  );
}
