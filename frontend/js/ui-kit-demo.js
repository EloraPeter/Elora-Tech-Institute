document.addEventListener('DOMContentLoaded', () => {
    const toastButtons = document.querySelectorAll('[data-demo-toast]');
    const loaderButton = document.querySelector('[data-demo-loader]');
    const modalButton = document.querySelector('[data-demo-modal]');
    const confirmButton = document.querySelector('[data-demo-confirm]');
    const formButton = document.querySelector('[data-demo-form]');

    toastButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const type = button.getAttribute('data-demo-toast');
            window.ETIUI.toast(`This is a ${type} toast from the shared UI kit.`, {
                type,
                title: `${type.charAt(0).toUpperCase()}${type.slice(1)} toast`
            });
        });
    });

    if (loaderButton) {
        loaderButton.addEventListener('click', () => {
            window.ETIUI.setGlobalLoading(true, { label: 'Preparing your UI preview...' });
            setTimeout(() => {
                window.ETIUI.setGlobalLoading(false);
                window.ETIUI.toast('Loader finished successfully.', {
                    type: 'success',
                    title: 'Done'
                });
            }, 1800);
        });
    }

    if (modalButton) {
        modalButton.addEventListener('click', async () => {
            await window.ETIUI.alert({
                title: 'Modal Preview',
                message: 'This shared modal can power alerts, confirmations, or small forms across the frontend.',
                confirmText: 'Nice'
            });
        });
    }

    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            const accepted = await window.ETIUI.confirm({
                title: 'Publish Course?',
                message: 'Use this confirmation pattern for important actions like publish, delete, or logout.',
                confirmText: 'Publish',
                cancelText: 'Not yet'
            });

            window.ETIUI.toast(
                accepted ? 'Confirmed action received.' : 'Action was canceled.',
                {
                    type: accepted ? 'success' : 'warning',
                    title: accepted ? 'Confirmed' : 'Canceled'
                }
            );
        });
    }

    if (formButton) {
        formButton.addEventListener('click', async () => {
            const values = await window.ETIUI.form({
                title: 'Quick Form',
                confirmText: 'Save',
                cancelText: 'Close',
                bodyHTML: `
                    <form data-ui-modal-form class="ui-form-grid">
                        <div class="ui-input-group" style="grid-column: 1 / -1;">
                            <label for="demo-title">Course title</label>
                            <input id="demo-title" name="title" class="ui-input" type="text" placeholder="Frontend Foundations" required>
                        </div>
                        <div class="ui-input-group">
                            <label for="demo-role">Audience</label>
                            <select id="demo-role" name="audience" class="ui-select">
                                <option value="students">Students</option>
                                <option value="instructors">Instructors</option>
                                <option value="admins">Admins</option>
                            </select>
                        </div>
                    </form>
                `
            });

            if (Object.keys(values).length) {
                window.ETIUI.toast(`Saved "${values.title}" for ${values.audience}.`, {
                    type: 'success',
                    title: 'Form submitted'
                });
            }
        });
    }
});
