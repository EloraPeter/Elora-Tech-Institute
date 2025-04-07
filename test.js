// Toggle Filter Panel
const toggleFilter = document.getElementById('toggleFilter');
const filterPanel = document.getElementById('filterPanel');

toggleFilter.addEventListener('click', () => {
    filterPanel.classList.toggle('hidden');
});

// Search Functionality
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('search-btn');
const courses = document.querySelectorAll('.course');

function filterCoursesBySearch() {
    const query = searchInput.value.toLowerCase();
    courses.forEach(course => {
        const title = course.querySelector('h2').textContent.toLowerCase();
        const description = course.querySelector('h3').textContent.toLowerCase();
        if (title.includes(query) || description.includes(query)) {
            course.classList.remove('hidden');
        } else {
            course.classList.add('hidden');
        }
    });
}

searchInput.addEventListener('input', filterCoursesBySearch);
searchBtn.addEventListener('click', filterCoursesBySearch);

// Filter Functionality
const filterCheckboxes = document.querySelectorAll('.filter-sub input[type="checkbox"]');

function filterCourses() {
    const activeFilters = Array.from(filterCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.getAttribute('data-filter'));

    courses.forEach(course => {
        const courseFilters = [
            course.getAttribute('data-dur'),
            course.getAttribute('data-level'),
            course.getAttribute('data-price'),
            course.getAttribute('data-avail'),
            course.getAttribute('data-cat')
        ];

        // If no filters are active, show all courses
        if (activeFilters.length === 0) {
            course.classList.remove('hidden');
        } else {
            // Check if course matches any active filter
            const matches = activeFilters.some(filter => courseFilters.includes(filter));
            if (matches) {
                course.classList.remove('hidden');
            } else {
                course.classList.add('hidden');
            }
        }
    });

    // Apply search filter on top of category filters
    filterCoursesBySearch();
}

filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', filterCourses);
});

// "Show More" Functionality (Example for Categories)
const showMoreLink = document.querySelector('.show-more');
showMoreLink.addEventListener('click', (e) => {
    e.preventDefault();
    const collapsible = showMoreLink.closest('.collapsible');
    // Add logic to expand categories here (e.g., dynamically add more items or toggle visibility)
    alert('Expand categories here! Add more items or toggle visibility.');
});