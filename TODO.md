# Bugs

1. Order of sub recipes (drag/drop) is not saved in the database.
2. if measure is blank, it is printed as "null" in the recipe
3. when trying to update a Source, i get the error "Source name must be unique"
4. Cancel in Edit Sources does not close the dialog
5. winetips - react-dom-client.development.js:17812  A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://react.dev/link/controlled-components
6. when creating a new recipe, attachments are not saved
7. if no source is given, insert fails (constraint violation)

# Features

1. default to 4 people in a new recipe
2. remove source from recipe
3. sort the Source list in RecipeForm
4. include wine tips in the search
5. Change to common imp/exp-format
6. Make it possible to change order of ingredients
7. ESC to close dialogs (Source, RecipeForm, do you want YES=ENter,ESC=no)
    1. check if dirty first
8. Hide the import-buttons until a file is selected
9. Clear file fields after successful import/export
10. Sortable recipe list
11. Refactor localhost-addresses
12. upgrade all frontend frameworks, latest React
13. turn on dependabot
14. make number of people default to 4 for new recipe
15. more space in RecipeList
    1. \+ use visible grid
    2. \+ varying colors
    3. \+ hover
16. better layout for sub recipe name list
17. display attachments beside name in RecipeForm if picture types
18. remove the current page break form print view, include a new marker on top level recipes only
19. show error messages as banners, and remove after a while
20. display \n as linebreaks in print view
21. ability to use markdown in larger text fields
    1. \+ visual editor
22. new logo / favicon

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
