
/* form used for submitting preferences to the mongodb database
note: preferences are added for the current set user */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('preferences-form');
    const submit_button = form.querySelector('input[type="submit"]');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const form_data = new FormData(form);
        const data = Object.fromEntries(form_data.entries());

        try {
            const response = await fetch('/updatePreferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                submit_button.value = 'updated!';
                setTimeout(() => {
                    submit_button.value = 'submit preferences';
                }, 2000);
            } else {
                submit_button.value = 'something went wrong!';
                setTimeout(() => {
                    submit_button.value = 'submit preferences';
                }, 2000);
            }
        } catch (error) {
            console.error('error while updating preferences:', error);
            submit_button.value = 'something went wrong!';
            setTimeout(() => {
                submit_button.value = 'submit preferences';
            }, 2000);
        }
    });
});