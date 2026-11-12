import axios from 'axios';
import config from '../config';
import type { Conversion, Recipe, ShoppingListItem, Source, Temperature } from '../types';

const recipesUrl = `${config.backendUrl}/api/recipes`;
const jsonHeaders = { 'Content-Type': 'application/json' };

export const mediaUrl = (fileName: string) => `${recipesUrl}/media/${encodeURIComponent(fileName)}`;

export const fetchRecipes = (includeSubrecipes: boolean) =>
    axios.get<Recipe[]>(`${recipesUrl}?includeSubrecipes=${includeSubrecipes}`).then(r => r.data);

export const searchRecipes = (query: string) =>
    axios.get<Recipe[]>(`${recipesUrl}/search?query=${encodeURIComponent(query)}`).then(r => r.data);

export const deleteRecipe = (id: number) => axios.delete(`${recipesUrl}/${id}`);

export const deleteRecipes = (ids: number[]) =>
    axios.post(`${recipesUrl}/delete-many`, ids, { headers: jsonHeaders });

export const importRecipes = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${recipesUrl}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
};

// A null body exports all recipes
export const exportRecipesAsText = (ids: number[] | null) =>
    axios.post<string>(`${recipesUrl}/export-all`, ids, { headers: jsonHeaders }).then(r => r.data);

export const fetchShoppingList = (recipeIds: number[] | null, guests: number) =>
    axios.post<ShoppingListItem[]>(`${recipesUrl}/shopping-list`, { recipeIds, guests }, { headers: jsonHeaders })
        .then(r => r.data);

export const fetchMediaBytes = (fileName: string) =>
    axios.get<ArrayBuffer>(mediaUrl(fileName), { responseType: 'arraybuffer' }).then(r => r.data);

export const fetchBookData = async () => {
    const [recipes, sources, temperatures, conversions] = await Promise.all([
        fetchRecipes(false),
        axios.get<Source[]>(`${config.backendUrl}/api/sources`).then(r => r.data),
        axios.get<Temperature[]>(`${config.backendUrl}/api/temperatures`).then(r => r.data),
        axios.get<Conversion[]>(`${config.backendUrl}/api/conversions`).then(r => r.data),
    ]);
    return { recipes, sources, temperatures, conversions };
};
