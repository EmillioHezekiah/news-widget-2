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

    // Disable the contenteditable attribute for captions
    function disableContentEditable() {
        const captions = document.querySelectorAll('.fr-inner[contenteditable="true"]');
        captions.forEach(caption => {
            caption.setAttribute('contenteditable', 'false'); // Disable contenteditable
        });
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

                // Add pagination buttons for news list page only
                if (!isViewingContent) {
                    addPagination(page); // Pass the current page for comparison
                }

                window.scrollTo(0, 0); // Scroll to top when loading the list
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        // Only add the first page button if not on the first page
        if (currentPage > 1) {
            const firstPageButton = document.createElement('span');
            firstPageButton.innerText = '<<';
            firstPageButton.classList.add('page-number');
            firstPageButton.addEventListener('click', function () {
                loadNewsList(1); // Go to the first page
            });
            paginationContainer.appendChild(firstPageButton);
        }

        // Only add the "<" button if not on the first page
        if (currentPage > 1) {
            const prevPageButton = document.createElement('span');
            prevPageButton.innerText = '<';
            prevPageButton.classList.add('page-number');
            prevPageButton.addEventListener('click', function () {
                loadNewsList(currentPage - 1); // Go to the previous page
            });
            paginationContainer.appendChild(prevPageButton);
        }

        // Calculate the range of page numbers to display
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        // Add numbered page buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('span');
            pageButton.innerText = i;
            pageButton.classList.add('page-number');
            if (i === currentPage) {
                pageButton.classList.add('current-page'); // Highlight the current page
            }
            pageButton.addEventListener('click', function () {
                loadNewsList(i); // Load the selected page
            });
            paginationContainer.appendChild(pageButton);
        }

        // Only add the ">" button if not on the last page
        if (currentPage < totalPages) {
            const nextPageButton = document.createElement('span');
            nextPageButton.innerText = '>';
            nextPageButton.classList.add('page-number');
            nextPageButton.addEventListener('click', function () {
                loadNewsList(currentPage + 1); // Go to the next page
            });
            paginationContainer.appendChild(nextPageButton);
        }

        // Only add the last page button if not on the last page
        if (currentPage < totalPages) {
            const lastPageButton = document.createElement('span');
            lastPageButton.innerText = '>>';
            lastPageButton.classList.add('page-number');
            lastPageButton.addEventListener('click', function () {
                loadNewsList(totalPages); // Go to the last page
            });
            paginationContainer.appendChild(lastPageButton);
        }

        // Append pagination to the widget
        const widget = document.getElementById('news-widget');
        widget.appendChild(paginationContainer);
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
        isViewingContent = true; // User is viewing content
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const title = doc.querySelector('h1.bold.h2.nobmargin') ? doc.querySelector('h1.bold.h2.nobmargin').textContent.trim() : 'No Title';
                const imageElement = doc.querySelector('.img_section img');
                let image = imageElement ? correctImageUrl(imageElement.src) : '';
                if (shouldExcludeImage(image)) image = '';

                const contentContainer = doc.querySelector('.the-post-description');
                const content = contentContainer ? contentContainer.innerHTML.trim() : 'No content available';

                // Clear the news content
                const newsContent = document.getElementById('news-content');
                newsContent.innerHTML = '';

                // Create the news article view
                const articleView = document.createElement('div');
                articleView.classList.add('news-article-view');
                articleView.innerHTML = `
                    <h1>${title}</h1>
                    ${image ? `<img src="${image}" alt="${title}" class="news-article-image">` : ''}
                    <div class="news-article-content">${content}</div>
                    <button class="back-button">Back to News List</button>
                `;

                // Add thumbnail image (if available)
                const thumbnailImgElement = doc.querySelector('.img_section img');
                if (thumbnailImgElement) {
                    const thumbnailSrc = correctImageUrl(thumbnailImgElement.src);
                    articleView.innerHTML += `
                        <img src="${thumbnailSrc}" alt="${title}" class="news-thumbnail" width="240" height="120">
                    `;
                }

                newsContent.appendChild(articleView);

                // Add the click event for the back button
                const backButton = articleView.querySelector('.back-button');
                backButton.addEventListener('click', function () {
                    loadNewsList(currentPage); // Go back to the news list
                });

                // Scroll to top
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading article:', error));
    }

    // Initial load of the first page of news
    loadNewsList(currentPage);
    disableContentEditable();
});
