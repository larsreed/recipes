import {
    Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
    BorderStyle, WidthType, PageBreak, TableLayoutType, TableOfContents,
    ImageRun, InternalHyperlink, Bookmark, PageReference, type ParagraphChild,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Conversion, Recipe, Source, Temperature } from '../../types';
import { scaledAmount } from '../scaling';
import { fetchMediaImage, scaleToFit } from './images';
import { markdownToDocx, markdownToRuns, unquoteCsv } from './markdown';

export interface BookAppendices {
    sources: Source[];
    temperatures: Temperature[];
    conversions: Conversion[];
}

type Section = Paragraph | Table | TableOfContents;
type RunList = (TextRun | InternalHyperlink | PageReference)[];

interface ExportContext {
    guests: number;
    bookmarkedRecipeIds: Set<number>;
    linkedSourceIds: Set<number>;
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = {
    top: NO_BORDER,
    bottom: { style: BorderStyle.DOTTED, size: 4, color: '16a085' },
    left: NO_BORDER,
    right: NO_BORDER,
};
const CELL_MARGINS = { left: 120, right: 120 };
const LABEL_COLOR = '555555';
const ACCENT_COLOR = '16a085';

const recipeBookmarkName = (recipeId: number) => `recipe-${recipeId}`;
const sourceBookmarkName = (sourceId: number) => `source-${sourceId}`;

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });
const byName = (a: { name: string }, b: { name: string }) => compareText(a.name, b.name);

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const appendixTitle = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_1 });

const metaParagraph = (label: string, value: string) => new Paragraph({
    children: [
        new TextRun({ text: label, italics: true, color: LABEL_COLOR }),
        new TextRun({ text: value }),
    ],
    spacing: { after: 60 },
});

const imageParagraph = (image: { data: Uint8Array; type: 'jpg' | 'png' | 'gif' | 'bmp'; width: number; height: number },
                        maxSize: number) => {
    const sized = scaleToFit(image, maxSize, maxSize);
    return new Paragraph({
        children: [new ImageRun({
            data: image.data,
            type: image.type,
            transformation: { width: sized.width, height: sized.height },
        })],
        spacing: { after: 180 },
    });
};

const tableCell = (children: Paragraph[], columnSpan?: number) =>
    new TableCell({ children, borders: CELL_BORDERS, margins: CELL_MARGINS, columnSpan });

const cellParagraph = (children: ParagraphChild[]) =>
    new Paragraph({ children, spacing: { after: 0 } });

// Walks recipes and subrecipes, visiting each recipe once per key.
const indexRecipes = (
    recipes: Recipe[],
    keysOf: (recipe: Recipe) => { key: string; name: string }[],
): Map<string, { name: string; recipes: Map<number, Recipe> }> => {
    const index = new Map<string, { name: string; recipes: Map<number, Recipe> }>();
    const visit = (recipe: Recipe) => {
        for (const { key, name } of keysOf(recipe)) {
            if (!index.has(key)) index.set(key, { name, recipes: new Map() });
            index.get(key)?.recipes.set(recipe.id, recipe);
        }
        (recipe.subrecipes ?? []).forEach(visit);
    };
    recipes.forEach(visit);
    return index;
};

const recipeLinkRuns = (recipes: Recipe[], withPageNumbers: boolean): RunList => {
    const runs: RunList = [];
    recipes.sort(byName).forEach((recipe, idx) => {
        if (idx > 0) runs.push(new TextRun({ text: ', ' }));
        const anchor = recipeBookmarkName(recipe.id);
        runs.push(new InternalHyperlink({
            anchor,
            children: [new TextRun({ text: recipe.name, style: 'Hyperlink' })],
        }));
        if (withPageNumbers) {
            runs.push(new TextRun({ text: ' (p. ' }), new PageReference(anchor), new TextRun({ text: ')' }));
        }
    });
    return runs;
};

const sourceLine = (recipe: Recipe, ctx: ExportContext): Paragraph | null => {
    if (!recipe.source) return null;
    const pageRef = recipe.pageRef ? ` p.${recipe.pageRef}` : '';
    if (!ctx.linkedSourceIds.has(recipe.source.id)) {
        return metaParagraph('Source: ', recipe.source.name + pageRef);
    }
    return new Paragraph({
        children: [
            new TextRun({ text: 'Source: ', italics: true, color: LABEL_COLOR }),
            new InternalHyperlink({
                anchor: sourceBookmarkName(recipe.source.id),
                children: [new TextRun({ text: recipe.source.name, style: 'Hyperlink' })],
            }),
            ...(recipe.pageRef ? [new TextRun({ text: pageRef })] : []),
        ],
        spacing: { after: 60 },
    });
};

