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
    mealPlanDiv.innerHTML = `<p>${data.response}</p><pre>${JSON.stringify(data.meal_plan, null, 2)}</pre>`;
}
