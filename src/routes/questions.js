const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Helper: validate question by type
function validateQuestionByType(q) {
  if (!q.content || !q.unitId || !q.type) return 'Missing content, unitId, or type';
  if (!q.options) return 'Missing options';
  switch (q.type) {
    case 'multiple_choice':
      if (!Array.isArray(q.options) || q.options.length < 2) return 'Options must be an array of at least 2';
      if (!q.answer) return 'Missing answer';
      if (!q.options.includes(q.answer)) return 'Answer must match one of the options';
      break;
    case 'drag_and_drop':
      if (!Array.isArray(q.options.items) || !Array.isArray(q.options.correctOrder)) return 'Options must have items and correctOrder arrays';
      break;
    case 'sortable':
      if (!Array.isArray(q.options.items) || !Array.isArray(q.options.correctOrder)) return 'Options must have items and correctOrder arrays';
      break;
    case 'matching':
      if (!Array.isArray(q.options.left) || !Array.isArray(q.options.right) || !Array.isArray(q.options.pairs)) return 'Options must have left, right, and pairs arrays';
      break;
    default:
      return 'Unknown question type';
  }
  return null;
}

// Create a new question (any type)
router.post('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const q = req.body;
    const error = validateQuestionByType(q);
    if (error) return res.status(400).json({ message: error });
    const question = await prisma.question.create({
      data: {
        content: q.content,
        type: q.type,
        options: q.options,
        answer: q.answer,
        unitId: q.unitId,
      },
    });
    res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List questions for a unit
router.get('/', auth, async (req, res) => {
  try {
    const { unitId } = req.query;
    if (!unitId) {
      return res.status(400).json({ message: 'unitId is required' });
    }
    const questions = await prisma.question.findMany({
      where: { unitId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk import questions (any type)
router.post('/bulk', auth, requireRole(['TEACHER']), async (req, res) => {
  const questions = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Request body must be an array of questions' });
  }
  const results = [];
  for (const [i, q] of questions.entries()) {
    const error = validateQuestionByType(q);
    if (error) {
      results.push({ index: i, status: 'error', error });
      continue;
    }
    try {
      const question = await prisma.question.create({
        data: {
          content: q.content,
          type: q.type,
          options: q.options,
          answer: q.answer,
          unitId: q.unitId,
        },
      });
      results.push({ index: i, status: 'success', question });
    } catch (error) {
      results.push({ index: i, status: 'error', error: error.message });
    }
  }
  res.json({ results });
});

// Edit a question
router.patch('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const q = req.body;
    const error = validateQuestionByType({ ...q, type: q.type || undefined });
    if (error) return res.status(400).json({ message: error });
    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        content: q.content,
        type: q.type,
        options: q.options,
        answer: q.answer,
        unitId: q.unitId,
      },
    });
    res.json({ message: 'Question updated', question: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a question
router.delete('/:id', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 