document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    
    // Initialize the input event listener
    function initializeInputListener() {
        const userInput = document.getElementById('user-input');
        userInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const inputText = userInput.value.trim();
                if (inputText) {
                    // Change the input bubble to a regular chat bubble with text
                    const userBubble = document.getElementById('user-input-bubble');
                    userBubble.innerHTML = `<p>${inputText}</p>`;
                    
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
                    newUserInputBubble.innerHTML = '<input type="text" id="user-input" placeholder="type something...">';
                    chatBox.appendChild(newUserInputBubble);

                    // Update the user input variable and reinitialize the event listener
                    newUserInputBubble.querySelector('input').focus();
                    initializeInputListener();
                }
            }
        });
    }

    initializeInputListener(); // Initialize the first input listener
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
