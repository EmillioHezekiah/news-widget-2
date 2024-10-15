document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1; // Track the current page
    let totalPages = 9; // Set default total pages (this can be dynamic)
    let isViewingContent = false; // Track whether the user is viewing a full article

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

    // Load the news list with pagination
    function loadNewsList(page) {
        currentPage = page; // Update the current page number
        isViewingContent = false; // User is back to viewing the list
        fetch(`${baseUrl}?page=${page}`)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const articles = doc.querySelectorAll('.row-fluid.search_result');
                const widget = document.getElementById('news-widget');

                // Clear previous content
                widget.innerHTML = '<h1 class="news-title" style="font-size: 12pt; margin-bottom: 24px;">News Distribution by Trade PR</h1><div id="news-content"></div>';
                const newsContent = widget.querySelector('#news-content');

                if (articles.length === 0) {
                    newsContent.innerHTML = '<p>No news items found.</p>';
                    return;
                }

                articles.forEach(article => {
                    const titleElement = article.querySelector('.h3.bold.bmargin.center-block');
                    const title = titleElement ? titleElement.textContent.trim() : 'No title available';
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

                // Add pagination only if not viewing content
                if (!isViewingContent) {
                    addPagination(currentPage);
                }

                window.scrollTo(0, 0); // Scroll to top when loading the list
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically with limited page numbers
    function addPagination(currentPage) {
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        const maxPageNumbers = 3;
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

        if (currentPage > 1) {
            const firstPageButton = document.createElement('span');
            firstPageButton.innerText = '<<';
            firstPageButton.classList.add('page-number');
            firstPageButton.addEventListener('click', function () {
                loadNewsList(1);
            });
            paginationContainer.appendChild(firstPageButton);
        }

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
            paginationContainer.appendChild(pageButton);
        }

        if (currentPage < totalPages) {
            const lastPageButton = document.createElement('span');
            lastPageButton.innerText = '>>';
            lastPageButton.classList.add('page-number');
            lastPageButton.addEventListener('click', function () {
                loadNewsList(totalPages);
            });
            paginationContainer.appendChild(lastPageButton);
        }

        document.getElementById('news-widget').appendChild(paginationContainer);
    }

    document.addEventListener('click', function (event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            loadNewsContent(newsUrl);
        }
    });

    function loadNewsContent(url) {
        isViewingContent = true;
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const title = doc.querySelector('h1.bold.h2.nobmargin') ? doc.querySelector('h1.bold.h2.nobmargin').textContent : 'No title available';
                const fullArticle = doc.querySelector('.the-post-description') ? doc.querySelector('.the-post-description').innerHTML : 'No content available';
                const imgElement = doc.querySelector('.center-block');

                let imgSrc = imgElement ? correctImageUrl(imgElement.src) : '';

                const contentDiv = document.createElement('div');
                contentDiv.classList.add('full-article');
                contentDiv.innerHTML = `
                    ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="modal-thumbnail">` : ''}
                    <h2>${title}</h2>
                    <div>${fullArticle}</div>
                    <button id="back-to-news" class="back-to-news">Back to News List</button>
                `;

                const newsContent = document.getElementById('news-content');
                newsContent.innerHTML = '';
                newsContent.appendChild(contentDiv);

                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    document.addEventListener('click', function (event) {
        if (event.target.matches('#back-to-news')) {
            loadNewsList(currentPage);
        }
    });

    loadNewsList(1);
});
