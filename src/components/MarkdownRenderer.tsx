import React from 'react';
import { marked } from 'marked';
import { useTheme } from '../hooks/useTheme';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Configure marked with better table and math handling
marked.setOptions({
    breaks: true,
    gfm: true,
    tables: true,
    headerIds: true,
    headerPrefix: 'content-',
    sanitize: false,
});

// Custom renderer for better code and table handling
const renderer = new marked.Renderer();

// Enhanced table rendering
renderer.table = function (header: string, body: string) {
    return `<div class="table-container">
    <table class="markdown-table">
      <thead>${header}</thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
};

// Enhanced code block rendering
renderer.code = function (code: string, language?: string) {
    const lang = language || 'text';
    const langDisplay = lang === 'text' ? 'Code' : lang.toUpperCase();

    return `<div class="enhanced-code-block">
    <div class="code-header">
      <div class="code-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="code-language">${langDisplay}</div>
    </div>
    <pre class="code-content"><code class="language-${lang}">${code}</code></pre>
  </div>`;
};

marked.use({ renderer });

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const { theme } = useTheme();

    // Enhanced LaTeX parsing function
    const processLatex = (text: string): string => {
        // Handle display math blocks: $$...$$
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
            try {
                const html = katex.renderToString(latex.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    errorColor: '#cc0000',
                });
                return `<div class="math-display">${html}</div>`;
            } catch (e) {
                return `<div class="math-error">Error rendering: ${latex}</div>`;
            }
        });

        // Handle inline math: $...$
        text = text.replace(/\$([^$\n]+)\$/g, (match, latex) => {
            try {
                const html = katex.renderToString(latex.trim(), {
                    displayMode: false,
                    throwOnError: false,
                    errorColor: '#cc0000',
                });
                return `<span class="math-inline">${html}</span>`;
            } catch (e) {
                return `<span class="math-error">Error: ${latex}</span>`;
            }
        });

        // Handle LaTeX align environments
        text = text.replace(/\\begin\{align\}([\s\S]*?)\\end\{align\}/g, (match, content) => {
            try {
                const html = katex.renderToString(content.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    errorColor: '#cc0000',
                });
                return `<div class="math-block-align">
          <div class="math-block-header">Mathematical Expression</div>
          <div class="math-content">${html}</div>
        </div>`;
            } catch (e) {
                return `<div class="math-block-align">
          <div class="math-block-header">Mathematical Expression</div>
          <div class="math-error">Error rendering LaTeX: ${content}</div>
        </div>`;
            }
        });

        // Handle other LaTeX environments
        const environments = ['equation', 'eqnarray', 'gather', 'multline'];
        environments.forEach(env => {
            const regex = new RegExp(`\\\\begin\\{${env}\\}([\\s\\S]*?)\\\\end\\{${env}\\}`, 'g');
            text = text.replace(regex, (match, content) => {
                try {
                    const html = katex.renderToString(content.trim(), {
                        displayMode: true,
                        throwOnError: false,
                        errorColor: '#cc0000',
                    });
                    return `<div class="math-display">${html}</div>`;
                } catch (e) {
                    return `<div class="math-error">Error rendering ${env}: ${content}</div>`;
                }
            });
        });

        return text;
    };

    // Process flowchart notation
    const processFlowcharts = (text: string): string => {
        text = text.replace(/flowchart\s+LR/g, '<div class="flowchart-header">Flowchart (Left to Right)</div>');
        text = text.replace(/flowchart\s+TD/g, '<div class="flowchart-header">Flowchart (Top to Bottom)</div>');
        return text;
    };

    // Process mathematical terms and variables (for non-LaTeX text)
    const processMathTerms = (text: string): string => {
        // Handle mathematical terms in italics
        const mathTerms = ['proposed', 'accepted', 'executed', 'settle', 'acceptance', 'synchronous', 'limit', 'used', 'charged'];
        mathTerms.forEach(term => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            text = text.replace(regex, '<em class="math-term">$1</em>');
        });

        return text;
    };

    // Main processing pipeline
    const preprocessContent = (text: string): string => {
        // First, process LaTeX
        text = processLatex(text);

        // Then process flowcharts
        text = processFlowcharts(text);

        // Finally, process mathematical terms (only on non-LaTeX content)
        text = processMathTerms(text);

        return text;
    };

    const processedContent = preprocessContent(content);
    const htmlContent = marked(processedContent);

    return (
        <div
            className={`
        acp-markdown-content 
        ${theme === 'dark' ? 'markdown-body-dark' : 'markdown-body'} 
        max-w-none 
        ${className}
      `}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}

export default MarkdownRenderer;