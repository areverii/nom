document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');

    // Initialize the input event listener
    function initializeInputListener(inputElement) {
        inputElement.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const inputText = inputElement.value.trim();
                if (inputText) {
                    // Disable the input and make it read-only
                    inputElement.setAttribute('readonly', true);
                    inputElement.setAttribute('placeholder', '');

                    // Create a new agent response bubble
                    const agentBubble = document.createElement('div');
                    agentBubble.className = 'chat-bubble left';
                    agentBubble.innerHTML = '<p>...</p>';
                    chatBox.appendChild(agentBubble);

                    // Scroll to the bottom of the chat box
                    chatBox.scrollTop = chatBox.scrollHeight;

                    // Call the agent function
                    const response = await call_agent(inputText);
                    if (response && response.response) {
                        agentBubble.innerHTML = `<p>${response.response}</p>`;
                    } else {
                        agentBubble.innerHTML = '<p>Sorry, I couldn\'t generate a meal plan. Please try again.</p>';
                    }

                    // Create a new user input bubble
                    const newUserInputBubble = document.createElement('div');
                    newUserInputBubble.className = 'chat-bubble right';
                    newUserInputBubble.id = 'user-input-bubble';
                    const newInput = document.createElement('input');
                    newInput.type = 'text';
                    newInput.id = 'user-input';
                    newInput.placeholder = 'type something...';
                    newUserInputBubble.appendChild(newInput);
                    chatBox.appendChild(newUserInputBubble);

                    // Update the user input variable and reinitialize the event listener
                    newInput.focus();
                    initializeInputListener(newInput);
                }
            }
        });
    }

    // Initialize the first input listener
    const initialInput = document.getElementById('user-input');
    initializeInputListener(initialInput);
});

async function call_agent(input) {
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: input })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating meal plan:', error);
        return null;
    }
}
