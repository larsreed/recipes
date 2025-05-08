# Bugs

1. Order of sub recipes (drag/drop) is not saved in the database.


# Features

1. create a shopping list from selected (at least one) recipes, including subrecipes
2. Make it possible to change order of ingredients
3. make it possible to group ingredients
4. ESC to close dialogs (RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first, also for SourceModal
5. Hide the import-buttons until a file is selected
6. Clear file fields after successful import/export
7. upgrade all frontend frameworks, latest React
8. more space in RecipeList
9. \+ use visible grid
10. \+ varying colors
11. \+ hover
12. better layout for sub recipe name list
13. display attachments beside name in RecipeForm if picture types
14. remove the current page break form print view, include a new marker on top level recipes only
15. show error messages as banners, and remove after a while
16. display \n as linebreaks in print view
17. ability to use markdown in larger text fields
    1. \+ visual editor
18. export - should only export referenced sources, not all, if a subset of recipes is exported
19. cleanup extraneous logging

# General improvements

1. Add tests...
2. Change to Postgresql
3. Styling & layout

# Suggested file layout
- accept only \t as separator, cannot appear in text
- \\\n in text for line breaks

|  |               |                                                    |  |  |  |  |  |  | |
| --------- |---------------|----------------------------------------------------| ------- | ------------ | ------ | --------------- | ----- | ------ | -------|
| "Source"* | Name* | Authors*   |
| "Recipe"* | Name*   | Subrecipe true/false*   | people* | rating (1-6) | served |  instructions* | notes | source | pageref|
| "+Ingredient"* | Prefix | Amount | Measure | Name*  | Instruction |
| "+Subrecipe"* | Name*   |
| "+Attachment"* | Name*  | Data |
