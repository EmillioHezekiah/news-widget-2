document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 9; // Initial value; will be updated dynamically.
    let isViewingContent = false;

    // Helper function to correct image URLs
    function correctImageUrl(src) {
        if (src.startsWith('/')) {
            return `https://www.tradepr.work${src}`;
        } else if (!src.startsWith('http')) {
            return `https://www.tradepr.work/uploads/news-pictures-thumbnails/${src}`;
        }
        return src.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
    }

    // Helper function to exclude certain images (e.g., profile pictures)
    function shouldExcludeImage(src) {
        return src.includes('/pictures/profile/');
    }

    // Clean up article descriptions
    function cleanDescription(description) {
        return description.replace(/View More/gi, '').trim();
    }

    // Format the posted metadata for each article
    function formatPostedMetaData(date, author) {
        return `
            <div class="posted-meta-data">
                <span class="posted-by-snippet-posted">Posted</span>
                <span class="posted-by-snippet-date">${date}</span>
                <span class="posted-by-snippet-author">by ${author}</span>
            </div>
        `;
    }

    // Extract posted metadata from the document
    function extractPostedMetaData(element) {
        const postedMetaData = element ? element.textContent.trim() : '';
        const dateMatch = postedMetaData.match(/Posted\s+(\d{2}\/\d{2}\/\d{4})/);
        const authorMatch = postedMetaData.match(/by\s+(.+?)(\s+in\s+[\w\s]+)?$/);

        const postedDate = dateMatch ? dateMatch[1] : 'No Date';
        const postedAuthor = authorMatch ? authorMatch[1].replace(/<\/?a[^>]*>/g, '').trim() : 'No Author';

        return { postedDate, postedAuthor };
    }

    // Disable the contenteditable attribute for captions
    function disableContentEditable() {
        const captions = document.querySelectorAll('.fr-inner[contenteditable="true"]');
        captions.forEach(caption => {
            caption.setAttribute('contenteditable', 'false');
        });
    }

    // Show or hide the pagination based on the isViewingContent state
    function togglePagination() {
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.style.display = isViewingContent ? 'none' : 'block';
        }
    }

    // Fetch the total number of pages from the website
    function fetchTotalPages() {
        fetch(baseUrl)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const pagination = doc.querySelector('.pagination');
                if (pagination) {
                    const lastPageLink = pagination.querySelector('li:last-child a');
                    const totalPageNumber = lastPageLink ? parseInt(lastPageLink.textContent.trim()) : 9; // Default to 9 if not found
                    totalPages = totalPageNumber;
                    loadNewsList(currentPage);
                } else {
                    totalPages = 9; // Fallback if pagination is not found
                    loadNewsList(currentPage);
                }
            })
            .catch(error => console.error('Error fetching total pages:', error));
    }

    // Load the news list with pagination
    function loadNewsList(page) {
        currentPage = page;
        isViewingContent = false;
        fetch(`${baseUrl}?page=${page}`)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const articles = doc.querySelectorAll('.row-fluid.search_result');
                const widget = document.getElementById('news-widget');

                // Clear previous content
                widget.innerHTML = '<h1 class="news-title" style="font-size: 21pt; margin-bottom: 24px; font-family: \'Roboto Condensed\'; color: #840d0d">News Distribution by Trade PR</h1><div id="news-content"></div>';

                const newsContent = widget.querySelector('#news-content');

                if (articles.length === 0) {
                    newsContent.innerHTML = '<p>No news items found.</p>';
                    return;
                }

                articles.forEach(article => {
                    const titleElement = article.querySelector('.h3.bold.bmargin.center-block');
                    const title = titleElement && titleElement.textContent.trim() ? titleElement.textContent.trim() : 'Untitled';
                    const link = titleElement ? titleElement.closest('a').href : '#';
                    const descriptionElement = article.querySelector('.xs-nomargin');
                    let description = descriptionElement ? cleanDescription(descriptionElement.textContent.trim()) : 'No description available';
                    const imgElement = article.querySelector('.img_section img');

                    let imgSrc = imgElement ? correctImageUrl(imgElement.src) : '';
                    if (shouldExcludeImage(imgSrc)) imgSrc = '';

                    const correctedLink = link.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
                    const postedMetaDataElement = article.querySelector('.posted_meta_data');
                    const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                    const newsItem = document.createElement('div');
                    newsItem.classList.add('news-item');
                    newsItem.innerHTML = `
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-image">` : ''}
                        <div class="news-content">
                            ${formatPostedMetaData(postedDate, postedAuthor)}
                            <a href="#" class="news-link" data-url="${encodeURIComponent(correctedLink)}">${title}</a>
                            <p>${description}</p>
                        </div>
                    `;
                    newsContent.appendChild(newsItem);
                });

                addPagination(page);
                togglePagination();
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) {
            const newPaginationContainer = document.createElement('div');
            newPaginationContainer.id = 'pagination';
            document.body.appendChild(newPaginationContainer);
        }

        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        // Previous Page Button
        if (currentPage > 1) {
            const prevPageButton = document.createElement('span');
            prevPageButton.innerText = '<';
            prevPageButton.classList.add('page-number');
            prevPageButton.addEventListener('click', function () {
                loadNewsList(currentPage - 1);
            });
            pagination.appendChild(prevPageButton);
        }

        // Page Numbers
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('span');
            pageButton.innerText = i;
            pageButton.classList.add('page-number');
            if (i === currentPage) {
                pageButton.classList.add('current-page');
            }
            pageButton.addEventListener('click', function () {
                loadNewsList(i);
            });
            pagination.appendChild(pageButton);
        }

        // Next Page Button
        if (currentPage < totalPages) {
            const nextPageButton = document.createElement('span');
            nextPageButton.innerText = '>';
            nextPageButton.classList.add('page-number');
            nextPageButton.addEventListener('click', function () {
                loadNewsList(currentPage + 1);
            });
            pagination.appendChild(nextPageButton);
        }

        // Last Page Button
        if (currentPage < totalPages) {
            const lastPageButton = document.createElement('span');
            lastPageButton.innerText = '>>';
            lastPageButton.classList.add('page-number');
            lastPageButton.addEventListener('click', function () {
                loadNewsList(totalPages);
            });
            pagination.appendChild(lastPageButton);
        }
    }

    // Handle clicking on a news link to load the full article
    document.addEventListener('click', function (event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            loadNewsContent(newsUrl);
        }
    });

    // Load the full article content in a modal
    function loadNewsContent(url) {
        isViewingContent = true;
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const articleContent = doc.querySelector('.col-md-12.the-post-description');

                const modalContent = document.getElementById('modal-content');
                modalContent.innerHTML = articleContent ? articleContent.innerHTML : 'Content not available.';
                togglePagination();
            })
            .catch(error => console.error('Error loading full article:', error));
    }

    // Initialize the page with the first set of news articles
    fetchTotalPages();
});
