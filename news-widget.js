document.addEventListener('DOMContentLoaded', function () {
    const baseUrl = 'https://www.tradepr.work/articles/';
    let currentPage = 1; // Track the current page
    let totalPages = 9; // Set default total pages (this can be dynamic)
    let isViewingContent = false; // Track whether the user is viewing a full article

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
            caption.setAttribute('contenteditable', 'false'); // Disable contenteditable
        });
    }

    // Load the news list with pagination
    function loadNewsList(page) {
        currentPage = page; // Update the current page number
        isViewingContent = false; // User is back to viewing the list
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'block'; // Show pagination
        }
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
                    addPagination(page); // Pass the current page for comparison
                }

                window.scrollTo(0, 0); // Scroll to top when loading the list
            })
            .catch(error => console.error('Error loading news:', error));
    }

    // Handle pagination dynamically
    function addPagination(currentPage) {
        const paginationContainer = document.getElementById('pagination') || document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.innerHTML = '';

        // Only add the first page button if not on the first page
        if (currentPage > 1) {
            const firstPageButton = document.createElement('span');
            firstPageButton.innerText = '<<';
            firstPageButton.classList.add('page-number');
            firstPageButton.addEventListener('click', function () {
                loadNewsList(1); // Go to the first page
            });
            paginationContainer.appendChild(firstPageButton);
        }

        // Only add the "<" button if not on the first page
        if (currentPage > 1) {
            const prevPageButton = document.createElement('span');
            prevPageButton.innerText = '<';
            prevPageButton.classList.add('page-number');
            prevPageButton.addEventListener('click', function () {
                loadNewsList(currentPage - 1); // Go to the previous page
            });
            paginationContainer.appendChild(prevPageButton);
        }

        // Calculate the range of page numbers to display
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        // Add numbered page buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('span');
            pageButton.innerText = i;
            pageButton.classList.add('page-number');
            if (i === currentPage) {
                pageButton.classList.add('current-page'); // Highlight the current page
            }
            pageButton.addEventListener('click', function () {
                loadNewsList(i); // Load the selected page
            });
            paginationContainer.appendChild(pageButton);
        }

        // Only add the ">" button if not on the last page
        if (currentPage < totalPages) {
            const nextPageButton = document.createElement('span');
            nextPageButton.innerText = '>';
            nextPageButton.classList.add('page-number');
            nextPageButton.addEventListener('click', function () {
                loadNewsList(currentPage + 1); // Go to the next page
            });
            paginationContainer.appendChild(nextPageButton);
        }

        // Only add the last page button if not on the last page
        if (currentPage < totalPages) {
            const lastPageButton = document.createElement('span');
            lastPageButton.innerText = '>>';
            lastPageButton.classList.add('page-number');
            lastPageButton.addEventListener('click', function () {
                loadNewsList(totalPages); // Go to the last page
            });
            paginationContainer.appendChild(lastPageButton);
        }

        // Append pagination to the widget
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

    // Load full news content
    function loadNewsContent(url) {
        isViewingContent = true;
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none'; // Hide pagination
        }

        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const modalContent = document.getElementById('news-modal-content');
                if (!modalContent) {
                    console.error('Modal content element not found.');
                    return; // Exit if the modalContent is not found
                }

                const newsTitle = doc.querySelector('.col-md-12.tmargin')?.textContent.trim() || 'No Title Available';
                const newsImage = doc.querySelector('.alert-secondary.btn-block.text-center img')?.src || '';
                const newsDescription = doc.querySelector('.the-post-description')?.innerHTML || 'No Content Available';

                modalContent.innerHTML = `
                    <h2>${newsTitle}</h2>
                    ${newsImage ? `<img src="${correctImageUrl(newsImage)}" alt="${newsTitle}" class="news-modal-image">` : ''}
                    <div class="news-modal-description">${newsDescription}</div>
                `;

                // Open the modal and scroll to the top
                const newsModal = document.getElementById('news-modal');
                if (newsModal) {
                    newsModal.style.display = 'block';
                    modalContent.scrollTop = 0; // Scroll to the top
                    disableContentEditable(); // Disable contenteditable captions
                }
            })
            .catch(error => console.error('Error loading news content:', error));
    }

    // Close the modal when the close button is clicked
    const closeModalButton = document.getElementById('news-modal-close');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function () {
            const newsModal = document.getElementById('news-modal');
            if (newsModal) {
                newsModal.style.display = 'none';
            }
            loadNewsList(currentPage); // Reload the news list on modal close
        });
    }

    // Load the initial news list
    loadNewsList(currentPage);
});
