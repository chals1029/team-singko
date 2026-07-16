// This is the API key that lets us request book data from Google Books.
const API_KEY = 'AIzaSyD8WrncOWxM0cCrcgn21yrWVjjakiT7O98';
const RESULTS_PER_PAGE = 10;

// Select the important page elements we need to update later.
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const resultsGrid = document.getElementById('results-grid');
const resultsStatus = document.getElementById('results-status');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const pageInfo = document.getElementById('page-info');
const favoritesButton = document.getElementById('favorites-button');

// Track search and favorite state.
let currentQuery = '';
let currentPage = 1;
let totalItems = 0;
let showingFavorites = false;
const favoriteBooks = new Map(
  JSON.parse(localStorage.getItem('favoriteBooks') || '[]').map((item) => [item.key, item])
);

// Show a simple message when there are no search results.
function renderEmptyState(message) {
  resultsGrid.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
}

function saveFavoritesToStorage() {
  localStorage.setItem('favoriteBooks', JSON.stringify([...favoriteBooks.values()]));
}

function updateFavoriteButtons() {
  resultsGrid.querySelectorAll('.favorite-button').forEach((button) => {
    const key = button.dataset.key;
    const isActive = favoriteBooks.has(key);
    button.textContent = isActive ? '★ Favorite' : '☆ Favorite';
    button.classList.toggle('active', isActive);
  });
}

function toggleFavorite(book) {
  if (!book.key) {
    return;
  }

  if (favoriteBooks.has(book.key)) {
    favoriteBooks.delete(book.key);
  } else {
    favoriteBooks.set(book.key, {
      key: book.key,
      title: book.title,
      authors: book.authors,
      category: book.category,
      description: book.description,
      thumbnail: book.thumbnail,
      link: book.link,
    });
  }

  saveFavoritesToStorage();
  if (showingFavorites) {
    renderFavoritesView();
  } else {
    updateFavoriteButtons();
  }
}

function renderFavoritesView() {
  showingFavorites = true;
  favoritesButton.textContent = 'Show search';
  const favoritesArray = [...favoriteBooks.values()];

  if (!favoritesArray.length) {
    resultsStatus.textContent = 'No favorites yet.';
    renderEmptyState('Mark books as favorites to see them here.');
    pageInfo.textContent = `Saved: 0`;
    prevButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  renderBooks(favoritesArray);
  resultsStatus.textContent = `Showing ${favoritesArray.length} favorite${favoritesArray.length === 1 ? '' : 's'}.`;
  pageInfo.textContent = `Saved: ${favoritesArray.length}`;
  prevButton.disabled = true;
  nextButton.disabled = true;
}

// Build the book cards and attach click handlers for details and favorites.
function renderBooks(books) {
  if (!books.length) {
    renderEmptyState('No books found. Try another search.');
    return;
  }

  resultsGrid.innerHTML = books
    .map((book) => {
      const info = book.volumeInfo || {};
      const title = info.title || book.title || 'Untitled';
      const authors = info.authors?.join(', ') || book.authors || 'Unknown author';
      const category = info.categories?.slice(0, 2).join(' • ') || book.category || 'Literature';
      const thumbnail = info.imageLinks?.thumbnail || book.thumbnail || '';
      const rawDescription = info.description || book.description || '';
      const preview = rawDescription
        ? rawDescription.replace(/<[^>]+>/g, '').slice(0, 120) + '…'
        : 'Tap to view more details about this title.';
      const previewText = preview.replace(/\s+/g, ' ').trim();
      const infoLink = book.infoLink || book.link || '#';
      const key = `${title}|${authors}`;
      const isFavorite = favoriteBooks.has(key);

      return `
        <article class="card" data-key="${key}" data-title="${title}" data-authors="${authors}" data-category="${category}" data-description="${(info.description || 'No description available for this title.').replace(/"/g, '&quot;')}" data-thumbnail="${thumbnail}" data-link="${infoLink}">
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
            <div class="card-actions">
              <button class="card-button" type="button">View details</button>
              <button class="favorite-button ${isFavorite ? 'active' : ''}" type="button" data-key="${key}">${isFavorite ? '★ Favorite' : '☆ Favorite'}</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  resultsGrid.querySelectorAll('.card-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const card = event.currentTarget.closest('.card');
      openBookModal(card.dataset);
    });
  });

  resultsGrid.querySelectorAll('.favorite-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const card = event.currentTarget.closest('.card');
      toggleFavorite(card.dataset);
    });
  });
}

function showSearchView() {
  showingFavorites = false;
  favoritesButton.textContent = 'Show favorites';
  if (currentQuery) {
    renderPage(currentQuery, currentPage);
  } else {
    loadRandomBook();
  }
}

// Open a modal dialog using the selected book's data.
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

// Update which pagination controls are enabled.
function updatePaginationControls() {
  const totalPages = Math.ceil(totalItems / RESULTS_PER_PAGE);
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages || totalPages === 0;
  pageInfo.textContent = totalPages === 0 ? 'Page 0' : `Page ${currentPage} of ${totalPages}`;
}

// Fetch book results from the Google Books API.
async function searchBooks(query, page = 1) {
  const startIndex = (page - 1) * RESULTS_PER_PAGE;
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${RESULTS_PER_PAGE}&key=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  totalItems = data.totalItems || 0;
  return data.items || [];
}

// Load a few books at page load using a random query.
async function loadRandomBook() {
  const randomQueries = ['fiction', 'science', 'inspiration', 'history', 'mystery'];
  const query = randomQueries[Math.floor(Math.random() * randomQueries.length)];

  resultsStatus.textContent = 'Loading a featured book...';
  resultsGrid.innerHTML = '';

  try {
    const books = await searchBooks(query);
    renderBooks(books.slice(0, 4));
    resultsStatus.textContent = `Showing featured books for “${query}”.`;
    pageInfo.textContent = 'Featured books';
    prevButton.disabled = true;
    nextButton.disabled = true;
  } catch (error) {
    console.error(error);
    resultsStatus.textContent = 'Unable to load a featured book.';
    renderEmptyState('The Google Books API could not be reached right now.');
    pageInfo.textContent = 'Page 0';
  }
}

function renderPage(query, page) {
  currentQuery = query;
  currentPage = page;
  resultsStatus.textContent = `Searching for “${query}”...`;
  resultsGrid.innerHTML = '';

  searchBooks(query, page)
    .then((books) => {
      renderBooks(books);
      const resultText = books.length
        ? `Showing ${books.length} result${books.length === 1 ? '' : 's'} for “${query}”.`
        : `No books found for “${query}”.`;
      resultsStatus.textContent = resultText;
      updatePaginationControls();
    })
    .catch((error) => {
      console.error(error);
      resultsStatus.textContent = `Unable to load results for “${query}”.`;
      renderEmptyState('The Google Books API could not be reached right now.');
      pageInfo.textContent = 'Page 0';
      prevButton.disabled = true;
      nextButton.disabled = true;
    });
}

prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    renderPage(currentQuery, currentPage - 1);
  }
});

nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(totalItems / RESULTS_PER_PAGE);
  if (currentPage < totalPages) {
    renderPage(currentQuery, currentPage + 1);
  }
});

favoritesButton.addEventListener('click', () => {
  if (showingFavorites) {
    showSearchView();
  } else {
    renderFavoritesView();
  }
});

// Start the page with some example books.
loadRandomBook();

// Handle the search form submission.
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const query = input.value.trim();

  if (!query) {
    resultsStatus.textContent = 'Please enter a search term.';
    renderEmptyState('Type something to search for books.');
    return;
  }

  renderPage(query, 1);
});
