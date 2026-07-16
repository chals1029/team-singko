const API_KEY = 'AIzaSyD8WrncOWxM0cCrcgn21yrWVjjakiT7O98';
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
      const info = book.volumeInfo || {};
      const title = info.title || 'Untitled';
      const authors = info.authors?.join(', ') || 'Unknown author';
      const category = info.categories?.slice(0, 2).join(' • ') || 'Literature';
      const thumbnail = info.imageLinks?.thumbnail || '';
      const preview = info.description ? info.description.replace(/<[^>]+>/g, '').slice(0, 120) + '…' : 'Tap to view more details about this title.';
      const previewText = preview.replace(/\s+/g, ' ').trim();
      const infoLink = book.infoLink || '#';

      return `
        <article class="card" data-title="${title}" data-authors="${authors}" data-category="${category}" data-description="${(info.description || 'No description available for this title.').replace(/"/g, '&quot;')}" data-thumbnail="${thumbnail}" data-link="${infoLink}">
          <div class="card-cover">
            ${thumbnail
              ? `<img src="${thumbnail}" alt="${title} cover" />`
              : '<div class="cover-fallback">📖</div>'}
          </div>
          <div class="card-body">
            <span class="badge">${category}</span>
            <h3>${title}</h3>
            <p class="author">${authors}</p>
            <p class="card-preview">${previewText}</p>
            <button class="card-button" type="button">View details</button>
          </div>
        </article>
      `;
    })
    .join('');

  resultsGrid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      openBookModal(card.dataset);
    });
  });
}

function openBookModal(book) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <button class="modal-close" type="button" aria-label="Close details">×</button>
      <div class="modal-cover">
        ${book.thumbnail
          ? `<img src="${book.thumbnail}" alt="${book.title} cover" />`
          : '<div class="cover-fallback">📖</div>'}
      </div>
      <div class="modal-content">
        <span class="badge">${book.category}</span>
        <h3>${book.title}</h3>
        <p class="author">${book.authors}</p>
        <p>${book.description || 'No description available for this title.'}</p>
        <a href="${book.link}" target="_blank" rel="noreferrer">Open in Google Books</a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.classList.contains('modal-close')) {
      modal.remove();
    }
  });
}

async function searchBooks(query) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function loadRandomBook() {
  const randomQueries = ['fiction', 'science', 'inspiration', 'history', 'mystery'];
  const query = randomQueries[Math.floor(Math.random() * randomQueries.length)];

  resultsStatus.textContent = 'Loading a featured book...';
  resultsGrid.innerHTML = '';

  try {
    const books = await searchBooks(query);
    renderBooks(books.slice(0, 4));
    resultsStatus.textContent = `Showing featured books for “${query}”.`;
  } catch (error) {
    console.error(error);
    resultsStatus.textContent = 'Unable to load a featured book.';
    renderEmptyState('The Google Books API could not be reached right now.');
  }
}

loadRandomBook();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const query = input.value.trim();

  if (!query) {
    resultsStatus.textContent = 'Please enter a search term.';
    renderEmptyState('Type something to search for books.');
    return;
  }

  resultsStatus.textContent = `Searching for “${query}”...`;
  resultsGrid.innerHTML = '';

  try {
    const books = await searchBooks(query);
    renderBooks(books);

    resultsStatus.textContent = books.length
      ? `Showing ${books.length} result${books.length === 1 ? '' : 's'} for “${query}”.`
      : `No books found for “${query}”.`;
  } catch (error) {
    console.error(error);
    resultsStatus.textContent = `Unable to load results for “${query}”.`;
    renderEmptyState('The Google Books API could not be reached right now.');
  }
});
