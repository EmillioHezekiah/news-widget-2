document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 9;
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

                renderPagination();
                togglePagination();
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Revised pagination logic
    function renderPagination() {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        const widget = document.getElementById('news-widget');
        widget.appendChild(paginationContainer);

        // Add buttons for first page and previous page
        if (currentPage > 1) {
            addPaginationButton(paginationContainer, '<<', () => loadNewsList(1));
            addPaginationButton(paginationContainer, '<', () => loadNewsList(currentPage - 1));
        }

        // Add buttons for nearby pages
        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            addPaginationButton(paginationContainer, i, () => loadNewsList(i), i === currentPage);
        }

        // Add buttons for next page and last page
        if (currentPage < totalPages) {
            addPaginationButton(paginationContainer, '>', () => loadNewsList(currentPage + 1));
            addPaginationButton(paginationContainer, '>>', () => loadNewsList(totalPages));
        }
    }

    function addPaginationButton(container, text, callback, isCurrent = false) {
        const button = document.createElement('span');
        button.innerText = text;
        button.classList.add('page-number');
        if (isCurrent) {
            button.classList.add('current-page');
        }
        button.addEventListener('click', callback);
        container.appendChild(button);
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
                const titleElement = doc.querySelector('h1.bold.h2.nobmargin');
                const title = titleElement && titleElement.textContent.trim() ? titleElement.textContent.trim() : 'No Title';
                const articleElement = doc.querySelector('.the-post-description');
                const articleContent = articleElement ? articleElement.innerHTML : 'No article content available';
                const imageElement = doc.querySelector('.alert-secondary.btn-block.text-center img');
                const imgSrc = imageElement ? correctImageUrl(imageElement.src) : '';
                const widget = document.getElementById('news-widget');

                widget.innerHTML = `
                    <div class="modal-content" style="padding: 16px;">
                        ${imgSrc ? `<img src="${imgSrc}" class="center-block" style="max-width: 45%; height: auto; display: block; margin-left: auto; margin-right: auto;" />` : ''}
                        <h2 style="font-family: 'Droid Serif'; font-size: 20pt; color: #840d0d;">${title}</h2>
                        <div class="modal-description" style="font-size: 14pt; font-family: 'Poppins'; text-align: justify;">${articleContent}</div>
                        <button id="backButton" style="margin-top: 20px;">Back to News List</button>
                    </div>
                `;

                disableContentEditable();
                togglePagination();
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    // Handle back button in the modal
    document.addEventListener('click', function (event) {
        if (event.target.matches('#backButton')) {
            loadNewsList(currentPage);
        }
    });

    // Initial load
    loadNewsList(currentPage);
});
