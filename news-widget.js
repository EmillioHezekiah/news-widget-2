document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 9;  // Default value, will be updated dynamically.
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
                
                // Update the totalPages dynamically
                const paginationInfo = doc.querySelector('.pagination');  // Assuming pagination is in a container with class .pagination
                const lastPageLink = paginationInfo ? paginationInfo.querySelector('li:last-child a') : null;
                totalPages = lastPageLink ? parseInt(lastPageLink.textContent.trim()) : 9;  // Default to 9 if no info available

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

                addPagination(currentPage);
                togglePagination();
                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        if (currentPage > 1) {
            const firstPageButton = document.createElement('span');
            firstPageButton.innerText = '<<';
            firstPageButton.classList.add('page-number');
            firstPageButton.addEventListener('click', function () {
                loadNewsList(1);
            });
            paginationContainer.appendChild(firstPageButton);
        }

        if (currentPage > 1) {
            const prevPageButton = document.createElement('span');
            prevPageButton.innerText = '<';
            prevPageButton.classList.add('page-number');
            prevPageButton.addEventListener('click', function () {
                loadNewsList(currentPage - 1);
            });
            paginationContainer.appendChild(prevPageButton);
        }

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
            paginationContainer.appendChild(pageButton);
        }

        if (currentPage < totalPages) {
            const nextPageButton = document.createElement('span');
            nextPageButton.innerText = '>';
            nextPageButton.classList.add('page-number');
            nextPageButton.addEventListener('click', function () {
                loadNewsList(currentPage + 1);
            });
            paginationContainer.appendChild(nextPageButton);
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
        isViewingContent = true;
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const titleElement = doc.querySelector('h1.bold.h2.nobmargin');
                const title = titleElement && titleElement.textContent.trim() ? titleElement.textContent.trim() : 'No Title';
                const articleElement = doc.querySelector('.the-post-description');
                const articleContent = articleElement ? articleElement.innerHTML : 'No content available.';
                const imgElement = doc.querySelector('.the-post-description img');
                const imgSrc = imgElement ? correctImageUrl(imgElement.src) : '';

                const modalContent = document.querySelector('#modal-content');
                modalContent.innerHTML = `
                    <h2>${title}</h2>
                    ${imgSrc ? `<img src="${imgSrc}" class="modal-image">` : ''}
                    <div class="modal-article">${articleContent}</div>
                `;
                document.getElementById('news-modal').style.display = 'block';
                togglePagination();  // Hide pagination while viewing content
            })
            .catch(error => console.error('Error loading full article:', error));
    }

    // Close modal when clicking outside
    const newsModal = document.getElementById('news-modal');
    if (newsModal) {
        newsModal.addEventListener('click', function (event) {
            if (event.target === this) {
                this.style.display = 'none';
                isViewingContent = false;
                togglePagination();  // Show pagination again
            }
        });
    }

    // Initialize the first page of the news list
    loadNewsList(currentPage);
});
