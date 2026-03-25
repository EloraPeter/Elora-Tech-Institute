const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'instructor') {
    console.error('Redirecting: No user or not an instructor');
    window.location.href = 'tutor-signup-login.html';
}

// Helper function for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    showError('No authentication token found. Please log in again.');
    setTimeout(() => window.location.href = 'tutor-signup-login.html', 2000);
    throw new Error('No token');
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    showError('Session expired. Please log in again.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTimeout(() => window.location.href = 'tutor-signup-login.html', 1000);
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

// Show error
function showError(message, color = '#dc3545') {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.color = color;
    errorDiv.focus();
    setTimeout(() => errorDiv.textContent = '', 3000);
}

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'tutor-signup-login.html';
}

let modules = [];
let isDirty = false;

// Autosave
setInterval(() => {
    if (isDirty) {
        saveCourse('draft', true);
    }
}, 30000);

// Mark form as dirty on input
document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('change', () => isDirty = true);
});

// Image preview
document.getElementById('course-image').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.className = 'image-preview';
            img.alt = 'Course image preview';
            const previewDiv = document.getElementById('image-preview');
            previewDiv.innerHTML = '';
            previewDiv.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Toggle live schedule visibility
function toggleLiveSchedule() {
    const courseType = document.getElementById('course-type').value;
    document.getElementById('live-schedule').style.display = courseType === 'live' ? 'block' : 'none';
}

// Toggle quiz settings
function toggleQuizSettings() {
    const quizEnabled = document.getElementById('quiz-enabled').checked;
    document.getElementById('quiz-settings').style.display = quizEnabled ? 'block' : 'none';
}

// Add module
function addModule() {
    const moduleId = `module-${modules.length + 1}`;
    modules.push({ id: moduleId, title: '', description: '', type: 'video', required: true });
    const moduleList = document.getElementById('module-list');
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'module-item';
    moduleDiv.id = moduleId;
    moduleDiv.innerHTML = `
        <div class="module-header">
          <input type="text" placeholder="Module Title" class="module-title" required aria-describedby="${moduleId}-title-tooltip">
          <span id="${moduleId}-title-tooltip" class="tooltip">Enter a title for this module.</span>
          <button type="button" class="btn btn-secondary" onclick="removeModule('${moduleId}')">Remove</button>
        </div>
        <div class="module-content">
          <div class="form-group">
            <label for="${moduleId}-description">Module Description</label>
            <textarea id="${moduleId}-description" placeholder="Enter module description" aria-describedby="${moduleId}-description-tooltip"></textarea>
            <span id="${moduleId}-description-tooltip" class="tooltip">Describe the content of this module.</span>
          </div>
          <div class="form-group">
            <label for="${moduleId}-type">Content Type</label>
            <select id="${moduleId}-type" class="module-type" aria-describedby="${moduleId}-type-tooltip">
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="audio">Audio</option>
              <option value="quiz">Quiz</option>
            </select>
            <span id="${moduleId}-type-tooltip" class="tooltip">Select the type of content for this module.</span>
          </div>
          <div class="form-group">
            <label for="${moduleId}-file">Upload Content</label>
            <input type="file" id="${moduleId}-file" class="module-file" accept="video/*,audio/*,application/pdf" aria-describedby="${moduleId}-file-tooltip">
            <span id="${moduleId}-file-tooltip" class="tooltip">Upload a video, audio, or PDF file for this module.</span>
          </div>
          <div class="form-group">
            <label for="${moduleId}-required">Required</label>
            <input type="checkbox" id="${moduleId}-required" class="module-required" checked aria-describedby="${moduleId}-required-tooltip">
            <span id="${moduleId}-required-tooltip" class="tooltip">Check if this module is required for course completion.</span>
          </div>
        </div>
      `;
    moduleList.appendChild(moduleDiv);
    isDirty = true;
}

// Remove module
function removeModule(moduleId) {
    modules = modules.filter(m => m.id !== moduleId);
    document.getElementById(moduleId).remove();
    isDirty = true;
}

// Initialize Sortable.js for drag-and-drop
new Sortable(document.getElementById('module-list'), {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
        const newOrder = Array.from(document.querySelectorAll('.module-item')).map(item => item.id);
        modules = newOrder.map(id => modules.find(m => m.id === id));
        isDirty = true;
    }
});

