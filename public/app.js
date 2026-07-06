/* global document, fetch */

const form = document.querySelector('#todo-form');
const titleInput = document.querySelector('#todo-title');
const todoList = document.querySelector('#todo-list');
const errorMessage = document.querySelector('#error-message');

function setError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  setError('');
}

function renderTodos(todos) {
  todoList.replaceChildren();

  if (todos.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No todos yet.';
    todoList.appendChild(emptyItem);
    return;
  }

  for (const todo of todos) {
    const item = document.createElement('li');

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = Boolean(todo.completed);
    toggle.addEventListener('change', async () => {
      try {
        clearError();
        const response = await fetch(`/api/todos/${encodeURIComponent(todo.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: toggle.checked }),
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        await loadTodos();
      } catch {
        setError('Failed to update todo.');
        toggle.checked = !toggle.checked;
      }
    });

    const title = document.createElement('span');
    title.textContent = todo.title;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      try {
        clearError();
        const response = await fetch(`/api/todos/${encodeURIComponent(todo.id)}`, {
          method: 'DELETE',
        });

        if (!response.ok && response.status !== 204) {
          throw new Error('Request failed');
        }

        await loadTodos();
      } catch {
        setError('Failed to delete todo.');
      }
    });

    item.appendChild(toggle);
    item.appendChild(title);
    item.appendChild(remove);
    todoList.appendChild(item);
  }
}

async function loadTodos() {
  try {
    const response = await fetch('/api/todos');
    if (!response.ok) {
      throw new Error('Request failed');
    }

    const todos = await response.json();
    renderTodos(Array.isArray(todos) ? todos : []);
    clearError();
  } catch {
    renderTodos([]);
    setError('Failed to load todos.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title.length === 0) {
    return;
  }

  try {
    clearError();
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    titleInput.value = '';
    await loadTodos();
  } catch {
    setError('Failed to add todo.');
  }
});

void loadTodos();
