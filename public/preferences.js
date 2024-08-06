document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('preferences-form');
    const submitButton = form.querySelector('input[type="submit"]');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/updatePreferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                submitButton.value = 'Updated!';
                setTimeout(() => {
                    submitButton.value = 'Submit Preferences';
                }, 2000);
            } else {
                submitButton.value = 'Error!';
                setTimeout(() => {
                    submitButton.value = 'Submit Preferences';
                }, 2000);
            }
        } catch (error) {
            console.error('An error occurred while updating preferences:', error);
            submitButton.value = 'Error!';
            setTimeout(() => {
                submitButton.value = 'Submit Preferences';
            }, 2000);
        }
    });
});
