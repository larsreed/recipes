import type { Ingredient, Recipe } from '../types';

const round2 = (value: number) => parseFloat(value.toFixed(2)).toString();

// Scales an ingredient amount from the recipe's own serving count to the number of guests.
export const scaledAmount = (ingredient: Ingredient, recipe: Recipe, guests: number): string => {
    if (!ingredient.amount) return '';
    return recipe.people > 0
        ? round2((ingredient.amount * guests) / recipe.people)
        : String(ingredient.amount);
};

export const formatAmount = (amount?: number): string => (amount ? round2(amount) : '');

// Asks for the number of guests; returns null when cancelled or invalid.
export const promptGuests = (): number | null => {
    const answer = prompt('Guests', '4');
    const guests = answer ? parseInt(answer) : 0;
    return guests > 0 ? guests : null;
};
