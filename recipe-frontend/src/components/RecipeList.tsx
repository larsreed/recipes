import React, {useState, useEffect, useCallback, useRef } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import ConversionsModal from "./ConversionsModal.tsx";
import SourceModal from "./SourceModal.tsx";
import TemperaturesModal from "./TemperaturesModal.tsx";
import RecipeModal from "./RecipeModal.tsx";
import PromptDialog from "./PromptDialog.tsx";
import { marked } from 'marked';
import config from '../config';
import {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
    BorderStyle, WidthType, PageBreak, XmlComponent, XmlAttributeComponent, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';


interface Attachment {
    id: number;
    fileName: string;
    fileContent: string;
}

interface Recipe {
    id: number;
    name: string;
    subrecipe: boolean;
    served?: string;
    source?: Source;
    notes?: string;
    pageRef?: string;
    rating?: number;
    people: number;
    wineTips?: string;
    matchFor?: string;
    categories: string;
    ingredients: Ingredient[];
    attachments: Attachment[];
    instructions?: string;
    closing?: string;
    subrecipes?: Recipe[];
}

interface Source {
    id: number;
    name: string;
    authors: string;
}

interface Ingredient {
    id: number;
    preamble: string;
    amount: number;
    measure: string;
    prefix: string;
    name: string;
    instruction: string;
}

Modal.setAppElement('#root');

// Configure marked to preserve line breaks
marked.setOptions({
    gfm: true,
    breaks: true,
});


function RecipeList() {
    const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isConversionsModalOpen, setIsConversionsModalOpen] = useState(false);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isTemperatureModalOpen, setIsTemperatureModalOpen] = useState(false);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isExportAll, setIsExportAll] = useState(false);
    const [includeSubrecipes, setIncludeSubrecipes] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const fetchRecipes = useCallback(() => {
        axios.get(`${config.backendUrl}/api/recipes?includeSubrecipes=${includeSubrecipes}`)
            .then(response => {
                setAllRecipes(response.data);
                setRecipes(response.data);
            })
            .catch(error => {
                console.error('Error fetching recipes:', error);
                setApiError('Failed to fetch recipes');
            });
    }, [includeSubrecipes]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes, includeSubrecipes]);

    const sortedRecipes = [...recipes].sort((a, b) => {
        const aValue = sortConfig.key === 'source' ? a.source?.name?.toLowerCase() || '' : a[sortConfig.key]?.toString().toLowerCase() || '';
        const bValue = sortConfig.key === 'source' ? b.source?.name?.toLowerCase() || '' : b[sortConfig.key]?.toString().toLowerCase() || '';

        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: string) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
        return 'fas fa-sort';
    };

    const deleteRecipe = (id: number) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            axios.delete(`${config.backendUrl}/api/recipes/${id}`)
                .then(() => {
                    setRecipes(recipes.filter(recipe => recipe.id !== id));
                    setApiError(null);
                })
                .catch(error => {
                    console.error('Error deleting recipe:', error)
                    setApiError('Failed to delete recipe');
                });
        }
    };

    const handleDeleteMany = () => {
        const recipesToDelete = selectedRecipes.size === 0 ? [] : recipes
            .filter(recipe => selectedRecipes.has(recipe.id))
            .map(recipe => recipe.id); // Only include IDs
        if (recipesToDelete.length === 0) {
            alert('No recipes selected for deletion.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${recipesToDelete.length} recipe(s)?`)) {
            axios.post(`${config.backendUrl}/api/recipes/delete-many`, recipesToDelete, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(() => {
                    setRecipes(recipes.filter(recipe => !recipesToDelete.includes(recipe.id)));
                    setSelectedRecipes(new Set());
                    setSelectAll(false);
                    setApiError(null);
                })
                .catch(error => {
                    console.error('Error deleting recipes:', error);
                    setApiError('Failed to delete recipes');
                });
        }
    };

    const editRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsRecipeModalOpen(true);
    };

    const handleRecipeSaved = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(false);
        fetchRecipes();
    };

    const handleOpenSourceModal = () => {
        setIsSourceModalOpen(true);
    };

    const handleCloseSourceModal = () => {
        setIsSourceModalOpen(false);
        window.location.reload(); // Refresh the entire application
    };

    const handleOpenTemperatureModal = () => {
        setIsTemperatureModalOpen(true);
    };

    const handleCloseTemperatureModal = () => {
        setIsTemperatureModalOpen(false);
        window.location.reload(); // Refresh the entire application
    };

    const handleOpenConversionsModal = () => {
        setIsConversionsModalOpen(true);
    };

    const handleCloseConversionsModal = () => {
        setIsConversionsModalOpen(false);
        window.location.reload(); // Refresh the entire application
    };

    const handleOpenRecipeModal = () => {
        setEditingRecipe(null);
        setIsRecipeModalOpen(true);
    };

    const handleCloseRecipeModal = () => {
        setIsRecipeModalOpen(false);
    };

    const handleOpenSearchPanel = () => {
        setIsSearchPanelOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    const handleCloseSearchPanel = () => {
        setIsSearchPanelOpen(false);
    };

    const handleSearch = () => {
        const searchUrl = `${config.backendUrl}/api/recipes/search?query=${encodeURIComponent(searchQuery)}`
        // console.log(searchUrl);
        axios.get(searchUrl)
            .then(response => {
                console.log(response.data)
                setRecipes(response.data); // Only update the filtered list
                setIsSearchActive(true);
                setIsSearchPanelOpen(false);
                setApiError(null);
            })
            .catch(error => {
                console.error('Error searching recipes:', error)
                setApiError('Failed to search for recipes');
            });
    };

    const handleShowAllRecipes = () => {
        setRecipes(allRecipes); // Restore the full list
        setIsSearchActive(false);
    };

    const handleImport = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!csvFile) {
            alert('Please select a CSV file to import.');
            return;
        }
        const formData = new FormData();
        formData.append('file', csvFile);
        try {
            const response = await axios.post(`${config.backendUrl}/api/recipes/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log("Recipes imported:", response.data);
            fetchRecipes();
            setCsvFile(null);
            setApiError(null);
            const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = ''; // Clear the file input
        } catch (error) {
            console.error('Error importing recipes:', error);
            setApiError('Failed to import recipes. Please check the CSV file format and try again.\'');
            fetchRecipes();
        }
    };

    const exportHtmlContent = (htmlContent: string, fileName: string) => {
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        const recipesToExport = selectedRecipes.size === 0 ? [] : recipes
            .filter(recipe => selectedRecipes.has(recipe.id))
            .map(recipe => recipe.id); // Only include IDs

        try {
            axios.post(`${config.backendUrl}/api/recipes/export-all`,
                recipesToExport.length > 0 ? recipesToExport : null, // Send null for an empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            ).then(response => {
                const csvContent = response.data; // Assuming the backend returns CSV content as plain text
                const newWindow = window.open("", "_blank");
                if (newWindow) {
                    newWindow.document.write(`<pre>${csvContent}</pre>`);
                    newWindow.document.close();
                }
            }).catch(error => {
                console.error("Error exporting recipes:", error);
                setApiError('Failed to export recipes. Please try again.');
            });
        } catch (error) {
            console.error("Error exporting recipes:", error);
            setApiError('Failed to export recipes. Please try again.');
        }
    };

    const handleShoppingList = () => {
        const recipesToShop = selectedRecipes.size === 0 ? [] : recipes
            .filter(recipe => selectedRecipes.has(recipe.id))
            .map(recipe => recipe.id); // Only include IDs

        const guests = prompt("Guests", "4");
        if (guests && parseInt(guests) > 0) {
            try {
                axios.post(`${config.backendUrl}/api/recipes/shopping-list`, {
                    recipeIds: recipesToShop.length > 0 ? recipesToShop : null,
                    guests: parseInt(guests),
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(async response => {
                    const shoppingContent = response.data; // Assuming the backend returns CSV content as plain text

                   const newWindow = window.open("", "_blank");
                    if (newWindow) {

                        const htmlContent = `
                        <html lang="en-GB">
                        <head>
                            <title>Shopping List</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; font-size: smaller; }
                                table { border-collapse: collapse; }
                                th, td { border: 1px solid #ddd; padding: 3px; text-align: left; }
                                th { background-color: #f4f4f4; }
                            </style>
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
                                    ${shoppingContent.map((item: { name: any; amount: number; measure: any; }) => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${item.amount? parseFloat(item.amount.toFixed(2)).toString() : ''}</td> 
                                            <td>${item.measure || ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </body>
                        </html>
                    `;
                        newWindow.document.write(htmlContent);
                        newWindow.document.close();
                    }
                }).catch(error => {
                    console.error("Error exporting shopping list:", error);
                    setApiError('Failed to export shopping list. Please try again.');
                });
            } catch (error) {
                console.error("Error exporting shopping list:", error);
                setApiError('Failed to export shopping list. Please try again.');
            }
        }
    };

    const handleExportView = (singleRecipe?: Recipe) => {
        const guests = prompt("Guests", "4");
        if (guests && parseInt(guests) > 0) {
            const guestsNumber = parseInt(guests);
            const recipesToExport = singleRecipe ? [singleRecipe] : (selectedRecipes.size > 0 ? recipes.filter(recipe => selectedRecipes.has(recipe.id)) : recipes);

            const generateRecipeHtml: (recipe: Recipe, topRecipe: boolean) => string = (recipe: Recipe, topRecipe: boolean) => `
            <div class="recipe" style="${topRecipe ? 'page-break-after: always;' : 'break-inside: avoid;'}">
                ${recipe.subrecipe ? `<h3>» ${recipe.name}</h3>` : `<h2>${recipe.name}</h2>`}
                <div class="attachments">
                    ${recipe.attachments.map(attachment => `
                        <div class="attachment">
                            ${attachment.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/) ?
                                `<img src="data:image/jpeg;base64,${attachment.fileContent}" alt="${attachment.fileName}" />` :
                                `<p>Attachment: ${attachment.fileName}</p>`
                            }
                        </div>
                    `).join('')}
                </div>
                ${recipe.served ? `<p><em>Served</em>: ${recipe.served.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.source ? `<p><em>Source</em>: ${recipe.source.name}${recipe.pageRef ? ` p.${recipe.pageRef}` : ''}</p>` : ''}
                ${recipe.rating ? `<p><em>Rating</em>: ${recipe.rating}</p>` : ''}
                ${recipe.wineTips ? `<p><em>Wine tips</em>: ${recipe.wineTips.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.matchFor ? `<p><em>Match for</em>: ${recipe.matchFor.replace(/\n/g, '<br />')}</p>` : ''}
                ${recipe.categories ? `<p><em>Categories</em>: ${recipe.categories.replace(/,/g, ' ')}</p>` : ''}
                ${recipe.notes ? `<div>${marked("*Notes*: " + recipe.notes)}</div>` : ''}
                ${recipe.instructions ? `<div class="instructions">${marked(recipe.instructions)}</div>` : ''}
                ${recipe.subrecipe ? `<h4>Ingredients</h4>` : `<h3>Ingredients</h3>`}
                <table class="noborder">
                    ${recipe.ingredients.map(ingredient => `
                        <tr class="ingredient">
                            <td class="ingredient-cell"> 
                                ${ingredient.preamble ? marked(ingredient.preamble) : ''}
                            </td>
                            <td class="ingredient-cell">
                                ${ingredient.amount ?
                                     (recipe.people>0?
                                         parseFloat(((ingredient.amount * guestsNumber) / recipe.people).toFixed(2)).toString()
                                        : ingredient.amount) 
                                     : ''}
                                ${ingredient.measure || ''}
                                ${ingredient.prefix || ''}
                                <span class="ingredient-name">${ingredient.name}</span>
                            </td>
                            <td class="ingredient-cell">
                                ${ingredient.instruction ? marked(ingredient.instruction) : ''}
                            </td>
                        </tr>
                    `).join('')}
                    ${recipe.subrecipes ? recipe.subrecipes.map(subrecipe => `
                        <tr class="ingredient">
                            <td class="ingredient-cell">
                                ${marked(`${subrecipe.name}`)}
                            </td>
                            <td />
                            <td />
                        </tr>
                    `).join('') : ''}
                </table>
                <div class="instructions">${marked(recipe.closing ?? '')}</div>
                ${recipe.subrecipes ? recipe.subrecipes.map(subrecipe => generateRecipeHtml(subrecipe, false)).join('') : ''}
            </div>
        `;

            const tocHtml = recipesToExport.length > 1 ? `
                <div class="toc">
                    <h2>Table of Contents</h2>
                    <ul>
                        ${recipesToExport.map((r, i) => `<li><a href="#recipe-${i}">${r.name}</a></li>`).join('')}
                    </ul>
                </div>
            ` : '';

            const generateRecipeHtmlWithId = (recipe: Recipe, topRecipe: boolean, index: number) =>
                generateRecipeHtml(recipe, topRecipe).replace(
                    recipe.subrecipe ? `<h3>» ${recipe.name}</h3>` : `<h2>${recipe.name}</h2>`,
                    recipe.subrecipe ? `<h3 id="recipe-${index}">» ${recipe.name}</h3>` : `<h2 id="recipe-${index}">${recipe.name}</h2>`
                );

            const htmlContent = `
            <html lang="en">
            <head>
                <title>${singleRecipe ? singleRecipe.name : "All Recipes"}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    @media print {
                      @page {
                        margin-top: 0.5in;
                        margin-bottom: 0.75in;
                        margin-left: 1in;
                        margin-right: 1in;
                      }
                    }
                    body {
                        font-family: Calibri, sans-serif;
                        background-color: #FFFFFF;
                        background-image: none;
                        color: #000000;
                        margin: 0;
                        overflow: auto;
                        position: relative;
                        box-sizing: border-box;
                        width: 210mm;
                        height: 296mm;
                    }
                    .noborder {
                        border:none;
                        border-collapse: collapse;
                    }
                    .recipe {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        background: #fff;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .recipe h2 {
                        margin-top: 0;
                        color: #2c3e50;
                    }
                    .recipe p {
                        margin: 5px 0;
                    }
                    .recipe h3 {
                        margin-bottom: 10px;
                        color: #16a085;
                    }
                    .recipe ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    .recipe ul li {
                        margin-bottom: 5px;
                    }
                    .ingredient {
                        margin-bottom: 20px;
                        border-bottom: 1px dotted #16a085;
                    }
                    .ingredient-cell {
                        vertical-align: top;
                        padding: 0 8px;
                    }
                    .ingredient-name {
                        color: chocolate;
                    }
                    .instructions {
                        margin-top: 20px;
                    }
                    .attachment {
                        margin-top: 20px;
                    }
                    .attachment img {
                        max-width: 100%;
                        height: auto;
                    }
                    .toc {
                        max-width: 800px;
                        margin: 20px auto;
                        padding: 20px;
                        background: #fff;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        page-break-after: always;
                    }
                    .toc h2 { color: #2c3e50; }
                    .toc ul { list-style: none; padding: 0; }
                    .toc ul li { margin: 6px 0; }
                    .toc a { color: #16a085; text-decoration: none; }
                    .toc a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                ${tocHtml}
                ${recipesToExport.map((recipe, i) => generateRecipeHtmlWithId(recipe, true, i)).join('')}
            </body>
            </html>
        `;

            const newWindow = window.open("", "_blank");
            if (newWindow) {
                newWindow.document.write(htmlContent);
                newWindow.document.close();
            }

            if (!singleRecipe) {
                setIsExportAll(true);
                setIsDialogOpen(true);
                setHtmlContent(htmlContent);
            }
        } else {
            alert("Please enter a valid number of guests.");
        }
    };

    const handleExportWord = () => {
        const guestsStr = prompt("Guests", "4");
        if (!guestsStr || parseInt(guestsStr) <= 0) {
            alert("Please enter a valid number of guests.");
            return;
        }
        const guestsNumber = parseInt(guestsStr);
        const recipesToExport = selectedRecipes.size > 0
            ? recipes.filter(recipe => selectedRecipes.has(recipe.id))
            : recipes;

        const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
        const cellBorders = { top: noBorder, bottom: { style: BorderStyle.DOTTED, size: 4, color: '16a085' }, left: noBorder, right: noBorder };

        // Convert markdown text to an array of docx Paragraphs.
        // Handles: paragraphs, bold, italic, bold+italic, bullet/ordered lists, headings, line breaks.
        const markdownToDocx = (md: string): Paragraph[] => {
            if (!md) return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tokens: any[] = marked.lexer(md);
            const result: Paragraph[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inlineToRuns = (inlineTokens: any[], bold = false, italic = false): TextRun[] => {
                const runs: TextRun[] = [];
                for (const tok of inlineTokens) {
                    if (tok.type === 'text' || tok.type === 'escape') {
                        if (tok.tokens) {
                            runs.push(...inlineToRuns(tok.tokens, bold, italic));
                        } else {
                            runs.push(new TextRun({ text: tok.text ?? '', bold, italics: italic }));
                        }
                    } else if (tok.type === 'strong') {
                        runs.push(...inlineToRuns(tok.tokens, true, italic));
                    } else if (tok.type === 'em') {
                        runs.push(...inlineToRuns(tok.tokens, bold, true));
                    } else if (tok.type === 'codespan') {
                        runs.push(new TextRun({ text: tok.text ?? '', font: 'Courier New', bold, italics: italic }));
                    } else if (tok.type === 'br') {
                        runs.push(new TextRun({ text: '', break: 1 }));
                    } else if (tok.type === 'space') {
                        runs.push(new TextRun({ text: ' ' }));
                    } else if (tok.text) {
                        runs.push(new TextRun({ text: tok.text, bold, italics: italic }));
                    }
                }
                return runs;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processTokens = (tokenList: any[]) => {
                for (const tok of tokenList) {
                    if (tok.type === 'space') continue;
                    if (tok.type === 'paragraph') {
                        const runs = tok.tokens?.length ? inlineToRuns(tok.tokens) : [new TextRun({ text: tok.text ?? '' })];
                        result.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
                    } else if (tok.type === 'heading') {
                        const lvl = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
                            HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][Math.min(tok.depth - 1, 5)];
                        result.push(new Paragraph({ children: inlineToRuns(tok.tokens), heading: lvl }));
                    } else if (tok.type === 'list') {
                        for (const item of tok.items) {
                            const runs: TextRun[] = [];
                            for (const t of item.tokens) {
                                if (t.tokens) runs.push(...inlineToRuns(t.tokens));
                                else runs.push(new TextRun({ text: t.text }));
                            }
                            result.push(new Paragraph({
                                children: runs,
                                bullet: tok.ordered ? undefined : { level: 0 },
                                numbering: tok.ordered ? { reference: 'default-numbering', level: 0 } : undefined,
                                spacing: { after: 40 },
                            }));
                        }
                    } else if (tok.type === 'code') {
                        result.push(new Paragraph({
                            children: [new TextRun({ text: tok.text, font: 'Courier New' })],
                            spacing: { after: 80 },
                        }));
                    } else if (tok.type === 'blockquote') {
                        processTokens(tok.tokens);
                    } else if (tok.tokens) {
                        result.push(new Paragraph({ children: inlineToRuns(tok.tokens), spacing: { after: 80 } }));
                    }
                }
            };
            processTokens(tokens);
            return result.length > 0 ? result : [new Paragraph({ text: md })];
        };

        // Strip CSV-style surrounding quotes and unescape doubled internal quotes
        // e.g. "He said ""hello""" → He said "hello"
        const unquoteCsv = (s: string): string => {
            if (!s) return s;
            const t = s.trim();
            if (t.startsWith('"') && t.endsWith('"')) {
                return t.slice(1, -1).replace(/""/g, '"');
            }
            return s;
        };

        const metaRun = (label: string, value: string) => new Paragraph({
            children: [
                new TextRun({ text: label, italics: true, color: '555555' }),
                new TextRun({ text: value }),
            ],
            spacing: { after: 60 },
        });

        const buildRecipeSection = (recipe: Recipe, topLevel: boolean, index?: number): (Paragraph | Table)[] => {
            const elements: (Paragraph | Table)[] = [];

            // Heading
            elements.push(new Paragraph({
                text: topLevel ? recipe.name : `» ${recipe.name}`,
                heading: topLevel ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
                ...(topLevel && index !== undefined ? { bookmark: { id: `recipe-${index}`, name: recipe.name } } : {}),
                spacing: { before: topLevel ? 0 : 400, after: 200 },
            }));

            if (recipe.served) elements.push(metaRun('Served: ', unquoteCsv(recipe.served)));
            if (recipe.source) elements.push(metaRun('Source: ', recipe.source.name + (recipe.pageRef ? ` p.${recipe.pageRef}` : '')));
            if (recipe.rating) elements.push(metaRun('Rating: ', String(recipe.rating)));
            if (recipe.wineTips) elements.push(metaRun('Wine tips: ', unquoteCsv(recipe.wineTips)));
            if (recipe.matchFor) elements.push(metaRun('Match for: ', unquoteCsv(recipe.matchFor)));
            if (recipe.categories) elements.push(metaRun('Categories: ', recipe.categories.replace(/,/g, ' ')));
            if (recipe.notes) elements.push(...markdownToDocx('*Notes*: ' + unquoteCsv(recipe.notes)));

            if (recipe.instructions) {
                elements.push(...markdownToDocx(unquoteCsv(recipe.instructions)));
            }

            // Ingredients heading — bold text, not a heading style
            elements.push(new Paragraph({
                children: [new TextRun({ text: 'Ingredients', bold: true, size: 24 })],
                spacing: { before: 200, after: 100 },
            }));

            const inlineToRunsPublic = (md: string): TextRun[] => {
                if (!md) return [new TextRun({ text: '' })];
                const tokens = marked.lexer(md);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const inlineRuns = (toks: any[], bold = false, italic = false): TextRun[] => {
                    const runs: TextRun[] = [];
                    for (const t of toks) {
                        if (t.type === 'text' || t.type === 'escape') {
                            if (t.tokens) runs.push(...inlineRuns(t.tokens, bold, italic));
                            else runs.push(new TextRun({ text: t.text ?? '', bold, italics: italic }));
                        } else if (t.type === 'strong') {
                            runs.push(...inlineRuns(t.tokens, true, italic));
                        } else if (t.type === 'em') {
                            runs.push(...inlineRuns(t.tokens, bold, true));
                        } else if (t.type === 'br') {
                            runs.push(new TextRun({ text: '', break: 1 }));
                        } else if (t.text) {
                            runs.push(new TextRun({ text: t.text, bold, italics: italic }));
                        }
                    }
                    return runs;
                };
                const allRuns: TextRun[] = [];
                for (const tok of tokens) {
                    if (tok.type === 'paragraph' || tok.type === 'text') allRuns.push(...inlineRuns(tok.tokens ?? []));
                    else if (tok.type === 'space') allRuns.push(new TextRun({ text: ' ' }));
                }
                return allRuns.length > 0 ? allRuns : [new TextRun({ text: md })];
            };

            // Ingredients table
            const ingredientRows = recipe.ingredients.map(ing => {
                const scaledAmount = ing.amount
                    ? (recipe.people > 0
                        ? parseFloat(((ing.amount * guestsNumber) / recipe.people).toFixed(2)).toString()
                        : String(ing.amount))
                    : '';
                const amountMeasure = [scaledAmount, ing.measure, ing.prefix].filter(Boolean).join(' ');
                return new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: inlineToRunsPublic(unquoteCsv(ing.preamble || '')), spacing: { after: 0 } })],
                            borders: cellBorders,
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [
                                    new TextRun({ text: amountMeasure + (amountMeasure ? ' ' : '') }),
                                    new TextRun({ text: unquoteCsv(ing.name), color: 'D2691E', bold: false }),
                                ],
                                spacing: { after: 0 },
                            })],
                            borders: cellBorders,
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: inlineToRunsPublic(unquoteCsv(ing.instruction || '')), spacing: { after: 0 } })],
                            borders: cellBorders,
                        }),
                    ],
                });
            });

            // Subrecipe references in ingredient table
            const subrecipeRefRows = (recipe.subrecipes ?? []).map(sr => new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: sr.name, italics: true, color: '16a085' })], spacing: { after: 0 } })],
                        borders: cellBorders,
                        columnSpan: 3,
                    }),
                ],
            }));

            if (ingredientRows.length > 0 || subrecipeRefRows.length > 0) {
                elements.push(new Table({
                    rows: [...ingredientRows, ...subrecipeRefRows],
                    width: { size: 0, type: WidthType.AUTO },
                    layout: TableLayoutType.AUTOFIT,
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                }));
            }

            if (recipe.closing) {
                elements.push(...markdownToDocx(unquoteCsv(recipe.closing)));
            }

            // Nested subrecipe full sections
            for (const sr of (recipe.subrecipes ?? [])) {
                elements.push(...buildRecipeSection(sr, false));
            }

            // Page break after each top-level recipe (except last)
            if (topLevel) {
                elements.push(new Paragraph({ children: [new PageBreak()] }));
            }

            return elements;
        };

        const allSections: (Paragraph | Table)[] = [];

        // Word native TOC field
        if (recipesToExport.length > 1) {
            // Build a proper Word TOC complex field using XmlComponent.
            // Word will render and update this as a native, clickable TOC when the document is opened.
            class FldChar extends XmlComponent {
                constructor(type: string) {
                    super('w:fldChar');
                    const attrs: Record<string, string> = { 'w:fldCharType': type };
                    if (type === 'begin') attrs['w:dirty'] = 'true';
                    this.root.push(new XmlAttributeComponent(attrs));
                }
            }
            class InstrText extends XmlComponent {
                constructor(text: string) {
                    super('w:instrText');
                    this.root.push(new XmlAttributeComponent({ 'xml:space': 'preserve' }));
                    this.root.push(text as unknown as XmlComponent);
                }
            }
            class FldRun extends XmlComponent {
                constructor(child: XmlComponent) { super('w:r'); this.root.push(child); }
            }
            class TocParagraph extends XmlComponent {
                constructor() {
                    super('w:p');
                    this.root.push(new FldRun(new FldChar('begin')));
                    this.root.push(new FldRun(new InstrText(' TOC \\o "1-3" \\h \\z \\u ')));
                    this.root.push(new FldRun(new FldChar('separate')));
                    this.root.push(new FldRun(new FldChar('end')));
                }
            }

            allSections.push(new TocParagraph() as unknown as Paragraph);
            allSections.push(new Paragraph({ children: [new PageBreak()] }));
        }

        recipesToExport.forEach((recipe, i) => {
            allSections.push(...buildRecipeSection(recipe, true, i));
        });

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: 'Calibri', size: 22 },
                    },
                },
                paragraphStyles: [
                    {
                        id: 'Heading1',
                        name: 'Heading 1',
                        basedOn: 'Normal',
                        next: 'Normal',
                        run: { color: '2c3e50', size: 32, bold: true },
                        paragraph: { spacing: { before: 240, after: 120 } },
                    },
                    {
                        id: 'Heading2',
                        name: 'Heading 2',
                        basedOn: 'Normal',
                        next: 'Normal',
                        run: { color: '16a085', size: 26, bold: true },
                        paragraph: { spacing: { before: 200, after: 100 } },
                    },
                    {
                        id: 'Heading3',
                        name: 'Heading 3',
                        basedOn: 'Normal',
                        next: 'Normal',
                        run: { color: '16a085', size: 24, bold: true },
                        paragraph: { spacing: { before: 160, after: 80 } },
                    },
                ],
            },
            sections: [{
                children: allSections,
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'recipes.docx');
        });
    };

    const handleConfirmExport = () => {
        setIsDialogOpen(false);
        if (isExportAll) {
            exportHtmlContent(htmlContent, 'recipes.html');
        }
        setHtmlContent('');
    };

    const handleCancelExport = () => {
        setIsDialogOpen(false);
        setHtmlContent('');
    };

    const handleViewRecipe = (recipe: Recipe) => {
        handleExportView(recipe);
    };

    const handleCheckboxChange = (recipeId: number) => {
        setSelectedRecipes(prevSelectedRecipes => {
            const newSelectedRecipes = new Set(prevSelectedRecipes);
            if (newSelectedRecipes.has(recipeId)) {
                newSelectedRecipes.delete(recipeId);
            } else {
                newSelectedRecipes.add(recipeId);
            }
            return newSelectedRecipes;
        });
    };

    const handleSelectAllChange = () => {
        if (selectAll) {
            setSelectedRecipes(new Set());
        } else {
            setSelectedRecipes(new Set(recipes.map(recipe => recipe.id)));
        }
        setSelectAll(!selectAll);
    };

    const uniqueCategories = Array.from(new Set(allRecipes.flatMap(recipe =>
        (recipe.categories ?? '').split(',').map(cat => cat.trim()))))
        .filter(category => category !== '')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    const handleCategoryFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategoryFilter(event.target.value);
        if (event.target.value === '') {
            setRecipes(allRecipes);
        } else {
            setRecipes(allRecipes.filter(recipe => recipe.categories.split(',').map(cat => cat.trim()).includes(event.target.value)));
        }
    };

    // @ts-ignore
    return (
        <div>
            {isSourceModalOpen && <SourceModal onClose={handleCloseSourceModal}/>}
            {isTemperatureModalOpen && <TemperaturesModal onClose={handleCloseTemperatureModal}/>}
            {isConversionsModalOpen && <ConversionsModal onClose={handleCloseConversionsModal}/>}
            {isRecipeModalOpen && (
                <RecipeModal
                    recipe={editingRecipe}
                    onCancel={handleCloseRecipeModal}
                    onRecipeSaved={handleRecipeSaved}
                />
            )}
            <div className="standard-form">
                <button onClick={handleOpenSourceModal}>
                    <i className="fas fa-book"></i>
                    Sources
                </button>
                <button onClick={handleOpenConversionsModal}>
                    <i className="fas fa-exchange-alt"></i>
                    Conversions
                </button>
                <button onClick={handleOpenTemperatureModal}>
                    <i className="fas fa-thermometer-half"></i>
                    Temperatures
                </button>
                <label htmlFor="csvFileInput" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem'}}>
                    <i className="fas fa-file-import"></i>
                    Import recipes:
                </label>
                <input id="csvFileInput" type="file" accept=".csv,.txt"
                       onChange={(e) => {
                           // @ts-ignore
                           setCsvFile(e.target.files[0]);
                       }}/>
                {csvFile && <button onClick={handleImport}>
                    <i className="fas fa-upload"></i>
                    Import
                </button>}
                <button onClick={handleOpenSearchPanel} title="Find by content">
                    <i className="fas fa-search"></i>
                    {isSearchPanelOpen ? 'Search' : 'Search'}
                </button>
                {isSearchActive && <button onClick={handleShowAllRecipes}>
                    <i className="fas fa-list"></i>
                    Show All
                </button>}
                {isSearchPanelOpen &&
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Enter regex..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                        style={{flexGrow: 1, minWidth: '200px'}}
                    />}
                {isSearchPanelOpen && <button onClick={handleSearch}>
                    <i className="fas fa-search"></i>
                    Search
                </button>}
                {isSearchPanelOpen && <button onClick={handleCloseSearchPanel}>
                    <i className="fas fa-times"></i>
                    Cancel
                </button>}
                <label htmlFor="categoryFilter" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <i className="fas fa-filter"></i>
                    Category:
                </label>
                <select id="categoryFilter" value={categoryFilter} onChange={handleCategoryFilterChange}>
                    <option value="">All Categories</option>
                    {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <label>
                    <input
                        type="checkbox"
                        checked={includeSubrecipes}
                        onChange={(e) => setIncludeSubrecipes(e.target.checked)}
                    />
                    Include subrecipes
                </label>
            </div>
            <div>
                {apiError && <p className="error">{apiError}</p>}
            </div>
            <div style={{padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
                <button onClick={handleOpenRecipeModal} title="Add recipe">
                    <i className="fas fa-plus"></i>
                </button>
                <button onClick={() => handleExportView()} title="Print layout">
                    <i className="fas fa-print"></i>
                </button>
                <button onClick={() => handleExportCsv()} title="Export to CSV">
                    <i className="fas fa-file-export"></i>
                </button>
                <button onClick={() => handleShoppingList()} title="Export shopping list">
                    <i className="fas fa-shopping-cart"></i>
                </button>
                <button onClick={() => handleExportWord()} title="Export to Word (.docx)">
                    <i className="fas fa-file-word"></i>
                </button>
                <button onClick={handleDeleteMany} title="Delete selected recipes" className="btn-danger">
                    <i className="fas fa-trash"></i>
                </button>
                &nbsp;
                Showing {sortedRecipes.length} recipe{sortedRecipes.length !== 1 ? 's' : ''}
                {categoryFilter && ` in category "${categoryFilter}"`}
                {isSearchActive && ` matching search`}
            </div>
            <table className="recipe-list-table">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAllChange}
                        />
                    </th>
                    <th onClick={() => requestSort('name')}>
                        Name <i className={getSortIcon('name')}></i>
                    </th>
                    <th onClick={() => requestSort('served')}>
                        Served <i className={getSortIcon('served')}></i>
                    </th>
                    <th onClick={() => requestSort('source')}>
                        Source <i className={getSortIcon('source')}></i>
                    </th>
                    <th onClick={() => requestSort('pageRef')}>
                        Page <i className={getSortIcon('pageRef')}></i>
                    </th>
                    <th onClick={() => requestSort('rating')}>
                        Rating <i className={getSortIcon('rating')}></i>
                    </th>
                    <th onClick={() => requestSort('categories')}>
                        Categories <i className={getSortIcon('categories')}></i>
                    </th>
                    <th>

                    </th>
                </tr>
                </thead>
                <tbody>
                {sortedRecipes.map(recipe => (
                    <tr key={recipe.id}>
                        <td>
                            <input
                                type="checkbox"
                                title={`ID: ${recipe.id}`}
                                checked={selectedRecipes.has(recipe.id)}
                                onChange={() => handleCheckboxChange(recipe.id)}
                            />
                        </td>
                        <td>
                            <span
                                onClick={() => editRecipe(recipe)}
                                className="recipe-name-link"
                                title="Click to edit"
                            >
                                {recipe.name}
                            </span>
                        </td>
                        <td>{recipe.served}</td>
                        <td>{recipe.source ? recipe.source.name : ''}</td>
                        <td>{recipe.pageRef}</td>
                        <td className="center">{recipe.rating}</td>
                        <td>{recipe.categories}</td>
                        <td>
                            <button onClick={() => handleViewRecipe(recipe)} title="View">
                                <i className="fas fa-print"></i>
                            </button>
                            <button onClick={() => deleteRecipe(recipe.id)} title="Delete" className="btn-danger">
                                <i className="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {isDialogOpen && (
                <PromptDialog
                    message="Do you want to export the recipes to a file?"
                    onConfirm={handleConfirmExport}
                    onCancel={handleCancelExport}
                />
            )}
        </div>
    );
}

export default RecipeList;
