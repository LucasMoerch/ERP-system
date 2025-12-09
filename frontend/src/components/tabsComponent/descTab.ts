export function renderDescriptionTab(description: string): string {
  const content = description
    ? `<p class="mb-0 value" data-field="description">${description}</p>`
    : `<p class="mb-0 text-muted fst-italic" data-field="description">No description available.</p>`;

  return `
    <div class="p-3">
      <h6 class="text-uppercase text-muted mb-2">Description</h6>
      <div class="bg-light rounded py-2 px-3">
        ${content}
      </div>
    </div>
  `;
}
