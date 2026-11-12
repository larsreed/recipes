import { marked } from 'marked';

// Configure marked to preserve line breaks and open links in a new tab.
// Importing this module applies the configuration once for the whole app.
marked.setOptions({
    gfm: true,
    breaks: true,
});

const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }) =>
    `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`;
marked.use({ renderer });
