# Bugs

3. Order of sub recipes (drag/drop) is not saved in the database.
4. if measure is blank, it is printed as "null" in the recipe

# Features

2. Change to common imp/exp-format
3. Make it possible to change order of ingredients
4. ESC to close dialogs (Source, RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first
5. Hide the import-buttons until a file is selected
6. Clear file fields after successful import/export
7. Sortable recipe list
8. Refactor localhost-addresses
9. upgrade all frontend frameworks, latest React
10. turn on dependabot
11. make number of people default to 4 for new recipe
12. more space in RecipeList
    1. \+ use visible grid
    2. \+ varying colors
    3. \+ hover
13. better layout for sub recipe name list
14. display attachments beside name in RecipeForm if picture types
15. remove the current page break form print view, include a new marker on top level recipes only
16. show error messages as banners, and remove after a while
17. display \n as linebreaks in print view
18. ability to use markdown in larger text fields
    1. \+ visual editor
19. new logo / favicon

# General improvements

1. Add tests...
2. Change to Postgresql
3. Styling & layout

# Suggested file layout
- accept only \t as separator, cannot appear in text
- \\\n in text for line breaks

|  |  |   |  |  |  |  |  |  | |
| --------- | ----- |-----------------------| ------- | ------------ | ------ | --------------- | ----- | ------ | -------|
| "Source"* | Name* | Authors*              |
| "Recipe"* | Name* | Subrecipe true/false* | people* | rating (1-6) | served |  instructions* | notes | source | pageref|
| "+Ingredient"* | Amount | Measure               | Name*  | Instruction |
| "+Subrecipe"* | Name* |
| "+Attachment"* | Name* | Data |
