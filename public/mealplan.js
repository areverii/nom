document.addEventListener('DOMContentLoaded', () => {
    const chat_box = document.getElementById('chat-box');

    function initialize_input_listener(input_element) {
        input_element.addEventListener('input', adjust_height);
        input_element.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const input_text = input_element.value.trim();
                if (input_text) {
                    input_element.setAttribute('readonly', true);
                    input_element.style.height = 'auto';
                    input_element.style.height = input_element.scrollHeight + 'px';
                    input_element.style.outline = 'none';

                    const agent_bubble = document.createElement('div');
                    agent_bubble.className = 'chat-bubble left';
                    agent_bubble.innerHTML = '<p>...</p>';
                    chat_box.appendChild(agent_bubble);

                    chat_box.scrollTop = chat_box.scrollHeight;

                    const response = await call_agent(input_text);
                    if (response && response.response) {
                        agent_bubble.innerHTML = `<p>${response.response}</p>`;
                        create_meal_plan(response.meal_plan);
                    } else {
                        agent_bubble.innerHTML = '<p>it seems something went wrong, please try again! </p>';
                    }

                    const new_user_input_bubble = document.createElement('div');
                    new_user_input_bubble.className = 'chat-bubble right';
                    new_user_input_bubble.id = 'user-input-bubble';
                    const new_input = document.createElement('textarea');
                    new_input.id = 'user-input';
                    new_input.placeholder = 'type something...';
                    new_user_input_bubble.appendChild(new_input);
                    chat_box.appendChild(new_user_input_bubble);

                    new_input.focus();
                    initialize_input_listener(new_input);

                    chat_box.scrollTop = chat_box.scrollHeight;
                }
            }
        });
    }

    function adjust_height(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    document.addEventListener('keypress', (event) => {
        const current_input = document.querySelector('.chat-bubble.right textarea:not([readonly])');
        if (current_input) {
            current_input.focus();
        }
    });

    const initial_input = document.getElementById('user-input');
    initialize_input_listener(initial_input);
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

function create_meal_plan(meal_plan) {
    const meal_plan_container = document.getElementById('meal-plan');
    meal_plan_container.innerHTML = '';

    meal_plan.days.forEach((day, index) => {
        const meal_card = document.createElement('div');
        meal_card.className = 'meal-card';

        const day_label = document.createElement('h3');
        day_label.textContent = day.day;

        const breakfast_label = document.createElement('p');
        breakfast_label.className = 'meal';
        breakfast_label.innerHTML = `<strong>Breakfast</strong> ${day.meals.breakfast}`;

        const lunch_label = document.createElement('p');
        lunch_label.className = 'meal';
        lunch_label.innerHTML = `<strong>Lunch</strong> ${day.meals.lunch}`;

        const dinner_label = document.createElement('p');
        dinner_label.className = 'meal';
        dinner_label.innerHTML = `<strong>Dinner</strong> ${day.meals.dinner}`;

        meal_card.appendChild(day_label);
        meal_card.appendChild(breakfast_label);
        meal_card.appendChild(lunch_label);
        meal_card.appendChild(dinner_label);

        meal_plan_container.appendChild(meal_card);
    });
}