const ingredientTable = (recipe: Recipe, ctx: ExportContext): Table | null => {
    const ingredientRows = recipe.ingredients.map(ing => {
        const amountMeasure = [scaledAmount(ing, recipe, ctx.guests), ing.measure, ing.prefix].filter(Boolean).join(' ');
        return new TableRow({
            children: [
                tableCell([cellParagraph(markdownToRuns(unquoteCsv(ing.preamble || '')))]),
                tableCell([cellParagraph([
                    new TextRun({ text: amountMeasure + (amountMeasure ? ' ' : '') }),
                    new TextRun({ text: unquoteCsv(ing.name), color: 'D2691E', bold: false }),
                ])]),
                tableCell([cellParagraph(markdownToRuns(unquoteCsv(ing.instruction || '')))]),
            ],
        });
    });

    const subrecipeRows = (recipe.subrecipes ?? []).map(sr => new TableRow({
        children: [tableCell(
            [cellParagraph([new TextRun({ text: sr.name, italics: true, color: ACCENT_COLOR })])],
            3,
        )],
    }));

    if (ingredientRows.length === 0 && subrecipeRows.length === 0) return null;
    return new Table({
        rows: [...ingredientRows, ...subrecipeRows],
        width: { size: 0, type: WidthType.AUTO },
        layout: TableLayoutType.AUTOFIT,
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
    });
};

const buildRecipeSection = async (recipe: Recipe, topLevel: boolean, ctx: ExportContext): Promise<Section[]> => {
    const elements: Section[] = [];

    // Only the first occurrence of a recipe gets the bookmark, so links stay unambiguous.
    const shouldAddBookmark = !ctx.bookmarkedRecipeIds.has(recipe.id);
    ctx.bookmarkedRecipeIds.add(recipe.id);

    const headingText = topLevel ? recipe.name : `» ${recipe.name}`;
    const headingChild = shouldAddBookmark
        ? new Bookmark({ id: recipeBookmarkName(recipe.id), children: [new TextRun(headingText)] })
        : new TextRun(headingText);
    elements.push(new Paragraph({
        children: [headingChild],
        heading: topLevel ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: topLevel ? 0 : 400, after: 200 },
    }));

    const recipeImage = await fetchMediaImage(recipe.imageFileName);
    if (recipeImage) elements.push(imageParagraph(recipeImage, 360));

    if (recipe.served) elements.push(metaParagraph('Served: ', unquoteCsv(recipe.served)));
    const source = sourceLine(recipe, ctx);
    if (source) elements.push(source);
    if (recipe.rating) elements.push(metaParagraph('Rating: ', String(recipe.rating)));
    if (recipe.wineTips) elements.push(...markdownToDocx('*Wine tips*: ' + unquoteCsv(recipe.wineTips)));
    if (recipe.matchFor) elements.push(...markdownToDocx('*Match for*: ' + unquoteCsv(recipe.matchFor)));
    if (recipe.categories) elements.push(metaParagraph('Categories: ', recipe.categories.replace(/,/g, ' ')));
    if (recipe.notes) elements.push(...markdownToDocx('*Notes*: ' + unquoteCsv(recipe.notes)));
    if (recipe.instructions) elements.push(...markdownToDocx(unquoteCsv(recipe.instructions)));

    elements.push(new Paragraph({
        children: [new TextRun({ text: 'Ingredients', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 },
    }));
    const table = ingredientTable(recipe, ctx);
    if (table) elements.push(table);

    if (recipe.closing) elements.push(...markdownToDocx(unquoteCsv(recipe.closing)));
    for (const sr of recipe.subrecipes ?? []) {
        elements.push(...await buildRecipeSection(sr, false, ctx));
    }
    if (topLevel) elements.push(pageBreak());
    return elements;
};

const buildBookCover = (): Section[] => [
    new Paragraph({ text: 'My Recipes', heading: HeadingLevel.HEADING_1, spacing: { before: 2000, after: 300 } }),
    new Paragraph({
        children: [new TextRun({ text: `Generated ${new Date().toLocaleDateString()}` })],
        spacing: { after: 400 },
    }),
    new Paragraph({
        children: [new TextRun({
            text: 'All recipes are for 4 people, unless otherwise mentioned',
            italics: true,
            color: LABEL_COLOR,
        })],
        spacing: { after: 600 },
    }),
    pageBreak(),
];

const buildSourcesAppendix = async (
    sources: Source[],
    recipesToExport: Recipe[],
): Promise<Section[]> => {
    const recipesBySource = indexRecipes(
        recipesToExport,
        recipe => recipe.source ? [{ key: String(recipe.source.id), name: recipe.source.name }] : [],
    );
    const sorted = [...sources].sort(byName);
    const sections: Section[] = [pageBreak(), appendixTitle('Appendix: Sources')];

    for (let index = 0; index < sorted.length; index++) {
        const source = sorted[index];
        sections.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new Bookmark({ id: sourceBookmarkName(source.id), children: [new TextRun(source.name)] })],
        }));
        if (source.authors) sections.push(metaParagraph('Authors: ', source.authors));
        if (source.title) sections.push(metaParagraph('Title: ', source.title));
        if (source.info) sections.push(...markdownToDocx(source.info));

        const image = await fetchMediaImage(source.imageFileName);
        if (image) sections.push(imageParagraph(image, 180));

        const sourceRecipes = [...(recipesBySource.get(String(source.id))?.recipes.values() ?? [])];
        if (sourceRecipes.length > 0) {
            sections.push(new Paragraph({
                children: [new TextRun({ text: 'Recipes: ', italics: true, color: LABEL_COLOR }), ...recipeLinkRuns(sourceRecipes, false)],
                spacing: { after: 100 },
            }));
        }

        if (index < sorted.length - 1) {
            sections.push(new Paragraph({
                border: { bottom: { color: 'D9D9D9', size: 6, space: 1, style: BorderStyle.SINGLE } },
                spacing: { before: 120, after: 120 },
            }));
        }
    }
    return sections;
};