// Validate form
function validateForm() {
    const form = document.getElementById('create-course-form');
    if (!form.checkValidity()) {
        showError('Please fill out all required fields correctly.');
        return false;
    }
    if (document.getElementById('course-type').value === 'live') {
        const liveDate = new Date(document.getElementById('live-date').value);
        const deadline = new Date(document.getElementById('enrollment-deadline').value);
        if (liveDate <= deadline) {
            showError('Enrollment deadline must be before the session date.');
            return false;
        }
    }
    if (document.getElementById('quiz-enabled').checked) {
        try {
            JSON.parse(document.getElementById('quiz-questions').value);
        } catch (err) {
            showError('Invalid quiz JSON format.');
            return false;
        }
    }
    return true;
}

// Save course
async function saveCourse(status, isAutosave = false) {
    if (!isAutosave && !validateForm()) return;

    const courseData = {
        title: document.getElementById('course-title').value,
        description: document.getElementById('course-description').value,
        category: document.getElementById('course-category').value,
        topic: document.getElementById('course-topic').value,
        level: document.getElementById('course-level').value,
        price: parseFloat(document.getElementById('course-price').value),
        duration: parseInt(document.getElementById('course-duration').value),
        course_type: document.getElementById('course-type').value,
        instructor_id: user.id,
        status: status === 'publish' ? 'pending' : 'draft',
        enrollment_limit: parseInt(document.getElementById('enrollment-limit').value) || null,
        language: document.getElementById('language').value,
        completion_criteria: document.getElementById('completion-criteria').value,
        promo_code: document.getElementById('promo-code').value,
        discount: parseInt(document.getElementById('discount').value) || null,
        audio_speed_enabled: document.getElementById('audio-speed').checked
    };

    if (courseData.course_type === 'live') {
        courseData.live_schedule = {
            date: document.getElementById('live-date').value,
            enrollment_deadline: document.getElementById('enrollment-deadline').value,
            calendar_sync: document.getElementById('calendar-sync').checked
        };
    }

    courseData.modules = modules.map((module, index) => ({
        id: module.id,
        title: document.querySelector(`#${module.id} .module-title`).value,
        description: document.querySelector(`#${module.id} textarea`).value,
        type: document.querySelector(`#${module.id} .module-type`).value,
        required: document.querySelector(`#${module.id} .module-required`).checked,
        order: index + 1
    }));

    if (document.getElementById('quiz-enabled').checked) {
        courseData.quiz_questions = JSON.parse(document.getElementById('quiz-questions').value);
    }

    const formData = new FormData();
    formData.append('course', JSON.stringify(courseData));
    const courseImage = document.getElementById('course-image').files[0];
    if (courseImage) formData.append('course_image', courseImage);
    const captions = document.getElementById('video-captions').files;
    for (let i = 0; i < captions.length; i++) formData.append('captions', captions[i]);
    document.querySelectorAll('.module-file').forEach((fileInput, i) => {
        if (fileInput.files[0]) formData.append(`module_file_${i}`, fileInput.files[0]);
    });

    try {
        const response = await fetch('http://localhost:3000/api/courses', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        if (!response.ok) throw new Error((await response.json()).error);
        isDirty = false;
        showError(`Course ${isAutosave ? 'autosaved' : 'saved'} as ${status}!`, '#28a745');
        if (status === 'publish') window.location.href = 'tutor-dash.html';
    } catch (err) {
        showError('Failed to save course: ' + err.message);
    }
}

// Preview course
function previewCourse() {
    if (!validateForm()) return;
    const preview = document.createElement('div');
    preview.className = 'preview-mode';
    preview.setAttribute('role', 'dialog');
    preview.setAttribute('aria-label', 'Course preview');
    preview.innerHTML = `
        <h3>Course Preview</h3>
        <h4>${document.getElementById('course-title').value}</h4>
        <p>${document.getElementById('course-description').value}</p>
        <h5>Modules</h5>
        <ul>${modules.map(m => `<li>${document.querySelector(`#${m.id} .module-title`).value || 'Untitled'} - ${document.querySelector(`#${m.id} textarea`).value || 'No description'}</li>`).join('')}</ul>
        <button class="btn" onclick="this.parentElement.remove()">Close Preview</button>
      `;
    document.querySelector('.create-course-container').appendChild(preview);
}


