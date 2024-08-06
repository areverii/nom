document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');

    function initializeInputListener(inputElement) {
        inputElement.addEventListener('input', adjustHeight);
        inputElement.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const inputText = inputElement.value.trim();
                if (inputText) {
                    inputElement.setAttribute('readonly', true);
                    inputElement.style.height = 'auto';
                    inputElement.style.height = inputElement.scrollHeight + 'px';
                    inputElement.style.outline = 'none';

                    const agentBubble = document.createElement('div');
                    agentBubble.className = 'chat-bubble left';
                    agentBubble.innerHTML = '<p>...</p>';
                    chatBox.appendChild(agentBubble);

                    chatBox.scrollTop = chatBox.scrollHeight;

                    const response = await callAgent(inputText);
                    if (response && response.response) {
                        agentBubble.innerHTML = `<p>${response.response}</p>`;
                        createMealPlan(response.meal_plan);
                    } else {
                        agentBubble.innerHTML = '<p>Sorry, I couldn\'t generate a meal plan. Please try again.</p>';
                    }

                    const newUserInputBubble = document.createElement('div');
                    newUserInputBubble.className = 'chat-bubble right';
                    newUserInputBubble.id = 'user-input-bubble';
                    const newInput = document.createElement('textarea');
                    newInput.id = 'user-input';
                    newInput.placeholder = 'type something...';
                    newUserInputBubble.appendChild(newInput);
                    chatBox.appendChild(newUserInputBubble);

                    newInput.focus();
                    initializeInputListener(newInput);

                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }
        });
    }

    function adjustHeight(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    document.addEventListener('keypress', (event) => {
        const currentInput = document.querySelector('.chat-bubble.right textarea:not([readonly])');
        if (currentInput) {
            currentInput.focus();
        }
    });

    const initialInput = document.getElementById('user-input');
    initializeInputListener(initialInput);
});

async function callAgent(input) {
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

function createMealPlan(mealPlan) {
    const mealPlanContainer = document.getElementById('meal-plan');
    mealPlanContainer.innerHTML = '';

    mealPlan.days.forEach((day, index) => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';

        const dayLabel = document.createElement('h3');
        dayLabel.textContent = day.day;

        const breakfastLabel = document.createElement('p');
        breakfastLabel.className = 'meal';
        breakfastLabel.innerHTML = `<strong>Breakfast</strong> ${day.meals.breakfast}`;

        const lunchLabel = document.createElement('p');
        lunchLabel.className = 'meal';
        lunchLabel.innerHTML = `<strong>Lunch</strong> ${day.meals.lunch}`;

        const dinnerLabel = document.createElement('p');
        dinnerLabel.className = 'meal';
        dinnerLabel.innerHTML = `<strong>Dinner</strong> ${day.meals.dinner}`;

        mealCard.appendChild(dayLabel);
        mealCard.appendChild(breakfastLabel);
        mealCard.appendChild(lunchLabel);
        mealCard.appendChild(dinnerLabel);

        mealPlanContainer.appendChild(mealCard);
    });
}