const buildTemperaturesAppendix = (temperatures: Temperature[]): Section[] => [
    pageBreak(),
    appendixTitle('Appendix: Temperatures'),
    ...[...temperatures]
        .sort((a, b) => compareText(a.meat, b.meat))
        .map(temperature => new Paragraph({
            children: [
                new TextRun({ text: `${temperature.meat}: `, bold: true }),
                new TextRun({ text: `${temperature.temp} C` }),
                ...(temperature.description ? [new TextRun({ text: ` - ${temperature.description}` })] : []),
            ],
            spacing: { after: 60 },
        })),
];

const buildConversionsAppendix = (conversions: Conversion[]): Section[] => {
    const label = (c: Conversion) => `${c.fromMeasure}-${c.toMeasure}`;
    return [
        pageBreak(),
        appendixTitle('Appendix: Conversions'),
        ...[...conversions]
            .sort((a, b) => compareText(label(a), label(b)))
            .map(conversion => new Paragraph({
                children: [
                    new TextRun({ text: `${conversion.fromMeasure} -> ${conversion.toMeasure}: `, bold: true }),
                    new TextRun({ text: `${conversion.factor}` }),
                    ...(conversion.description ? [new TextRun({ text: ` (${conversion.description})` })] : []),
                    ...(conversion.preferred ? [new TextRun({ text: ' [preferred]', italics: true, color: ACCENT_COLOR })] : []),
                ],
                spacing: { after: 60 },
            })),
    ];
};

const buildCrossReference = (
    title: string,
    index: Map<string, { name: string; recipes: Map<number, Recipe> }>,
): Section[] => [
    pageBreak(),
    appendixTitle(title),
    ...[...index.values()].sort(byName).map(entry => new Paragraph({
        children: [new TextRun({ text: `${entry.name}: `, bold: true }), ...recipeLinkRuns([...entry.recipes.values()], true)],
        spacing: { after: 40 },
    })),
];

const ingredientKeys = (recipe: Recipe) => recipe.ingredients
    .map(ingredient => (ingredient.name || '').trim())
    .filter(name => name !== '')
    .map(name => ({ key: name.toLowerCase(), name }));

const categoryKeys = (recipe: Recipe) => (recipe.categories || '').split(',')
    .map(raw => raw.trim())
    .filter(name => name !== '')
    .map(name => ({ key: name.toLowerCase(), name }));

const headingStyle = (id: string, name: string, color: string, size: number, before: number, after: number) => ({
    id,
    name,
    basedOn: 'Normal',
    next: 'Normal',
    run: { color, size, bold: true },
    paragraph: { spacing: { before, after } },
});

const createDocument = (children: Section[]) => new Document({
    styles: {
        default: { document: { run: { font: 'Calibri', size: 22 } } },
        paragraphStyles: [
            headingStyle('Heading1', 'Heading 1', '2c3e50', 32, 240, 120),
            headingStyle('Heading2', 'Heading 2', ACCENT_COLOR, 26, 200, 100),
            headingStyle('Heading3', 'Heading 3', ACCENT_COLOR, 24, 160, 80),
        ],
    },
    sections: [{ children }],
});

// Builds a .docx and triggers a download. With bookAppendices the result is a full recipe book
// (cover, sources, temperatures, conversions and cross-references).
export const exportToWord = async (
    recipesToExport: Recipe[],
    guests: number,
    fileName: string,
    bookAppendices?: BookAppendices,
) => {
    const ctx: ExportContext = {
        guests,
        bookmarkedRecipeIds: new Set(),
        linkedSourceIds: new Set(bookAppendices?.sources.map(s => s.id)),
    };
    const sections: Section[] = [];

    if (bookAppendices) sections.push(...buildBookCover());
    if (bookAppendices || recipesToExport.length > 1) {
        sections.push(
            new TableOfContents('Table of Contents', { headingStyleRange: '1-3', hyperlink: true }),
            pageBreak(),
        );
    }

    for (const recipe of recipesToExport) {
        sections.push(...await buildRecipeSection(recipe, true, ctx));
    }

    if (bookAppendices) {
        sections.push(
            ...await buildSourcesAppendix(bookAppendices.sources, recipesToExport),
            ...buildTemperaturesAppendix(bookAppendices.temperatures),
            ...buildConversionsAppendix(bookAppendices.conversions),
            ...buildCrossReference('Appendix: Ingredient Cross-reference', indexRecipes(recipesToExport, ingredientKeys)),
            ...buildCrossReference('Appendix: Category Cross-reference', indexRecipes(recipesToExport, categoryKeys)),
        );
    }

    saveAs(await Packer.toBlob(createDocument(sections)), fileName);
};
