import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // Create modal structure
  const triggerRow = rows[0];
  const contentRow = rows.length > 1 ? rows[1] : null;

  // Create trigger button wrapper
  const triggerWrapper = document.createElement('div');
  triggerWrapper.className = 'modal-trigger-wrapper';
  moveInstrumentation(triggerRow, triggerWrapper);

  // Extract trigger button text from first row or use default
  let triggerText = 'Open Modal';
  if (triggerRow) {
    const textContent = triggerRow.textContent.trim();
    if (textContent) {
      triggerText = textContent;
    }
    // Move any content from trigger row
    while (triggerRow.firstChild) {
      triggerWrapper.appendChild(triggerRow.firstChild);
    }
  }

  // Create modal structure
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  const modalDialog = document.createElement('div');
  modalDialog.className = 'modal-dialog';

  // Create modal header
  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';

  // Extract title from content row or use default
  let modalTitle = '';
  if (contentRow) {
    const titleElement = contentRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (titleElement) {
      modalTitle = titleElement.textContent.trim();
    }
  }

  const modalTitleElement = document.createElement('h2');
  modalTitleElement.className = 'modal-title';
  modalTitleElement.textContent = modalTitle || 'Modal Title';

  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.setAttribute('aria-label', 'Close modal');
  closeButton.innerHTML = '&times;';
  closeButton.type = 'button';

  modalHeader.appendChild(modalTitleElement);
  modalHeader.appendChild(closeButton);

  // Create modal body
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  if (contentRow) {
    moveInstrumentation(contentRow, modalBody);
    // Move all content except the title
    [...contentRow.children].forEach((child) => {
      if (!child.matches('h1, h2, h3, h4, h5, h6')) {
        modalBody.appendChild(child.cloneNode(true));
      }
    });
    // If no children were moved, use the text content
    if (modalBody.children.length === 0 && contentRow.textContent.trim()) {
      modalBody.innerHTML = contentRow.innerHTML;
    }
  }

  // Assemble modal
  modalDialog.appendChild(modalHeader);
  modalDialog.appendChild(modalBody);
  modal.appendChild(modalDialog);

  // Create trigger button if not exists
  let triggerButton = triggerWrapper.querySelector('a.button, button');
  if (!triggerButton) {
    triggerButton = document.createElement('button');
    triggerButton.className = 'button modal-trigger';
    triggerButton.textContent = triggerText;
    triggerWrapper.appendChild(triggerButton);
  } else {
    triggerButton.classList.add('modal-trigger');
  }

  // Add event listeners
  const openModal = () => {
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.focus();
  };

  const closeModal = () => {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    triggerButton.focus();
  };

  triggerButton.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  closeButton.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Clear block and add elements
  block.textContent = '';
  block.appendChild(triggerWrapper);
  block.appendChild(modal);
}
