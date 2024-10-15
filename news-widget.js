document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1;
    const totalPages = 9;
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

    function disableContentEditable() {
        const captions = document.querySelectorAll('.fr-inner[contenteditable="true"]');
        captions.forEach(caption => {
            caption.setAttribute('contenteditable', 'false');
        });
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

                if (!widget) {
                    console.error('Error: News widget container not found.');
                    return;
                }

                widget.innerHTML = '<h1 class="news-title" style="font-size: 12pt; margin-bottom: 24px;">News Distribution by Trade PR</h1><div id="news-content"></div>';
                const newsContent = widget.querySelector('#news-content');

                if (!newsContent) {
                    console.error('Error: News content container not found.');
                    return;
                }

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
            .catch(error => console.error('Error loading news:', error));
    }

    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        if (currentPage > 1) {
            const firstPageButton = createPageButton('<<', 1);
            paginationContainer.appendChild(firstPageButton);
            const prevPageButton = createPageButton('<', currentPage - 1);
            paginationContainer.appendChild(prevPageButton);
        }

        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPageButton(i, i);
            if (i === currentPage) {
                pageButton.classList.add('current-page');
            }
            paginationContainer.appendChild(pageButton);
        }

        if (currentPage < totalPages) {
            const nextPageButton = createPageButton('>', currentPage + 1);
            paginationContainer.appendChild(nextPageButton);
            const lastPageButton = createPageButton('>>', totalPages);
            paginationContainer.appendChild(lastPageButton);
        }

        const widget = document.getElementById('news-widget');
        if (widget) {
            widget.appendChild(paginationContainer);
        } else {
            console.error('Error: News widget container not found for pagination.');
        }
    }

    function createPageButton(text, page) {
        const button = document.createElement('span');
        button.innerText = text;
        button.classList.add('page-number');
        button.addEventListener('click', function () {
            loadNewsList(page);
        });
        return button;
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
                const titleElement = doc.querySelector('h1');
                const contentElement = doc.querySelector('.the-post-description');

                if (!titleElement || !contentElement) {
                    console.error('Error: Unable to find title or content element in the news content.');
                    return;
                }

                const title = titleElement.textContent;
                const modalContent = document.getElementById('modal-content');
                if (modalContent) {
                    modalContent.innerHTML = `
                        <h2>${title}</h2>
                        <div class="article-content">${contentElement.innerHTML}</div>
                    `;
                    disableContentEditable();
                    openModal();
                } else {
                    console.error('Error: Modal content container not found.');
                }
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    function openModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'block';
            modal.scrollTop = 0;
        } else {
            console.error('Error: Modal container not found.');
        }
    }

    function closeModal() {
        const modal = document.getElementById('news-modal');
        if (modal) {
            modal.style.display = 'none';
            loadNewsList(currentPage);
        }
    }

    window.addEventListener('click', function (event) {
        const modal = document.getElementById('news-modal');
        if (modal && event.target === modal) {
            closeModal();
        }
    });

    loadNewsList(currentPage);
});
