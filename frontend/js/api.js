(function initApi(global) {
    const config = {
        origin: global.ETI_API_ORIGIN || 'http://localhost:3000',
        basePath: '/api'
    };

    const state = {
        activeRequests: 0
    };

    function ensureStyles() {
        if (!global.document || global.document.getElementById('api-runtime-styles')) {
            return;
        }

        const style = global.document.createElement('style');
        style.id = 'api-runtime-styles';
        style.textContent = `
            .api-toast-stack {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                pointer-events: none;
            }

            .api-toast {
                min-width: 260px;
                max-width: 360px;
                padding: 0.9rem 1rem;
                border-radius: 14px;
                color: #fff;
                box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
                font: 500 0.95rem/1.4 "Poppins", sans-serif;
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 180ms ease, transform 180ms ease;
            }

            .api-toast.is-visible {
                opacity: 1;
                transform: translateY(0);
            }

            .api-toast-info {
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
            }

            .api-toast-success {
                background: linear-gradient(135deg, #059669, #047857);
            }

            .api-toast-error {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
            }

            .api-loading-overlay {
                position: fixed;
                inset: 0;
                z-index: 9998;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(15, 23, 42, 0.32);
                backdrop-filter: blur(2px);
            }

            .api-loading-overlay.is-visible {
                display: flex;
            }

            .api-loading-overlay__card {
                display: flex;
                align-items: center;
                gap: 0.85rem;
                padding: 1rem 1.2rem;
                border-radius: 16px;
                background: #ffffff;
                color: #0f172a;
                box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16);
                font: 600 0.95rem/1.4 "Poppins", sans-serif;
            }

            .api-loading-overlay__spinner {
                width: 18px;
                height: 18px;
                border: 3px solid rgba(37, 99, 235, 0.18);
                border-top-color: #2563eb;
                border-radius: 50%;
                animation: api-loading-spin 0.8s linear infinite;
            }

            @keyframes api-loading-spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;

        global.document.head.appendChild(style);
    }

    function ensureToastStack() {
        ensureStyles();

        let stack = global.document.getElementById('api-toast-stack');
        if (!stack) {
            stack = global.document.createElement('div');
            stack.id = 'api-toast-stack';
            stack.className = 'api-toast-stack';
            stack.setAttribute('aria-live', 'polite');
            stack.setAttribute('aria-atomic', 'true');
            global.document.body.appendChild(stack);
        }

        return stack;
    }

    function ensureLoadingOverlay() {
        ensureStyles();

        let overlay = global.document.getElementById('loadingOverlay')
            || global.document.getElementById('loading-overlay')
            || global.document.getElementById('api-loading-overlay');

        if (!overlay) {
            overlay = global.document.createElement('div');
            overlay.id = 'api-loading-overlay';
            overlay.className = 'api-loading-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div class="api-loading-overlay__card" role="status" aria-live="polite">
                    <span class="api-loading-overlay__spinner" aria-hidden="true"></span>
                    <span>Loading...</span>
                </div>
            `;
            global.document.body.appendChild(overlay);
        }

        return overlay;
    }

    function setLoadingState(isLoading) {
        if (!global.document || !global.document.body) {
            return;
        }

        if (global.ETIUI?.setGlobalLoading) {
            global.ETIUI.setGlobalLoading(isLoading);
            global.document.body.classList.toggle('api-loading', isLoading);
            global.dispatchEvent(new CustomEvent('api:loading', {
                detail: {
                    loading: isLoading,
                    activeRequests: state.activeRequests
                }
            }));
            return;
        }

        const overlay = ensureLoadingOverlay();
        overlay.classList.toggle('is-visible', isLoading);
        overlay.setAttribute('aria-hidden', String(!isLoading));
        global.document.body.classList.toggle('api-loading', isLoading);

        global.dispatchEvent(new CustomEvent('api:loading', {
            detail: {
                loading: isLoading,
                activeRequests: state.activeRequests
            }
        }));
    }

    function beginLoading() {
        state.activeRequests += 1;
        setLoadingState(true);
    }

    function endLoading() {
        state.activeRequests = Math.max(0, state.activeRequests - 1);
        setLoadingState(state.activeRequests > 0);
    }

    function resolveUrl(input) {
        if (/^https?:\/\//i.test(input)) {
            return input;
        }

        if (input.startsWith('/api')) {
            return `${config.origin}${input}`;
        }

        if (input.startsWith('/')) {
            return `${config.origin}${config.basePath}${input}`;
        }

        return `${config.origin}${config.basePath}/${input.replace(/^\/+/, '')}`;
    }

    function getStoredUser() {
        try {
            return JSON.parse(global.localStorage.getItem('user'));
        } catch (error) {
            console.error('Failed to read stored user:', error);
            return null;
        }
    }

    function getLoginRedirect() {
        const user = getStoredUser();

        if (user?.role === 'admin') {
            return 'admin-signup-login.html';
        }

        if (user?.role === 'instructor') {
            return 'tutor-signup-login.html';
        }

        const path = global.location?.pathname || '';
        if (path.includes('admin')) {
            return 'admin-signup-login.html';
        }
        if (path.includes('tutor')) {
            return 'tutor-signup-login.html';
        }

        return 'login-signup.html';
    }

    function clearStoredSession() {
        global.localStorage.removeItem('token');
        global.localStorage.removeItem('refreshToken');
        global.localStorage.removeItem('user');
    }

    function showToast(message, options = {}) {
        if (!global.document || !message) {
            return null;
        }

        if (global.ETIUI?.toast) {
            return global.ETIUI.toast(message, options);
        }

        const { type = 'info', duration = 3200 } = options;
        const stack = ensureToastStack();
        const toast = global.document.createElement('div');
        toast.className = `api-toast api-toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        stack.appendChild(toast);

        global.requestAnimationFrame(() => {
            toast.classList.add('is-visible');
        });

        global.setTimeout(() => {
            toast.classList.remove('is-visible');
            global.setTimeout(() => {
                toast.remove();
            }, 180);
        }, duration);

        return toast;
    }

    async function parseSuccess(response, parseMode) {
        if (parseMode === 'response') {
            return response;
        }

        if (parseMode === 'blob') {
            return response.blob();
        }

        if (parseMode === 'text') {
            return response.text();
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    }

    async function createHttpError(response, fallbackMessage) {
        const raw = await response.text();
        let payload = null;

        try {
            payload = raw ? JSON.parse(raw) : null;
        } catch (error) {
            payload = null;
        }

        const message = payload?.error
            || payload?.message
            || raw
            || fallbackMessage
            || `Request failed with status ${response.status}`;

        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        error.raw = raw;
        return error;
    }

    async function request(input, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body,
            auth = true,
            parse,
            responseType,
            token,
            showLoading = true,
            showErrorToast = true,
            redirectOnUnauthorized = true,
            unauthorizedRedirect,
            errorMessage,
            ...fetchOptions
        } = options;

        const finalHeaders = new Headers(headers);
        const finalMethod = method.toUpperCase();
        const parseMode = parse || responseType || 'json';
        const hasFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        const hasBody = body !== undefined && body !== null;
        const isBinaryBody = typeof Blob !== 'undefined' && body instanceof Blob
            || typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
        const isSearchParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
        const shouldSerializeJson = hasBody
            && !hasFormData
            && !isBinaryBody
            && !isSearchParams
            && typeof body === 'object'
            && !(typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer);

        if (auth) {
            const authToken = token || global.localStorage.getItem('token');
            if (authToken && !finalHeaders.has('Authorization')) {
                finalHeaders.set('Authorization', `Bearer ${authToken}`);
            }
        }

        if (hasBody && !hasFormData && !isBinaryBody && !isSearchParams && !finalHeaders.has('Content-Type') && !['GET', 'HEAD'].includes(finalMethod)) {
            finalHeaders.set('Content-Type', 'application/json');
        }

        const finalBody = shouldSerializeJson ? JSON.stringify(body) : body;

        if (showLoading) {
            beginLoading();
        }

        try {
            const response = await global.fetch(resolveUrl(input), {
                ...fetchOptions,
                method: finalMethod,
                headers: finalHeaders,
                body: ['GET', 'HEAD'].includes(finalMethod) ? undefined : finalBody
            });

            if (response.status === 401 && auth) {
                clearStoredSession();

                const unauthorizedError = new Error('Session expired. Please log in again.');
                unauthorizedError.status = 401;

                if (showErrorToast) {
                    showToast(unauthorizedError.message, { type: 'error' });
                    unauthorizedError.toastShown = true;
                }

                if (redirectOnUnauthorized) {
                    global.setTimeout(() => {
                        global.location.href = unauthorizedRedirect || getLoginRedirect();
                    }, 900);
                }

                throw unauthorizedError;
            }

            if (!response.ok) {
                const httpError = await createHttpError(response, errorMessage);
                if (showErrorToast) {
                    showToast(httpError.message, { type: 'error' });
                    httpError.toastShown = true;
                }
                throw httpError;
            }

            return await parseSuccess(response, parseMode);
        } catch (error) {
            if (error?.name !== 'AbortError' && showErrorToast && !error?.toastShown) {
                showToast(error?.message || 'Unable to complete request right now.', { type: 'error' });
            }
            throw error;
        } finally {
            if (showLoading) {
                endLoading();
            }
        }
    }

    const api = {
        request,
        fetch: request,
        showToast,
        get(input, options = {}) {
            return request(input, { ...options, method: 'GET' });
        },
        post(input, body, options = {}) {
            return request(input, { ...options, method: 'POST', body });
        },
        put(input, body, options = {}) {
            return request(input, { ...options, method: 'PUT', body });
        },
        patch(input, body, options = {}) {
            return request(input, { ...options, method: 'PATCH', body });
        },
        del(input, options = {}) {
            return request(input, { ...options, method: 'DELETE' });
        },
        setBaseURL(origin, basePath = config.basePath) {
            config.origin = origin.replace(/\/+$/, '');
            config.basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
        },
        resolveUrl,
        state
    };

    Object.defineProperty(api, 'baseURL', {
        get() {
            return `${config.origin}${config.basePath}`;
        }
    });

    Object.defineProperty(api, 'loading', {
        get() {
            return state.activeRequests > 0;
        }
    });

    global.api = api;
})(window);
