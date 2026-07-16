const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const resultsGrid = document.getElementById('results-grid');
const resultsStatus = document.getElementById('results-status');

function renderEmptyState(message) {
  resultsGrid.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
}

function renderBooks(books) {
  if (!books.length) {
    renderEmptyState('No books found. Try another search.');
    return;
  }

  resultsGrid.innerHTML = books
    .map((book) => {
      const info = book.volumeInfo || book;
      const title = info.title || 'Untitled';
      const authors = info.authors?.join(', ') || book.authors?.join(', ') || 'Unknown author';
      const snippet = info.description || book.description || 'More details will appear once the Google Books API is connected.';
      const category = info.categories?.slice(0, 2).join(' • ') || 'Literature';
      const thumbnail = info.imageLinks?.thumbnail || '';

      return `
        <article class="card">
          <div class="card-cover">
            ${thumbnail
              ? `<img src="${thumbnail}" alt="${title} cover" />`
              : '<div class="cover-fallback">📖</div>'}
          </div>
          <div>
            <span class="badge">${category}</span>
            <h3>${title}</h3>
            <p class="author">${authors}</p>
            <p>${snippet}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const query = input.value.trim();

  if (!query) {
    resultsStatus.textContent = 'Please enter a search term.';
    renderEmptyState('Type something to search for books.');
    return;
  }

  resultsStatus.textContent = `Searching for “${query}”...`;
  resultsGrid.innerHTML = '';

  setTimeout(() => {
    renderBooks([
      {
        volumeInfo: {
          title: `${query} Essentials`,
          authors: ['Sample Author'],
          description: 'This placeholder card will be replaced by real Google Books results once the API is configured.',
          categories: ['Design', 'Inspiration']
        }
      },
      {
        volumeInfo: {
          title: `${query} Explorer`,
          authors: ['Future API Setup'],
          description: 'The search UI is ready. The next step is connecting the Google Books API and displaying live results.',
          categories: ['Reading', 'Discovery']
        }
      }
    ]);

    resultsStatus.textContent = `Showing placeholder results for “${query}”.`;
  }, 400);
});
