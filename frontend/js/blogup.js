let page = 1;
let isLoading = false;
const limit = 10;

async function fetchBlogs(params = {}) {
    try {
        const query = new URLSearchParams({ page, limit, ...params }).toString();
        const response = await fetch(`http://localhost:3000/api/blogs?${query}`);
        if (!response.ok) throw new Error('Failed to fetch blogs');
        return await response.json();
    } catch (err) {
        console.error('Error fetching blogs:', err);
        showError('Failed to load blogs');
        return { blogs: [], total: 0, pages: 0 };
    }
}

async function displayBlogs() {
    if (isLoading) return;
    isLoading = true;
    const category = document.getElementById('category-filter').value;
    const search = document.getElementById('search-input').value;
    const tag = new URLSearchParams(window.location.search).get('tag');
    const { blogs, total, pages } = await fetchBlogs({ category, search, tag });

    // Featured Post
    const featuredPost = blogs.find(b => b.is_featured);
    const featuredContainer = document.getElementById('featured-post');
    if (featuredPost) {
        const excerpt = featuredPost.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
        featuredContainer.innerHTML = `
                    <img src="${featuredPost.image_url || 'images/placeholder.jpg'}" alt="${featuredPost.title}">
                    <div class="featured-content">
                        <h3>${featuredPost.title}</h3>
                        <p>${excerpt}</p>
                        <a href="/blogs/${featuredPost.slug}" class="btn">Read the Story</a>
                    </div>
                `;
    } else {
        featuredContainer.innerHTML = '<p>No featured post available.</p>';
    }

    // Blog Grid
    const blogGrid = document.getElementById('blog-grid');
    if (page === 1) blogGrid.innerHTML = '';
    blogGrid.innerHTML += blogs.map(post => `
                <div class="blog-card">
                    <img src="${post.image_url || 'images/placeholder.jpg'}" alt="${post.title}">
                    <div class="blog-content">
                        <h3>${post.title}</h3>
                        <div class="meta">
                            <span><i class="fa-solid fa-calendar"></i> ${new Date(post.created_at).toLocaleDateString()}</span>
                            <span><i class="fa-solid fa-user"></i> ${post.author_name || 'Unknown'}</span>
                        </div>
                        <div class="tags">${post.tags.map(tag => `<a href="?tag=${tag}" class="tag">#${tag}</a>`).join('')}</div>
                        <a href="/blogs/${post.slug}" class="btn">Read More</a>
                    </div>
                </div>
            `).join('');

    // Tags
    const tagsContainer = document.getElementById('tags');
    const allTags = [...new Set(blogs.flatMap(b => b.tags))];
    tagsContainer.innerHTML = allTags.map(tag => `
                <a href="?tag=${tag}" class="tag">#${tag}</a>
            `).join('');

    // Load More Button
    document.getElementById('load-more').style.display = page < pages ? 'block' : 'none';
    isLoading = false;
}

function loadMorePosts() {
    page++;
    displayBlogs();
}

function searchPosts(event) {
    event.preventDefault();
    page = 1;
    displayBlogs();
}

function filterPosts() {
    page = 1;
    displayBlogs();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.textAlign = 'center';
    document.getElementById('blog-posts').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Infinite Scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
        loadMorePosts();
    }
});

document.addEventListener('DOMContentLoaded', displayBlogs);
