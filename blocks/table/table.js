import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // Create table element
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Process each row
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    // Process each cell in the row
    [...row.children].forEach((cell, cellIndex) => {
      // Determine if this is a header row (first row) or data row
      const isHeaderRow = rowIndex === 0;
      const cellElement = isHeaderRow ? document.createElement('th') : document.createElement('td');
      
      // Move content from original cell
      while (cell.firstChild) {
        cellElement.appendChild(cell.firstChild);
      }
      
      // Move instrumentation attributes
      moveInstrumentation(cell, cellElement);
      
      tr.appendChild(cellElement);
    });

    // Add to thead if first row, otherwise tbody
    if (rowIndex === 0) {
      thead.appendChild(tr);
    } else {
      tbody.appendChild(tr);
    }
  });

  // Assemble table
  table.appendChild(thead);
  if (tbody.children.length > 0) {
    table.appendChild(tbody);
  }

  // Clear block and add table
  block.textContent = '';
  block.appendChild(table);
}
