export const printStyles = `
    @page {
        size: A4;
        margin: 0;
    }
    @media print {
      @page {
        margin-top: 0.5in;
        margin-bottom: 0.75in;
        margin-left: 1in;
        margin-right: 1in;
      }
    }
    body {
        font-family: Calibri, sans-serif;
        background-color: #FFFFFF;
        background-image: none;
        color: #000000;
        margin: 0;
        overflow: auto;
        position: relative;
        box-sizing: border-box;
        width: 210mm;
        height: 296mm;
    }
    .noborder {
        border:none;
        border-collapse: collapse;
    }
    .recipe {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .recipe h2 {
        margin-top: 0;
        color: #2c3e50;
    }
    .recipe p {
        margin: 5px 0;
    }
    .recipe h3 {
        margin-bottom: 10px;
        color: #16a085;
    }
    .recipe ul {
        list-style-type: none;
        padding: 0;
    }
    .recipe ul li {
        margin-bottom: 5px;
    }
    .ingredient {
        margin-bottom: 20px;
        border-bottom: 1px dotted #16a085;
    }
    .ingredient-cell {
        vertical-align: top;
        padding: 0 8px;
    }
    .ingredient-name {
        color: chocolate;
    }
    .recipe-media {
        float: right;
        width: 35%;
        max-width: 220px;
        margin: 0 0 12px 16px;
        text-align: center;
    }
    .recipe-media img {
        width: 100%;
        max-width: 220px;
        max-height: 220px;
        object-fit: contain;
        border: 1px solid #ddd;
        border-radius: 6px;
    }
    .instructions {
        margin-top: 20px;
    }
    .attachment {
        margin-top: 20px;
    }
    .attachment img {
        max-width: 100%;
        height: auto;
    }
    .toc {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        page-break-after: always;
    }
    .toc h2 { color: #2c3e50; }
    .toc ul { list-style: none; padding: 0; }
    .toc ul li { margin: 6px 0; }
    .toc a { color: #16a085; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
`;

export const shoppingListStyles = `
    body { font-family: Arial, sans-serif; margin: 20px; font-size: smaller; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 3px; text-align: left; }
    th { background-color: #f4f4f4; }
`;
