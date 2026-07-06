import { Router } from 'express';
import {
  createTodo,
  deleteTodo,
  getTodoById,
  listTodos,
  updateTodo,
} from '../store/todoStore.js';

const router = Router();

const INVALID_PAYLOAD = { error: 'Invalid request payload' };
const NOT_FOUND = { error: 'Todo not found' };

router.get('/', (_req, res) => {
  res.status(200).json(listTodos());
});

router.post('/', (req, res) => {
  const { title } = req.body as Record<string, unknown>;
  if (typeof title !== 'string' || title.trim() === '') {
    res.status(400).json(INVALID_PAYLOAD);
    return;
  }
  const todo = createTodo(title);
  res.status(201).json(todo);
});

router.get('/:id', (req, res) => {
  const todo = getTodoById(req.params.id);
  if (!todo) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  res.status(200).json(todo);
});

router.put('/:id', (req, res) => {
  const todo = getTodoById(req.params.id);
  if (!todo) {
    res.status(404).json(NOT_FOUND);
    return;
  }

  const body = req.body as Record<string, unknown>;
  const titlePresent = Object.prototype.hasOwnProperty.call(body, 'title');
  const completedPresent = Object.prototype.hasOwnProperty.call(body, 'completed');

  const titleValid = !titlePresent || (typeof body.title === 'string' && (body.title as string).trim() !== '');
  const completedValid = !completedPresent || typeof body.completed === 'boolean';

  if (!titleValid || !completedValid || (!titlePresent && !completedPresent)) {
    res.status(400).json(INVALID_PAYLOAD);
    return;
  }

  const input: { title?: string; completed?: boolean } = {};
  if (titlePresent) input.title = body.title as string;
  if (completedPresent) input.completed = body.completed as boolean;

  const updated = updateTodo(req.params.id, input);
  res.status(200).json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = deleteTodo(req.params.id);
  if (!deleted) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  res.status(204).send();
});

export default router;
