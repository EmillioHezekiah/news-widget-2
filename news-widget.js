document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 1;

    // Helper function to correct image URLs
    function correctImageUrl(src) {
        if (src.startsWith('/')) {
            return `https://www.tradepr.work${src}`;
        } else if (!src.startsWith('http')) {
            return `https://www.tradepr.work/uploads/news-pictures-thumbnails/${src}`;
        }
        return src.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
    }

    // Load the news list with pagination
    function loadNewsList(page) {
        currentPage = page;
        fetch(`${baseUrl}?page=${page}`)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const articles = doc.querySelectorAll('.row-fluid.search_result');
                const widget = document.getElementById('news-widget');

                // Clear previous content
                widget.innerHTML = `
                    <h1 class="news-title">News Distribution by Trade PR</h1>
                    <div id="news-content"></div>
                `;

                const newsContent = widget.querySelector('#news-content');

                if (articles.length === 0) {
                    newsContent.innerHTML = '<p>No news items found.</p>';
                    return;
                }

                articles.forEach(article => {
                    const titleElement = article.querySelector('.h3.bold.bmargin.center-block');
                    const title = titleElement?.textContent.trim() || 'Untitled';
                    const link = titleElement ? titleElement.closest('a').href : '#';
                    const imgElement = article.querySelector('.img_section img');
                    const imgSrc = imgElement ? correctImageUrl(imgElement.src) : '';

                    const newsItem = document.createElement('div');
                    newsItem.classList.add('news-item');
                    newsItem.innerHTML = `
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-image">` : ''}
                        <div class="news-content">
                            <a href="${link}" class="news-link" data-url="${encodeURIComponent(link)}">${title}</a>
                        </div>
                    `;
                    newsContent.appendChild(newsItem);
                });

                window.scrollTo(0, 0); // Scroll to the top
                addPagination(currentPage);
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Add pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        if (totalPages > 1) {
            if (currentPage > 1) {
                const prevButton = document.createElement('span');
                prevButton.textContent = '<';
                prevButton.classList.add('page-number');
                prevButton.onclick = () => loadNewsList(currentPage - 1);
                paginationContainer.appendChild(prevButton);
            }

            for (let i = 1; i <= totalPages; i++) {
                const pageNumber = document.createElement('span');
                pageNumber.textContent = i;
                pageNumber.classList.add('page-number');
                if (i === currentPage) pageNumber.classList.add('current-page');
                pageNumber.onclick = () => loadNewsList(i);
                paginationContainer.appendChild(pageNumber);
            }

            if (currentPage < totalPages) {
                const nextButton = document.createElement('span');
                nextButton.textContent = '>';
                nextButton.classList.add('page-number');
                nextButton.onclick = () => loadNewsList(currentPage + 1);
                paginationContainer.appendChild(nextButton);
            }
        }

        const widget = document.getElementById('news-widget');
        if (!widget.contains(paginationContainer)) widget.appendChild(paginationContainer);
    }

    // Load a single news content
    function loadNewsContent(url) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const title = doc.querySelector('h1.bold.h2.nobmargin')?.textContent.trim() || 'No Title';
                const articleContent = doc.querySelector('.the-post-description')?.innerHTML || 'No content available';
                const image = doc.querySelector('.alert-secondary.btn-block.text-center img');
                const imgSrc = image ? correctImageUrl(image.src) : '';

                const widget = document.getElementById('news-widget');
                widget.innerHTML = `
                    <div class="news-content-page">
                        <h1>${title}</h1>
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-image">` : ''}
                        <div>${articleContent}</div>
                        <button id="back-to-news">Back to News</button>
                    </div>
                `;

                document.getElementById('back-to-news').addEventListener('click', () => {
                    history.back(); // Go back in history
                });

                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    // Handle click on news link
    document.addEventListener('click', function (event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            history.pushState({ page: 'news-content', url: newsUrl }, null, `?news=${newsUrl}`);
            loadNewsContent(newsUrl);
        }
    });

    // Handle popstate event
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.page === 'news-content') {
            loadNewsContent(event.state.url);
        } else {
            loadNewsList(currentPage);
        }
    });

    // Initial page load
    if (window.location.search.includes('news=')) {
        const newsUrl = new URLSearchParams(window.location.search).get('news');
        loadNewsContent(decodeURIComponent(newsUrl));
    } else {
        loadNewsList(currentPage);
    }
});
