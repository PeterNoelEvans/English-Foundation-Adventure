const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Helper to convert absolute file path under uploads/ to a web path
function toWebUploadsPath(absolutePath) {
  if (!absolutePath) return null;
  const uploadsRoot = path.join(__dirname, '../../uploads');
  const relative = path.relative(uploadsRoot, absolutePath).replace(/\\+/g, '/');
  return `/uploads/${relative}`;
}

// Multer storage for organization logos: uploads/org-logos/<orgId>/<year>/
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const orgId = req.params.id || 'common';
    const year = new Date().getFullYear().toString();
    const uploadDir = path.join(__dirname, '../../uploads/org-logos', orgId, year);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid logo type. Allowed: JPEG, PNG, GIF, WebP, SVG'));
  }
});

// Public: list organizations (minimal info) for landing page
router.get('/', async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, domain: true, primaryColor: true, secondaryColor: true, logo: true }
    });
    res.json({ organizations: orgs });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superuser: create a new organization
router.post('/', auth, auth.requireSuperuser, async (req, res) => {
  try {
    const { name, code, domain, primaryColor, secondaryColor, logo } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'name and code are required' });
    }

    const existing = await prisma.organization.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) {
      return res.status(400).json({ message: 'Organization with same name or code already exists' });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        code,
        domain: domain || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        logo: logo || null,
        isActive: true
      }
    });

    res.status(201).json({ organization });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Superuser: update organization fields
router.patch('/:id', auth, auth.requireSuperuser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, domain, primaryColor, secondaryColor, isActive, logo } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (domain !== undefined) data.domain = domain || null;
    if (primaryColor !== undefined) data.primaryColor = primaryColor || null;
    if (secondaryColor !== undefined) data.secondaryColor = secondaryColor || null;
    if (isActive !== undefined) data.isActive = !!isActive;
    if (logo !== undefined) data.logo = logo || null;

    // Enforce code uniqueness if changed
    if (data.code) {
      const duplicate = await prisma.organization.findFirst({ where: { code: data.code, id: { not: id } } });
      if (duplicate) {
        return res.status(400).json({ message: 'Organization code already exists' });
      }
    }

    if (data.name) {
      const duplicateName = await prisma.organization.findFirst({ where: { name: data.name, id: { not: id } } });
      if (duplicateName) {
        return res.status(400).json({ message: 'Organization name already exists' });
      }
    }

    const updated = await prisma.organization.update({ where: { id }, data });
    res.json({ organization: updated });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Superuser: upload/update organization logo
router.post('/:id/logo', auth, auth.requireSuperuser, logoUpload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No logo file uploaded' });
    }

    // Ensure organization exists
    const organization = await prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Delete previous logo if it exists
    if (organization.logo) {
      try {
        const oldPath = path.join(__dirname, '../../', organization.logo.replace(/^\/+/, ''));
        if (oldPath.startsWith(path.join(__dirname, '../../uploads')) && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (_) {}
    }

    const webPath = toWebUploadsPath(req.file.path);
    const updated = await prisma.organization.update({
      where: { id },
      data: { logo: webPath }
    });

    res.json({ message: 'Logo uploaded successfully', organization: updated });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

