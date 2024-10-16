document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    let totalPages = 9;
    let isViewingContent = false;

    function correctImageUrl(src) {
        if (src.startsWith('/')) {
            return `https://www.tradepr.work${src}`;
        } else if (!src.startsWith('http')) {
            return `https://www.tradepr.work/uploads/news-pictures-thumbnails/${src}`;
        }
        return src.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
    }

    function shouldExcludeImage(src) {
        return src.includes('/pictures/profile/');
    }

    function cleanDescription(description) {
        return description.replace(/View More/gi, '').trim();
    }

    function formatPostedMetaData(date, author) {
        return `
            <div class="posted-meta-data">
                <span class="posted-by-snippet-posted">Posted</span>
                <span class="posted-by-snippet-date">${date}</span>
                <span class="posted-by-snippet-author">by ${author}</span>
            </div>
        `;
    }

    function extractPostedMetaData(element) {
        const postedMetaData = element ? element.textContent.trim() : '';
        const dateMatch = postedMetaData.match(/Posted\s+(\d{2}\/\d{2}\/\d{4})/);
        const authorMatch = postedMetaData.match(/by\s+(.+?)(\s+in\s+[\w\s]+)?$/);

        const postedDate = dateMatch ? dateMatch[1] : 'No Date';
        const postedAuthor = authorMatch ? authorMatch[1].replace(/<\/?a[^>]*>/g, '').trim() : 'No Author';

        return { postedDate, postedAuthor };
    }

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

                if (!isViewingContent) {
                    addPagination(page);
                }

                window.scrollTo(0, 0);
            })
            .catch(error => {
                console.error('Error loading news:', error);
                const widget = document.getElementById('news-widget');
                widget.innerHTML = '<p>Error loading news. Please try again later.</p>';
            });
    }

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

    document.addEventListener('click', function (event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            loadNewsContent(newsUrl);
        }
    });

    function loadNewsContent(url) {
        isViewingContent = true;
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }

        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const titleElement = doc.querySelector('.article-title');
                const contentElement = doc.querySelector('.article-content');

                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');

                if (!titleElement || !contentElement) {
                    console.warn('Title or content not found. Please check the structure of the fetched page.');
                    if (modalTitle) modalTitle.textContent = 'Content Not Available';
                    if (modalBody) modalBody.innerHTML = '<p>The article could not be loaded. Please check the structure of the fetched page or contact support.</p>';
                    showModal();
                    return;
                }

                const title = titleElement.textContent.trim();
                const content = contentElement.innerHTML;

                if (modalTitle) modalTitle.textContent = title;
                if (modalBody) modalBody.innerHTML = content;

                showModal();
            })
            .catch(error => {
                console.error('Error loading content:', error);
                if (modalTitle) modalTitle.textContent = 'Error Loading Content';
                if (modalBody) modalBody.innerHTML = '<p>There was an error loading the content. Please try again later.</p>';
                showModal();
            });
    }

    function showModal() {
        const modalElement = document.getElementById('newsModal');
        if (modalElement) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement, { keyboard: false });
                modal.show();
            } else {
                console.error('Bootstrap is not loaded or modal element not found.');
            }
        }
    }

    // Initial load
    loadNewsList(currentPage);
});
