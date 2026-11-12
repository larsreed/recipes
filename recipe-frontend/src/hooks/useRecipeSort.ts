import { useMemo, useState } from 'react';
import type { Recipe } from '../types';

export type SortDirection = 'ascending' | 'descending';
export type SortKey = 'id' | 'name' | 'served' | 'source' | 'pageRef' | 'rating' | 'categories';

const sortableValue = (recipe: Recipe, key: SortKey): string => {
    switch (key) {
        case 'source':
            return recipe.source?.name?.toLowerCase() || '';
        case 'id':
        case 'rating':
            return String(recipe[key] ?? '');
        default:
            return (recipe[key] ?? '').toString().toLowerCase();
    }
};

export function useRecipeSort(recipes: Recipe[]) {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'id',
        direction: 'ascending',
    });

    const sortedRecipes = useMemo(() => {
        const factor = sortConfig.direction === 'ascending' ? 1 : -1;
        return [...recipes].sort((a, b) => {
            const aValue = sortableValue(a, sortConfig.key);
            const bValue = sortableValue(b, sortConfig.key);
            if (aValue < bValue) return -factor;
            if (aValue > bValue) return factor;
            return 0;
        });
    }, [recipes, sortConfig]);

    const requestSort = (key: SortKey) => {
        const direction: SortDirection =
            sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return 'fas fa-sort';
        return sortConfig.direction === 'ascending' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    };

    return { sortedRecipes, requestSort, getSortIcon };
}
