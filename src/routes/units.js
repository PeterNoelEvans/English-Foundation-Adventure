const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Create a new unit (teacher only)
router.post(
  '/',
  auth,
  requireRole(['TEACHER']),
  [
    body('title').notEmpty(),
    body('number').isInt({ min: 1 }),
    body('description').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { title, number, description } = req.body;
      const unit = await prisma.unit.create({
        data: {
          title,
          number,
          description,
          teacherId: req.user.id,
        },
      });
      res.status(201).json({ message: 'Unit created', unit });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List all units (for the logged-in teacher)
router.get('/', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      where: { teacherId: req.user.id },
      orderBy: { number: 'asc' },
    });
    res.json({ units });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 