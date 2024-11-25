document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 1; // Default value, updated dynamically
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

    // Extract total pages from pagination element
    function extractTotalPages(doc) {
        const paginationLinks = doc.querySelectorAll('.pagination a');
        let lastPage = 1;
        paginationLinks.forEach(link => {
            const href = link.getAttribute('href');
            const match = href && href.match(/page=(\d+)/);
            if (match) {
                const pageNum = parseInt(match[1], 10);
                if (pageNum > lastPage) {
                    lastPage = pageNum;
                }
            }
        });
        return lastPage;
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
                    const description = descriptionElement ? descriptionElement.textContent.trim().replace(/View More/gi, '') : 'No description available';
                    const imgElement = article.querySelector('.img_section img');

                    let imgSrc = imgElement ? correctImageUrl(imgElement.src) : '';
                    if (shouldExcludeImage(imgSrc)) imgSrc = '';

                    const newsItem = document.createElement('div');
                    newsItem.classList.add('news-item');
                    newsItem.innerHTML = `
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-image">` : ''}
                        <div class="news-content">
                            <a href="#" class="news-link" data-url="${encodeURIComponent(link)}">${title}</a>
                            <p>${description}</p>
                        </div>
                    `;
                    newsContent.appendChild(newsItem);
                });

                totalPages = extractTotalPages(doc);
                addPagination(page);
                window.scrollTo(0, 0); // Scroll to the top of the page
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        // Add "First" and "Previous" buttons
        if (currentPage > 1) {
            const firstPageButton = document.createElement('span');
            firstPageButton.innerText = '<<';
            firstPageButton.classList.add('page-number');
            firstPageButton.addEventListener('click', () => loadNewsList(1));
            paginationContainer.appendChild(firstPageButton);

            const prevPageButton = document.createElement('span');
            prevPageButton.innerText = '<';
            prevPageButton.classList.add('page-number');
            prevPageButton.addEventListener('click', () => loadNewsList(currentPage - 1));
            paginationContainer.appendChild(prevPageButton);
        }

        // Add page numbers dynamically
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('span');
            pageButton.innerText = i;
            pageButton.classList.add('page-number');
            if (i === currentPage) {
                pageButton.classList.add('current-page');
            }
            pageButton.addEventListener('click', () => loadNewsList(i));
            paginationContainer.appendChild(pageButton);
        }

        // Add "Next" and "Last" buttons
        if (currentPage < totalPages) {
            const nextPageButton = document.createElement('span');
            nextPageButton.innerText = '>';
            nextPageButton.classList.add('page-number');
            nextPageButton.addEventListener('click', () => loadNewsList(currentPage + 1));
            paginationContainer.appendChild(nextPageButton);

            const lastPageButton = document.createElement('span');
            lastPageButton.innerText = '>>';
            lastPageButton.classList.add('page-number');
            lastPageButton.addEventListener('click', () => loadNewsList(totalPages));
            paginationContainer.appendChild(lastPageButton);
        }

        const widget = document.getElementById('news-widget');
        widget.appendChild(paginationContainer);
    }

    // Initial load
    loadNewsList(currentPage);
});
