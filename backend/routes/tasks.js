const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { broadcastTaskUpdate } = require('../websocket');
const { logActivity } = require('../utils/activity');

const router = express.Router();

// Get all tasks
router.get('/', (req, res) => {
  try {
    const { status, assignedAgent } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (assignedAgent) {
      conditions.push('assignedAgent = ?');
      params.push(assignedAgent);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC';

    const tasks = db.prepare(query).all(...params);

    // Parse JSON fields
    const enrichedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      metadata: task.metadata ? JSON.parse(task.metadata) : {}
    }));

    res.json(enrichedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task with comments
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comments = db.prepare('SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt ASC').all(req.params.id);

    res.json({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      metadata: task.metadata ? JSON.parse(task.metadata) : {},
      comments
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      assignedAgent,
      dueDate,
      tags = [],
      metadata = {}
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const db = getDatabase();
    const taskId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, assignedAgent, createdAt, updatedAt, dueDate, tags, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      title,
      description || null,
      status,
      priority,
      assignedAgent || null,
      now,
      now,
      dueDate || null,
      JSON.stringify(tags),
      JSON.stringify(metadata)
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    // Log activity
    logActivity({
      type: 'task',
      actor: 'admin',
      action: 'created',
      targetType: 'task',
      targetId: taskId,
      metadata: JSON.stringify({ title })
    });

    broadcastTaskUpdate(task);

    res.status(201).json({
      ...task,
      tags: JSON.parse(task.tags),
      metadata: JSON.parse(task.metadata)
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const {
      title,
      description,
      status,
      priority,
      assignedAgent,
      dueDate,
      tags,
      metadata
    } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (assignedAgent !== undefined) {
      updates.push('assignedAgent = ?');
      params.push(assignedAgent);
    }
    if (dueDate !== undefined) {
      updates.push('dueDate = ?');
      params.push(dueDate);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags));
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(JSON.stringify(metadata));
    }

    updates.push('updatedAt = ?');
    params.push(Date.now());
    params.push(id);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    // Log activity
    logActivity({
      type: 'task',
      actor: 'admin',
      action: 'updated',
      targetType: 'task',
      targetId: id,
      metadata: JSON.stringify({ changes: Object.keys(req.body) })
    });

    broadcastTaskUpdate(task);

    res.json({
      ...task,
      tags: JSON.parse(task.tags),
      metadata: JSON.parse(task.metadata)
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    // Log activity
    logActivity({
      type: 'task',
      actor: 'admin',
      action: 'deleted',
      targetType: 'task',
      targetId: req.params.id,
      metadata: JSON.stringify({ title: task.title })
    });

    broadcastTaskUpdate({ id: req.params.id, deleted: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Add comment to task
router.post('/:id/comment', (req, res) => {
  try {
    const { id } = req.params;
    const { content, author = 'admin' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const db = getDatabase();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const commentId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO comments (id, taskId, author, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, id, author, content, now);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);

    // Log activity
    logActivity({
      type: 'comment',
      actor: author,
      action: 'commented',
      targetType: 'task',
      targetId: id,
      metadata: JSON.stringify({ commentId })
    });

    broadcastTaskUpdate({ taskId: id, newComment: comment });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
