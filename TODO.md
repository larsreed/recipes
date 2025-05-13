# Bugs



# Features

1. ESC to close dialogs (RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first, also for SourceModal
2. Hide the import-buttons until a file is selected
3. Clear file fields after successful import/export
4. upgrade all frontend frameworks, latest React
5. varying color in RecipeList
6. display attachments beside name in RecipeForm if picture types
7. remove the current page break form print view, include a new marker on top level recipes only
8. show error messages as banners, and remove after a while
9. display \n as linebreaks in print view
10. ability to use markdown in larger text fields
    1. \+ visual editor
11. export - should only export referenced sources, not all, if a subset of recipes is exported
12. cleanup extraneous logging
13. add up amounts on shopping list
14. make it possible to group ingredients

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
