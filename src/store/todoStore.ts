export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

const store = new Map<string, Todo>();

export function createTodo(title: string): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  store.set(todo.id, todo);
  return todo;
}

export function listTodos(): Todo[] {
  return Array.from(store.values());
}

export function getTodoById(id: string): Todo | undefined {
  return store.get(id);
}

export function updateTodo(id: string, input: UpdateTodoInput): Todo | undefined {
  const todo = store.get(id);
  if (!todo) return undefined;
  const updated: Todo = { ...todo, ...input };
  store.set(id, updated);
  return updated;
}

export function deleteTodo(id: string): boolean {
  return store.delete(id);
}

/** Reset store — for use in tests only. */
export function _resetStore(): void {
  store.clear();
}
