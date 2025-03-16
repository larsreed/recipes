import RecipeForm from './RecipeForm';

// @ts-expect-error("dont know what to do with this")
const RecipeModal = ({ recipe, onCancel, onRecipeSaved }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onCancel}>&times;</span>
                <RecipeForm
                    recipe={recipe}
                    onCancel={onCancel}
                    onRecipeSaved={onRecipeSaved}
                />
            </div>
        </div>
    );
};

export default RecipeModal;
