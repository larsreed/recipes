# Bugs

1. Order of sub recipes (drag/drop) is not saved in the database.
2. the new export function fails
3. and does not include sources
4. import recipes does not work anymore :-O
5. should be able to select a non-existing export file name

# Features

1. Change to common imp-format
2. Make it possible to change order of ingredients
3. ESC to close dialogs (RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first, also for SourceModal
4. Hide the import-buttons until a file is selected
5. Clear file fields after successful import/export
6. upgrade all frontend frameworks, latest React
7. more space in RecipeList
   1. \+ use visible grid
   2. \+ varying colors
   3. \+ hover
8. better layout for sub recipe name list
9. display attachments beside name in RecipeForm if picture types
10. remove the current page break form print view, include a new marker on top level recipes only
11. show error messages as banners, and remove after a while
12. display \n as linebreaks in print view
13. ability to use markdown in larger text fields
    1. \+ visual editor
14. cleanup extraneous logging

# General improvements

1. Add tests...
2. Change to Postgresql
3. Styling & layout

# Suggested file layout
- accept only \t as separator, cannot appear in text
- \\\n in text for line breaks

|  |  |                       |  |  |  |  |  |  | |
| --------- | ----- |-----------------------| ------- | ------------ | ------ | --------------- | ----- | ------ | -------|
| "Source"* | Name* | Authors*  |
| "Recipe"* | Name* | Subrecipe true/false* | people* | rating (1-6) | served |  instructions* | notes | source | pageref|
| "+Ingredient"* | Amount | Measure | Name*  | Instruction |
| "+Subrecipe"* | Name* |
| "+Attachment"* | Name* | Data |
