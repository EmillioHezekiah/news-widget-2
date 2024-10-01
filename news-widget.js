document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1; // Track the current page
    let isViewingContent = false; // Track whether the user is viewing a full article

    // Helper function to correct image URLs
    function correctImageUrl(src) {
        if (src.startsWith('/')) {
            return `https://www.tradepr.work${src}`;
        } else if (!src.startsWith('http')) {
            return `https://www.tradepr.work/uploads/news-pictures-thumbnails/${src}`;
        } else {
            return src.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
        }
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
        let postedDate = 'No Date';
        let postedAuthor = 'No Author';

        const dateMatch = postedMetaData.match(/Posted\s+(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            postedDate = dateMatch[1];
        }

        const authorMatch = postedMetaData.match(/by\s+(.+?)(\s+in\s+[\w\s]+)?$/);
        if (authorMatch) {
            postedAuthor = authorMatch[1].replace(/<\/?a[^>]*>/g, '').trim();
        }

        return { postedDate, postedAuthor };
    }

    // Load the news list with pagination
    function loadNewsList(page) {
        isViewingContent = false; // User is back to viewing the list
        fetch(`${baseUrl}?page=${page}`)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const articles = doc.querySelectorAll('.row-fluid.search_result');
                const widget = document.getElementById('news-widget');

                widget.innerHTML = `
                    <div style="text-align: left; margin-bottom: 50px;">
                        <h2>News Distribution by Trade PR</h2>
                    </div>
                `;

                const newsContent = document.createElement('div');
                newsContent.id = 'news-content';
                widget.appendChild(newsContent);

                if (articles.length === 0) {
                    newsContent.innerHTML = '<p>No news items found.</p>';
                } else {
                    articles.forEach(article => {
                        const titleElement = article.querySelector('.h3.bold.bmargin.center-block');
                        const title = titleElement ? titleElement.textContent.trim() : 'No title available';
                        const link = titleElement ? titleElement.closest('a').href : '#';
                        const descriptionElement = article.querySelector('.xs-nomargin');
                        let description = descriptionElement ? descriptionElement.textContent.trim() : 'No description available';
                        description = cleanDescription(description);
                        const imgElement = article.querySelector('.img_section img');

                        let imgSrc = '';
                        if (imgElement) {
                            imgSrc = correctImageUrl(imgElement.src);
                            if (shouldExcludeImage(imgSrc)) {
                                imgSrc = '';
                            }
                        }

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
                        addPagination(doc);
                    }
                }

                window.scrollTo(0, 0); // Scroll to top when loading the list
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(doc) {
        const paginationLinks = doc.querySelectorAll('.pagination a');
        if (paginationLinks.length > 0) {
            const paginationContainer = document.createElement('div');
            paginationContainer.id = 'pagination';
            paginationContainer.innerHTML = '';

            paginationLinks.forEach(link => {
                const pageNumber = link.textContent.trim();
                const pageUrl = link.href;

                const pageButton = document.createElement('button');
                pageButton.innerText = pageNumber;
                pageButton.addEventListener('click', function () {
                    const newPage = new URL(pageUrl).searchParams.get('page');
                    currentPage = newPage; // Update current page
                    loadNewsList(newPage); // Load the corresponding page from the original website
                });
                paginationContainer.appendChild(pageButton);
            });

            const widget = document.getElementById('news-widget');
            widget.appendChild(paginationContainer);
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

    // Load the full article content in a modal-like view
    function loadNewsContent(url) {
        isViewingContent = true; // User is viewing content
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const title = doc.querySelector('h1.bold.h2.nobmargin') ? doc.querySelector('h1.bold.h2.nobmargin').textContent.trim() : 'No Title';
                const imageElement = doc.querySelector('.img_section img');
                let image = '';
                if (imageElement) {
                    image = correctImageUrl(imageElement.src);
                    if (shouldExcludeImage(image)) {
                        image = '';
                    }
                }

                const contentContainer = doc.querySelector('.the-post-description');
                let content = 'No Content Available';
                if (contentContainer) {
                    content = contentContainer.innerHTML.trim();
                }

                const postedMetaDataElement = doc.querySelector('.posted_meta_data');
                const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                const additionalImageElement = doc.querySelector('img.center-block');
                let additionalImage = '';
                if (additionalImageElement) {
                    additionalImage = correctImageUrl(additionalImageElement.src);
                    if (shouldExcludeImage(additionalImage)) {
                        additionalImage = '';
                    }
                }

                const newsContent = document.getElementById('news-content');
                if (!newsContent) {
                    console.error('News content container not found.');
                    return;
                }
                newsContent.innerHTML = `
                    <div class="full-news-content">
                        <h1>${title}</h1>
                        ${additionalImage ? `<img src="${additionalImage}" alt="${title}" class="modal-thumbnail">` : ''}
                        ${image ? `<img src="${image}" alt="${title}" class="modal-image">` : ''}
                        <div>${content}</div>
                        ${postedDate !== 'No Date' && postedAuthor !== 'No Author' ? formatPostedMetaData(postedDate, postedAuthor) : ''}
                        <button id="back-button" class="back-button">Back to News List</button>
                    </div>
                `;

                // Scroll to top when viewing content
                window.scrollTo(0, 0);

                // Handle back button to return to the news list
                document.getElementById('back-button').addEventListener('click', function () {
                    loadNewsList(currentPage); // Load the previous news list
                });

                // Hide pagination buttons while viewing the news content
                const paginationContainer = document.getElementById('pagination');
                if (paginationContainer) {
                    paginationContainer.style.display = 'none';
                }
            })
            .catch(error => console.error('Error loading content:', error));
    }

    // Initial load of the first page
    loadNewsList(currentPage);
});
