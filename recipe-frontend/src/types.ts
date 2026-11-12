export interface Attachment {
    id: number;
    fileName: string;
    fileContent: string;
}

export interface Ingredient {
    id: number;
    preamble: string;
    amount: number;
    measure: string;
    prefix: string;
    name: string;
    instruction: string;
}

export interface Source {
    id: number;
    name: string;
    authors: string;
    info?: string;
    title?: string;
    imageFileName?: string;
}

export interface Recipe {
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
    imageFileName?: string;
    ingredients: Ingredient[];
    attachments: Attachment[];
    instructions?: string;
    closing?: string;
    subrecipes?: Recipe[];
}

export interface Conversion {
    id?: number;
    fromMeasure: string;
    toMeasure: string;
    factor: number;
    description?: string;
    preferred?: boolean;
}

export interface Temperature {
    id?: number;
    meat: string;
    temp: number;
    description?: string;
}

export interface ShoppingListItem {
    name: string;
    amount?: number;
    measure?: string;
}
