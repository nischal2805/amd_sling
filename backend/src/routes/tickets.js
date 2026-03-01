const express = require('express');
const { Ticket, TeamMember, Deal } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const router = express.Router();

// GET /api/tickets/dashboard — team workload summary
router.get('/dashboard', auth, async (req, res, next) => {
    try {
        const tickets = await Ticket.findAll({
            where: { user_id: req.user.id },
            include: [{ model: TeamMember, as: 'assignee', attributes: ['id', 'name', 'role'] }]
        });

        const members = await TeamMember.findAll({
            where: { user_id: req.user.id, status: 'active' },
            attributes: ['id', 'name', 'role']
        });

        // Build dashboard stats
        const byStatus = { todo: 0, in_progress: 0, review: 0, done: 0 };
        const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
        const byMember = {};

        members.forEach(m => {
            byMember[m.id] = { id: m.id, name: m.name, role: m.role, total: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
        });
        byMember['unassigned'] = { id: null, name: 'Unassigned', role: '', total: 0, todo: 0, in_progress: 0, review: 0, done: 0 };

        tickets.forEach(t => {
            byStatus[t.status] = (byStatus[t.status] || 0) + 1;
            byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
            const key = t.assigned_to || 'unassigned';
            if (byMember[key]) {
                byMember[key].total++;
                byMember[key][t.status] = (byMember[key][t.status] || 0) + 1;
            }
        });

        res.json({
            total_tickets: tickets.length,
            by_status: byStatus,
            by_priority: byPriority,
            by_member: Object.values(byMember).filter(m => m.total > 0 || m.id !== null)
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/tickets — list all tickets
router.get('/', auth, async (req, res, next) => {
    try {
        const where = { user_id: req.user.id };
        if (req.query.status) where.status = req.query.status;
        if (req.query.assigned_to) where.assigned_to = req.query.assigned_to;
        if (req.query.priority) where.priority = req.query.priority;
        if (req.query.category) where.category = req.query.category;

        const tickets = await Ticket.findAll({
            where,
            include: [
                { model: TeamMember, as: 'assignee', attributes: ['id', 'name', 'role'] },
                { model: Deal, as: 'deal', attributes: ['id', 'title'] }
            ],
            order: [
                [sequelize.literal("CASE WHEN priority = 'urgent' THEN 0 WHEN priority = 'high' THEN 1 WHEN priority = 'medium' THEN 2 ELSE 3 END"), 'ASC'],
                ['created_at', 'DESC']
            ]
        });

        res.json(tickets);
    } catch (err) {
        next(err);
    }
});

// POST /api/tickets — create ticket
router.post('/', auth, async (req, res, next) => {
    try {
        const { title, description, category, priority, assigned_to, due_date, deal_id } = req.body;
        if (!title) return res.status(400).json({ error: 'title is required' });

        const ticket = await Ticket.create({
            user_id: req.user.id,
            title,
            description: description || null,
            category: category || 'General',
            priority: priority || 'medium',
            assigned_to: assigned_to || null,
            due_date: due_date || null,
            deal_id: deal_id || null
        });

        const full = await Ticket.findByPk(ticket.id, {
            include: [
                { model: TeamMember, as: 'assignee', attributes: ['id', 'name', 'role'] },
                { model: Deal, as: 'deal', attributes: ['id', 'title'] }
            ]
        });

        res.status(201).json(full);
    } catch (err) {
        next(err);
    }
});

// PUT /api/tickets/:id — update ticket
router.put('/:id', auth, async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const fields = ['title', 'description', 'category', 'priority', 'assigned_to', 'due_date', 'deal_id', 'status'];
        const updates = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        await ticket.update(updates);

        const full = await Ticket.findByPk(ticket.id, {
            include: [
                { model: TeamMember, as: 'assignee', attributes: ['id', 'name', 'role'] },
                { model: Deal, as: 'deal', attributes: ['id', 'title'] }
            ]
        });

        res.json(full);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/tickets/:id/status — quick status change
router.patch('/:id/status', auth, async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const { status } = req.body;
        if (!['todo', 'in_progress', 'review', 'done'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await ticket.update({ status });
        res.json(ticket);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/tickets/:id/assign — reassign ticket
router.patch('/:id/assign', auth, async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        await ticket.update({ assigned_to: req.body.assigned_to || null });

        const full = await Ticket.findByPk(ticket.id, {
            include: [{ model: TeamMember, as: 'assignee', attributes: ['id', 'name', 'role'] }]
        });

        res.json(full);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/tickets/:id — delete ticket
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const ticket = await Ticket.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        await ticket.destroy();
        res.json({ message: 'Ticket deleted' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
