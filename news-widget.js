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
        if (!date || !author) return ''; // Remove if no date or author exists
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

        const postedDate = dateMatch ? dateMatch[1] : '';
        const postedAuthor = authorMatch ? authorMatch[1].replace(/<\/?a[^>]*>/g, '').trim() : '';

        return { postedDate, postedAuthor };
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
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-thumbnail">` : ''}  <!-- News Thumbnail class -->
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
                    addPagination(page);
                }

                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        // Add "<<" button to go to the first page
        const firstPageButton = document.createElement('span');
        firstPageButton.innerText = '<<';
        firstPageButton.classList.add('page-number');
        firstPageButton.addEventListener('click', function () {
            loadNewsList(1);
        });
        paginationContainer.appendChild(firstPageButton);

        // Add numbered page buttons
        for (let i = 1; i <= totalPages; i++) {
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

        // Add ">>" button to go to the last page
        const lastPageButton = document.createElement('span');
        lastPageButton.innerText = '>>';
        lastPageButton.classList.add('page-number');
        lastPageButton.addEventListener('click', function () {
            loadNewsList(totalPages);
        });
        paginationContainer.appendChild(lastPageButton);

        // Append pagination to the widget
        document.getElementById('news-widget').appendChild(paginationContainer);
    }

    // Handle clicking on a news link to load the full article
    document.addEventListener('click', function (event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            loadNewsContent(newsUrl);
        }
    });

    // Load the full article content in a regular view below the news list
    function loadNewsContent(url) {
        isViewingContent = true;
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
                const content = contentContainer ? contentContainer.innerHTML.trim() : 'No Content Available';

                const postedMetaDataElement = doc.querySelector('.posted_meta_data');
                const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                const newsContent = document.getElementById('news-content');
                if (!newsContent) {
                    console.error('News content container not found.');
                    return;
                }

                // Hide pagination when viewing a full article
                const pagination = document.getElementById('pagination');
                if (pagination) {
                    pagination.style.display = 'none';
                }

                // Display full article content and image in modal style
                newsContent.innerHTML = `
                    <div class="full-news-content">
                        <h1 class="article-title">${title}</h1>
                        ${image ? `<img src="${image}" alt="${title}" class="modal-img">` : ''} <!-- Modal image class -->
                        ${formatPostedMetaData(postedDate, postedAuthor)}
                        <div>${content}</div>
                        <button id="back-to-news-list">Back to News List</button>
                    </div>
                `;
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    // Handle back button click to return to news list
    document.addEventListener('click', function (event) {
        if (event.target.id === 'back-to-news-list') {
            loadNewsList(currentPage);
        }
    });

    // Initialize the news list when the page loads
    loadNewsList(currentPage);
});
