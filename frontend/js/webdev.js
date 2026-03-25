document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const toggleFilter = document.getElementById('toggleFilter');
    const filterPanel = document.getElementById('filterPanel');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('search-btn');
    const courseList = document.querySelector('.allcourse-list');
    const filterButtons = document.querySelectorAll('#filterButtons input[type="checkbox"]');

    // Toggle filter panel
    toggleFilter.addEventListener('click', () => {
        filterPanel.classList.toggle('active');
    });

    // Function to fetch courses from API
    async function fetchCourses() {
        try {
            const response = await fetch('https://your-api-endpoint/courses'); // Replace with your actual API base URL
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const courses = await response.json();
            // Map API response to frontend expected structure
            return courses.map(course => ({
                title: course.title,
                description: course.description || 'No description available',
                instructor: course.instructor_name || 'Unknown Instructor',
                price: course.price === 0 ? 'Free' : `₦${course.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                duration: `${course.duration || 0} weeks`, // Convert integer to string
                level: course.level || 'Beginner',
                videoDuration: course.video_duration || 0, // Map video_duration
                category: course.category || 'web',
                topic: course.topic || 'frontend',
                availability: course.status === 'approved' ? 'now' : 'soon',
                format: course.course_type === 'prerecorded' ? 'recorded' : course.course_type, // Map prerecorded to recorded
                image: course.image || 'images/placeholder.jpeg'
            }));
        } catch (error) {
            console.error('Error fetching courses:', error);
            courseList.innerHTML = '<p>Error loading courses. Please try again later.</p>';
            return [];
        }
    }

    // Function to render courses
    function renderCourses(courses) {
        courseList.innerHTML = '';
        if (courses.length === 0) {
            courseList.innerHTML = '<p>No courses found.</p>';
            return;
        }
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.innerHTML = `
                <a href="#" class="allcourse-item">
                    <div class="image">
                        <img src="${course.image}" alt="${course.title}" />
                    </div>
                    <div class="details">
                        <h2>${course.title}</h2>
                        <h3>${course.description}</h3>
                        <p>${course.instructor}</p>
                        <p>${course.duration} <i class="fa-solid fa-circle"></i> ${course.level}</p>
                    </div>
                    <div class="price">
                        <p>${course.price}</p>
                    </div>
                </a>
            `;
            courseList.appendChild(courseElement);
        });
    }

    // Function to get selected filters
    function getSelectedFilters() {
        const filters = {
            duration: [],
            courseDuration: [],
            level: [],
            price: [],
            availability: [],
            format: [],
            category: [],
            topic: []
        };

        filterButtons.forEach(checkbox => {
            if (checkbox.checked) {
                const name = checkbox.name;
                const value = checkbox.id.split('-').slice(1).join('-');
                if (name === 'duration') filters.duration.push(value);
                else if (name === 'course-dur') filters.courseDuration.push(value);
                else if (name === 'level') filters.level.push(value);
                else if (name === 'price') filters.price.push(value);
                else if (name === 'avail') filters.availability.push(value);
                else if (name === 'course-format') filters.format.push(value);
                else if (name === 'cat') filters.category.push(value);
                else if (name === 'top') filters.topic.push(value);
            }
        });

        return filters;
    }

    // Function to filter courses
    function filterCourses(courses) {
        const filters = getSelectedFilters();
        const searchTerm = searchInput.value.toLowerCase();

        let filteredCourses = courses;

        // Apply search filter
        if (searchTerm) {
            filteredCourses = filteredCourses.filter(course =>
                course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm) ||
                course.instructor.toLowerCase().includes(searchTerm)
            );
        }

        // Apply video duration filter (videoDuration in hours)
        if (filters.duration.length > 0) {
            filteredCourses = filteredCourses.filter(course => {
                const hours = course.videoDuration;
                return filters.duration.some(dur => {
                    if (dur === '0-1') return hours <= 1;
                    if (dur === '1-3') return hours > 1 && hours <= 3;
                    if (dur === '3-6') return hours > 3 && hours <= 6;
                    if (dur === '6-12') return hours > 6 && hours <= 12;
                    if (dur === '12-17') return hours > 12 && hours <= 17;
                    if (dur === '17-20') return hours > 17 && hours <= 20;
                    if (dur === '20plus') return hours > 20;
                    return false;
                });
            });
        }

        // Apply course duration filter (duration in weeks)
        if (filters.courseDuration.length > 0) {
            filteredCourses = filteredCourses.filter(course => {
                const weeks = parseInt(course.duration) || 0;
                return filters.courseDuration.some(dur => {
                    if (dur === '1-4') return weeks <= 4;
                    if (dur === '4-8') return weeks > 4 && weeks <= 8;
                    if (dur === '8-12') return weeks > 8 && weeks <= 12;
                    if (dur === '12-20') return weeks > 12 && weeks <= 20;
                    if (dur === '20plus') return weeks > 20;
                    return false;
                });
            });
        }

        // Apply level filter
        if (filters.level.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.level.includes(course.level.toLowerCase())
            );
        }

        // Apply price filter
        if (filters.price.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.price.includes(course.price.toLowerCase() === 'free' ? 'free' : 'paid')
            );
        }

        // Apply availability filter
        if (filters.availability.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.availability.includes(course.availability)
            );
        }

        // Apply format filter
        if (filters.format.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.format.includes(course.format)
            );
        }

        // Apply category filter
        if (filters.category.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.category.includes(course.category)
            );
        }

        // Apply topic filter
        if (filters.topic.length > 0) {
            filteredCourses = filteredCourses.filter(course =>
                filters.topic.includes(course.topic)
            );
        }

        renderCourses(filteredCourses);
    }

    // Initialize and fetch courses
    async function init() {
        const courses = await fetchCourses();
        renderCourses(courses);

        // Event listeners for filters and search
        filterButtons.forEach(checkbox => {
            checkbox.addEventListener('change', () => filterCourses(courses));
        });

        searchInput.addEventListener('input', () => filterCourses(courses));
        searchBtn.addEventListener('click', () => filterCourses(courses));
    }

    // Start the application
    init();
});