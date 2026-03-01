const express = require('express');
const { TeamMember } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/team — list all team members
router.get('/', auth, async (req, res, next) => {
    try {
        const members = await TeamMember.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        res.json(members);
    } catch (err) {
        next(err);
    }
});

// POST /api/team — add team member
router.post('/', auth, async (req, res, next) => {
    try {
        const { name, email, role } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const member = await TeamMember.create({
            user_id: req.user.id,
            name,
            email: email || null,
            role: role || 'General'
        });

        res.status(201).json(member);
    } catch (err) {
        next(err);
    }
});

// PUT /api/team/:id — update team member
router.put('/:id', auth, async (req, res, next) => {
    try {
        const member = await TeamMember.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!member) return res.status(404).json({ error: 'Team member not found' });

        const { name, email, role, status } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) updates.role = role;
        if (status !== undefined) updates.status = status;

        await member.update(updates);
        res.json(member);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/team/:id — remove team member
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const member = await TeamMember.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!member) return res.status(404).json({ error: 'Team member not found' });

        await member.destroy();
        res.json({ message: 'Team member removed' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
