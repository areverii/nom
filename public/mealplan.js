document.getElementById('meal-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const query = document.getElementById('meal-input').value;
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        displayMealPlan(data);
    } catch (error) {
        console.error('Error generating meal plan:', error);
    }
});

function displayMealPlan(data) {
    const mealPlanDiv = document.getElementById('meal-plan');
    mealPlanDiv.innerHTML = ''; // Clear previous content

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    data.meal_plan.days.forEach((day, index) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayTitle = document.createElement('h3');
        dayTitle.textContent = daysOfWeek[(day.day - 1) % 7]; // Use modulo to wrap around the week
        dayCard.appendChild(dayTitle);
        
        const mealsList = document.createElement('ul');
        
        for (const [mealType, meal] of Object.entries(day.meals)) {
            const mealItem = document.createElement('li');
            mealItem.textContent = `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal}`;
            mealsList.appendChild(mealItem);
        }
        
        dayCard.appendChild(mealsList);
        mealPlanDiv.appendChild(dayCard);
    });

    const responseText = document.createElement('p');
    responseText.textContent = data.response;
    mealPlanDiv.insertBefore(responseText, mealPlanDiv.firstChild);
}
