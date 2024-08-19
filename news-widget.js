document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';

    // Function to correct image URLs
    function correctImageUrl(src) {
        if (src.startsWith('/')) {
            return `https://www.tradepr.work${src}`;
        } else if (!src.startsWith('http')) {
            return `https://www.tradepr.work/uploads/news-pictures-thumbnails/${src}`;
        } else {
            return src.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');
        }
    }

    // Function to check if image URL should be excluded
    function shouldExcludeImage(src) {
        return src.includes('/pictures/profile/');
    }

    // Function to clean up the description by removing "View More"
    function cleanDescription(description) {
        return description.replace(/View More/gi, '').trim();
    }

    // Function to format posted metadata, removing category and stripping the link
    function formatPostedMetaData(date, author) {
        return `
            <div class="col-xs-8 col-sm-8 btn-sm nohpad nobpad">
                <span class="posted-by-snippet-posted">Posted</span>
                <span class="posted-by-snippet-date">${date}</span>
                <span class="posted-by-snippet-author">by ${author}</span>
            </div>
        `;
    }

    // Function to extract metadata and remove unnecessary parts
    function extractPostedMetaData(element) {
        const postedMetaData = element ? element.textContent.trim() : '';
        const postedDate = postedMetaData.match(/Posted\s+(\d{2}\/\d{2}\/\d{4})/)?.[1] || 'No Date';
        let postedAuthor = postedMetaData.match(/by\s+(.+)$/)?.[1].trim() || 'No Author';

        // Remove "in [Category]" part
        postedAuthor = postedAuthor.replace(/in\s+[\w\s]+$/, '');

        // Remove link from author's name
        postedAuthor = postedAuthor.replace(/<\/?a[^>]*>/g, '');

        return { postedDate, postedAuthor };
    }

    // Fetch and display news articles
    fetch(baseUrl)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const articles = doc.querySelectorAll('.row-fluid.search_result');
            const widget = document.getElementById('news-widget');

            if (articles.length === 0) {
                widget.innerHTML = '<p>No news items found.</p>';
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
                        imgSrc = imgElement.src;
                        imgSrc = correctImageUrl(imgSrc);
                        if (shouldExcludeImage(imgSrc)) {
                            imgSrc = '';
                        }
                    }

                    const correctedLink = link.replace(/https:\/\/emilliohezekiah.github.io/, 'https://www.tradepr.work');

                    // Extract posted date and author information
                    const postedMetaDataElement = article.querySelector('.posted_meta_data');
                    const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                    widget.innerHTML += `
                        <div class="news-item">
                            ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="news-image">` : ''}
                            <div class="news-content">
                                <a href="#" class="news-link" data-url="${encodeURIComponent(correctedLink)}">${title}</a>
                                <p>${description}</p>
                                <br>
                                <div class="posted-meta-data">${formatPostedMetaData(postedDate, postedAuthor)}</div>
                            </div>
                        </div>
                    `;
                });
            }
        })
        .catch(error => console.error('Error loading news:', error));

    document.addEventListener('click', function(event) {
        if (event.target.matches('.news-link')) {
            event.preventDefault();
            const newsUrl = decodeURIComponent(event.target.getAttribute('data-url'));
            loadNewsContent(newsUrl);
        }
    });

    function loadNewsContent(url) {
        console.log('Fetching news content from URL:', url);
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const title = doc.querySelector('h1.bold.h2.nobmargin') ? doc.querySelector('h1.bold.h2.nobmargin').textContent.trim() : 'No Title';
                const imageElement = doc.querySelector('.img_section img');
                let image = '';
                if (imageElement) {
                    image = imageElement.src;
                    image = correctImageUrl(image);
                    if (shouldExcludeImage(image)) {
                        image = '';
                    }
                }

                const contentContainer = doc.querySelector('.the-post-description');
                let content = 'No Content Available';
                if (contentContainer) {
                    content = contentContainer.innerHTML.trim();
                }

                // Extract posted metadata
                const postedMetaDataElement = doc.querySelector('.posted_meta_data');
                const { postedDate, postedAuthor } = extractPostedMetaData(postedMetaDataElement);

                const additionalImageElement = doc.querySelector('img.center-block');
                let additionalImage = '';
                if (additionalImageElement) {
                    additionalImage = additionalImageElement.src;
                    additionalImage = correctImageUrl(additionalImage);
                    if (shouldExcludeImage(additionalImage)) {
                        additionalImage = '';
                    }
                }

                const modalBody = document.getElementById('modal-body');
                modalBody.innerHTML = `
                    <h1>${title}</h1>
                    ${formatPostedMetaData(postedDate, postedAuthor)}
                    ${additionalImage ? `<img src="${additionalImage}" alt="${title}" class="modal-thumbnail">` : ''}
                    ${image ? `<img src="${image}" alt="${title}" class="modal-image">` : ''}
                    <div>${content}</div>
                `;

                document.getElementById('newsModal').style.display = 'block';
                console.log('Modal content:', modalBody.innerHTML);
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });

    window.onclick = function(event) {
        if (event.target === document.getElementById('newsModal')) {
            document.getElementById('newsModal').style.display = 'none';
        }
    }
});
