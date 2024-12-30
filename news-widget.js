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

    // Disable the contenteditable attribute for captions and center them
    function disableContentEditable() {
        const captions = document.querySelectorAll('.fr-inner[contenteditable="true"]');
        captions.forEach(caption => {
            caption.setAttribute('contenteditable', 'false');
        });

        const captionContainers = document.querySelectorAll('.fr-img-caption');
        captionContainers.forEach(container => {
            container.style.textAlign = 'center';
            container.style.display = 'block';
            container.style.margin = '0 auto';
        });

        const images = document.querySelectorAll('.fr-img-caption img');
        images.forEach(img => {
            img.style.display = 'block';
            img.style.margin = '0 auto';
        });
    }

    // Add a custom class for caption containers
    function addCustomCaptionClass() {
        const captionContainers = document.querySelectorAll('div[style*="box-sizing: border-box;"][style*="color: rgba(0, 0, 0, 0);"]');
        captionContainers.forEach(container => {
            if (!container.classList.contains('custom-news-caption')) {
                container.classList.add('custom-news-caption');
                container.style.textAlign = 'center';
                container.style.margin = '0 auto';
                container.style.display = 'flex';
            }
        });
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

            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
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
                    const descriptionElement = article.querySelector('.xs-nomargin');
                    const description = descriptionElement ? cleanDescription(descriptionElement.textContent.trim()) : 'No description available';
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
                            <a href="news-content.html?url=${encodeURIComponent(correctedLink)}" class="news-link">${title}</a>
                            <p class="full-news-content-paragraf">${description}</p>
                        </div>
                    `;
                    newsContent.appendChild(newsItem);
                });

                const paginationElement = doc.querySelector('.pagination');
                totalPages = paginationElement
                    ? Math.max(...[...paginationElement.querySelectorAll('a')].map(a => parseInt(a.textContent.trim(), 10)).filter(Number))
                    : 1;

                addPagination(currentPage);
                window.scrollTo(0, 0); // Scroll to the top of the page
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Load the initial news list
    loadNewsList(currentPage);
});
