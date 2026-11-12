import { marked } from 'marked';
import './markedConfig';
import { mediaUrl } from '../api/recipesApi';
import type { Recipe, ShoppingListItem } from '../types';
import { printStyles, shoppingListStyles } from './htmlStyles';
import { formatAmount, scaledAmount } from './scaling';

const IMAGE_FILE = /\.(jpeg|jpg|gif|png|webp)$/;

export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const renderAttachments = (recipe: Recipe) => recipe.attachments.map(attachment => `
    <div class="attachment">
        ${IMAGE_FILE.test(attachment.fileName)
            ? `<img src="data:image/jpeg;base64,${attachment.fileContent}" alt="${attachment.fileName}" />`
            : `<p>Attachment: ${attachment.fileName}</p>`}
    </div>
`).join('');

const renderIngredients = (recipe: Recipe, guests: number) => recipe.ingredients.map(ingredient => `
    <tr class="ingredient">
        <td class="ingredient-cell">
            ${ingredient.preamble ? marked(ingredient.preamble) : ''}
        </td>
        <td class="ingredient-cell">
            ${scaledAmount(ingredient, recipe, guests)}
            ${ingredient.measure || ''}
            ${ingredient.prefix || ''}
            <span class="ingredient-name">${ingredient.name}</span>
        </td>
        <td class="ingredient-cell">
            ${ingredient.instruction ? marked(ingredient.instruction) : ''}
        </td>
    </tr>
`).join('');

const renderSubrecipeRows = (recipe: Recipe) => (recipe.subrecipes ?? []).map(subrecipe => `
    <tr class="ingredient">
        <td class="ingredient-cell">
            ${marked(subrecipe.name)}
        </td>
        <td />
        <td />
    </tr>
`).join('');

// anchorIndex, when given, makes the heading a link target for the table of contents.
const renderRecipe = (recipe: Recipe, topRecipe: boolean, guests: number, anchorIndex?: number): string => {
    const idAttr = anchorIndex === undefined ? '' : ` id="recipe-${anchorIndex}"`;
    const heading = recipe.subrecipe
        ? `<h3${idAttr}>» ${recipe.name}</h3>`
        : `<h2${idAttr}>${recipe.name}</h2>`;

    return `
    <div class="recipe" style="${topRecipe ? 'page-break-after: always;' : 'break-inside: avoid;'}">
        ${heading}
        ${recipe.imageFileName ? `
            <div class="recipe-media">
                <img src="${mediaUrl(recipe.imageFileName)}" alt="${escapeHtml(recipe.imageFileName)}" />
            </div>
        ` : ''}
        <div class="attachments">${renderAttachments(recipe)}</div>
        ${recipe.source ? `<p><em>Source</em>: ${recipe.source.name}${recipe.pageRef ? ` p.${recipe.pageRef}` : ''}</p>` : ''}
        ${recipe.wineTips ? `<div>${marked('*Wine tips*: ' + recipe.wineTips)}</div>` : ''}
        ${recipe.notes ? `<div>${marked('*Notes*: ' + recipe.notes)}</div>` : ''}
        ${recipe.instructions ? `<div class="instructions">${marked(recipe.instructions)}</div>` : ''}
        ${recipe.subrecipe ? '<h4>Ingredients</h4>' : '<h3>Ingredients</h3>'}
        <table class="noborder">
            ${renderIngredients(recipe, guests)}
            ${renderSubrecipeRows(recipe)}
        </table>
        <div class="instructions">${marked(recipe.closing ?? '')}</div>
        ${(recipe.subrecipes ?? []).map(subrecipe => renderRecipe(subrecipe, false, guests)).join('')}
    </div>
`;
};

const renderToc = (recipes: Recipe[]) => recipes.length > 1 ? `
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            ${recipes.map((r, i) => `<li><a href="#recipe-${i}">${r.name}</a></li>`).join('')}
        </ul>
    </div>
` : '';

export const buildRecipesHtml = (recipes: Recipe[], guests: number, title: string): string => `
<html lang="en">
<head>
    <title>${title}</title>
    <style>${printStyles}</style>
</head>
<body>
    ${renderToc(recipes)}
    ${recipes.map((recipe, i) => renderRecipe(recipe, true, guests, i)).join('')}
</body>
</html>
`;

export const buildShoppingListHtml = (items: ShoppingListItem[], guests: number): string => `
<html lang="en-GB">
<head>
    <title>Shopping List</title>
    <style>${shoppingListStyles}</style>
</head>
<body>
    <h1>Shopping List</h1>
    <p>for ${guests} guests</p>
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Amount</th>
                <th>Measure</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${formatAmount(item.amount)}</td>
                    <td>${item.measure || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
`;

export const openInNewWindow = (html: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
    }
};

export const downloadHtml = (html: string, fileName: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
