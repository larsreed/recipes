import { marked, type Tokens } from 'marked';
import '../markedConfig';
import { ExternalHyperlink, HeadingLevel, Paragraph, TextRun } from 'docx';

type MdToken = Tokens.Generic;
type InlineRun = TextRun | ExternalHyperlink;

const HEADING_LEVELS = [
    HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6,
];

// marked emits HTML entities in token text; decode them for plain-text output.
export const decodeHtml = (s: string): string => {
    if (!s) return s;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = s;
    return textarea.value;
};

// Values may arrive CSV-quoted from imports.
export const unquoteCsv = (s: string): string => {
    if (!s) return s;
    const t = s.trim();
    if (t.startsWith('"') && t.endsWith('"')) {
        return t.slice(1, -1).replace(/""/g, '"');
    }
    return s;
};

const lex = (md: string) => marked.lexer(md) as MdToken[];

const inlineToRuns = (tokens: MdToken[], bold = false, italic = false): InlineRun[] => {
    const runs: InlineRun[] = [];
    for (const tok of tokens) {
        switch (tok.type) {
            case 'text':
            case 'escape':
                if (tok.tokens) {
                    runs.push(...inlineToRuns(tok.tokens, bold, italic));
                } else {
                    runs.push(new TextRun({ text: decodeHtml(tok.text ?? ''), bold, italics: italic }));
                }
                break;
            case 'strong':
                runs.push(...inlineToRuns(tok.tokens ?? [], true, italic));
                break;
            case 'em':
                runs.push(...inlineToRuns(tok.tokens ?? [], bold, true));
                break;
            case 'codespan':
                runs.push(new TextRun({ text: decodeHtml(tok.text ?? ''), font: 'Courier New', bold, italics: italic }));
                break;
            case 'link':
                runs.push(new ExternalHyperlink({
                    link: tok.href,
                    children: [new TextRun({
                        text: decodeHtml(tok.text || tok.href || ''),
                        style: 'Hyperlink',
                        bold,
                        italics: italic,
                    })],
                }));
                break;
            case 'br':
                runs.push(new TextRun({ text: '', break: 1 }));
                break;
            case 'space':
                runs.push(new TextRun({ text: ' ' }));
                break;
            default:
                if (tok.text) {
                    runs.push(new TextRun({ text: decodeHtml(tok.text), bold, italics: italic }));
                }
        }
    }
    return runs;
};

// Converts block-level markdown into Word paragraphs.
export const markdownToDocx = (md: string): Paragraph[] => {
    if (!md) return [];
    const result: Paragraph[] = [];

    const processTokens = (tokens: MdToken[]) => {
        for (const tok of tokens) {
            switch (tok.type) {
                case 'space':
                    break;
                case 'paragraph': {
                    const runs: InlineRun[] = tok.tokens?.length
                        ? inlineToRuns(tok.tokens)
                        : [new TextRun({ text: decodeHtml(tok.text ?? '') })];
                    result.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
                    break;
                }
                case 'heading':
                    result.push(new Paragraph({
                        children: inlineToRuns(tok.tokens ?? []),
                        heading: HEADING_LEVELS[Math.min(tok.depth - 1, 5)],
                    }));
                    break;
                case 'list':
                    for (const item of tok.items as MdToken[]) {
                        const runs: InlineRun[] = [];
                        for (const t of (item.tokens ?? []) as MdToken[]) {
                            if (t.tokens) runs.push(...inlineToRuns(t.tokens));
                            else runs.push(new TextRun({ text: decodeHtml(t.text) }));
                        }
                        result.push(new Paragraph({
                            children: runs,
                            bullet: tok.ordered ? undefined : { level: 0 },
                            numbering: tok.ordered ? { reference: 'default-numbering', level: 0 } : undefined,
                            spacing: { after: 40 },
                        }));
                    }
                    break;
                case 'code':
                    result.push(new Paragraph({
                        children: [new TextRun({ text: decodeHtml(tok.text), font: 'Courier New' })],
                        spacing: { after: 80 },
                    }));
                    break;
                case 'blockquote':
                    processTokens(tok.tokens ?? []);
                    break;
                default:
                    if (tok.tokens) {
                        result.push(new Paragraph({ children: inlineToRuns(tok.tokens), spacing: { after: 80 } }));
                    }
            }
        }
    };

    processTokens(lex(md));
    return result.length > 0 ? result : [new Paragraph({ text: md })];
};

// Converts markdown into a flat list of runs, for use inside table cells.
export const markdownToRuns = (md: string): InlineRun[] => {
    if (!md) return [new TextRun({ text: '' })];
    const runs: InlineRun[] = [];
    for (const tok of lex(md)) {
        if (tok.type === 'paragraph' || tok.type === 'text') runs.push(...inlineToRuns(tok.tokens ?? []));
        else if (tok.type === 'space') runs.push(new TextRun({ text: ' ' }));
    }
    return runs.length > 0 ? runs : [new TextRun({ text: md })];
};
