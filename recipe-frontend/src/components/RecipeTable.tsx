import type { Recipe } from '../types';
import type { SortKey } from '../hooks/useRecipeSort';

interface RecipeTableProps {
    recipes: Recipe[];
    selectedIds: Set<number>;
    allSelected: boolean;
    getSortIcon: (key: SortKey) => string;
    onSort: (key: SortKey) => void;
    onToggleAll: () => void;
    onToggle: (id: number) => void;
    onEdit: (recipe: Recipe) => void;
    onView: (recipe: Recipe) => void;
    onDelete: (id: number) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'served', label: 'Served' },
    { key: 'source', label: 'Source' },
    { key: 'pageRef', label: 'Page' },
    { key: 'rating', label: 'Rating' },
    { key: 'categories', label: 'Categories' },
];

function RecipeTable({
    recipes, selectedIds, allSelected, getSortIcon,
    onSort, onToggleAll, onToggle, onEdit, onView, onDelete,
}: RecipeTableProps) {
    return (
        <table className="recipe-list-table">
            <thead>
            <tr>
                <th>
                    <input type="checkbox" checked={allSelected} onChange={onToggleAll}/>
                </th>
                {COLUMNS.map(({ key, label }) => (
                    <th key={key} onClick={() => onSort(key)}>
                        {label} <i className={getSortIcon(key)}></i>
                    </th>
                ))}
                <th></th>
            </tr>
            </thead>
            <tbody>
            {recipes.map(recipe => (
                <tr key={recipe.id}>
                    <td>
                        <input
                            type="checkbox"
                            title={`ID: ${recipe.id}`}
                            checked={selectedIds.has(recipe.id)}
                            onChange={() => onToggle(recipe.id)}
                        />
                    </td>
                    <td>
                        <span onClick={() => onEdit(recipe)} className="recipe-name-link" title="Click to edit">
                            {recipe.name}
                        </span>
                    </td>
                    <td>{recipe.served}</td>
                    <td>{recipe.source ? recipe.source.name : ''}</td>
                    <td>{recipe.pageRef}</td>
                    <td className="center">{recipe.rating}</td>
                    <td>{recipe.categories}</td>
                    <td>
                        <button onClick={() => onView(recipe)} title="View">
                            <i className="fas fa-print"></i>
                        </button>
                        <button onClick={() => onDelete(recipe.id)} title="Delete" className="btn-danger">
                            <i className="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default RecipeTable;
