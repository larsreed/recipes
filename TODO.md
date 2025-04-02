# Bugs

1. Order of sub recipes (drag/drop) is not saved in the database.

# Features

1. default to 4 people in a new recipe
2. remove source from recipe
3. sort the Source list in RecipeForm
4. Change to common imp/exp-format
5. Make it possible to change order of ingredients
6. ESC to close dialogs (RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first, also for SourceModal
7. Hide the import-buttons until a file is selected
8. Clear file fields after successful import/export
9. Sortable recipe list
10. upgrade all frontend frameworks, latest React
12. turn on dependabot
13. make number of people default to 4 for new recipe
14. more space in RecipeList
    1. \+ use visible grid
    2. \+ varying colors
    3. \+ hover
15. better layout for sub recipe name list
16. display attachments beside name in RecipeForm if picture types
17. remove the current page break form print view, include a new marker on top level recipes only
18. show error messages as banners, and remove after a while
19. display \n as linebreaks in print view
20. ability to use markdown in larger text fields
    1. \+ visual editor
21. new logo / favicon
22. cleanup extraneous logging

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
