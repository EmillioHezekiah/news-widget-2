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
                        ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-thumbnail">` : ''}
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
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        const firstPageButton = document.createElement('span');
        firstPageButton.innerText = '<<';
        firstPageButton.classList.add('page-number');
        firstPageButton.addEventListener('click', function () {
            loadNewsList(1);
        });
        paginationContainer.appendChild(firstPageButton);

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

        const lastPageButton = document.createElement('span');
        lastPageButton.innerText = '>>';
        lastPageButton.classList.add('page-number');
        lastPageButton.addEventListener('click', function () {
            loadNewsList(totalPages);
        });
        paginationContainer.appendChild(lastPageButton);

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

                const title = doc.querySelector('h1.bold.h2.nobmargin') ? doc.querySelector('h1.bold.h2.nobmargin').textContent.trim() : 'No Title';
                const imageElement = doc.querySelector('.img_section img');
                let image = imageElement ? correctImageUrl(imageElement.src) : '';
                if (shouldExcludeImage(image)) image = '';

                const contentContainer = doc.querySelector('.the-post-description');
                const content = contentContainer ? contentContainer.innerHTML.trim() : 'No Content Available';

                const postedMetaDataElement = doc.querySelector('.posted_meta_data');
                const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                const additionalImageElement = doc.querySelector('img.center-block');
                let additionalImage = additionalImageElement ? correctImageUrl(additionalImageElement.src) : '';
                if (shouldExcludeImage(additionalImage)) additionalImage = '';

                const newsContent = document.getElementById('news-content');
                if (!newsContent) {
                    console.error('News content container not found.');
                    return;
                }

                const pagination = document.getElementById('pagination');
                if (pagination) {
                    pagination.style.display = 'none';
                }

                newsContent.innerHTML = `
                    <div class="full-news-content">
                        <h1 class="article-title">${title}</h1>
                        ${additionalImage ? `<img src="${additionalImage}" alt="${title}" class="modal-image">` : ''}
                        ${image ? `<img src="${image}" alt="${title}" class="main-image">` : ''}
                        <div class="content">${content}</div>
                        <button id="back-button" style="font-size: 20px; font-weight: bold; padding: 10px 20px; background-color: #007BFF; color: white; border: none; cursor: pointer;">Back</button>
                    </div>
                `;

                document.getElementById('back-button').addEventListener('click', function () {
                    loadNewsList(currentPage);
                });

                window.scrollTo(0, 0);
            })
            .catch(error => console.error('Error loading article:', error));
    }

    loadNewsList(currentPage);
});
