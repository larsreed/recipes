# Bugs

1. Attachments arent saved  anymore!
2. Ingredients are not saved anymore!
2. Order of subrecipes (drag/drop) is not saved in the database.

# Features

1. Change to common imp/exp-format
2. Make it possible to change order of ingredients
3. ESC to close dialogs (Source, RecipeForm)
    1. check if dirty first
4. Hide the import-buttons until a file is selected
5. Clear file fields after succesful import/export
6. Sortable recipelist
7. Refactor localhost-adresses
8. upgrade all frontend frameworks, latest React
9. turn on dependabot
10. make number of people default to 4 for new recipe
11. more space in RecipeList
    1. + use visible grid
    2. + varying colors
    3. + hover
12. better layout for subrecipe name list
13. display attachments beside name in RecipeForm if picture types
14. remove the current page break form print view, include a new marker on top level recipes only
15. show error messages as banners, and remove after a while
16. display \n as linebreaks in print view
17. ability to use markdown in larger text fields
    1. + visual editor

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
