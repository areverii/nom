document.getElementById('meal-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('meal-input').value;

    // Clear the input field
    document.getElementById('meal-input').value = '';

    // Append user message to chat
    appendMessage(input, 'user');

    // Call agent function and handle response
    const response = await callAgent(input);
    appendMessage(response, 'bot');

    // Handle meal plan display
    displayMealPlan(response.meal_plan);
});

function appendMessage(message, sender) {
    const chatContainer = document.querySelector('.chat-container');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = `<p>${message}</p>`;
    chatContainer.appendChild(messageElement);
}

function displayMealPlan(mealPlan) {
    const mealPlanContainer = document.getElementById('meal-plan');
    mealPlanContainer.innerHTML = '';
    mealPlan.days.forEach(day => {
        const mealCard = document.createElement('div');
        mealCard.classList.add('meal-card');
        mealCard.innerHTML = `
            <h3>${day.day}</h3>
            <p><strong>Breakfast:</strong> ${day.meals.breakfast}</p>
            <p><strong>Lunch:</strong> ${day.meals.lunch}</p>
            <p><strong>Dinner:</strong> ${day.meals.dinner}</p>
        `;
        mealPlanContainer.appendChild(mealCard);
    });
}
