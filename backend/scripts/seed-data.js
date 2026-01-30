#!/usr/bin/env node

/**
 * Seed database with sample data for development
 */

const { initDatabase, getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

function seedTasks() {
  const db = getDatabase();
  const now = Date.now();

  const tasks = [
    {
      id: uuidv4(),
      title: 'Build authentication system',
      description: 'Implement JWT-based authentication with password protection',
      status: 'done',
      priority: 'high',
      assignedAgent: null,
      tags: ['backend', 'security'],
      metadata: { estimatedHours: 4 }
    },
    {
      id: uuidv4(),
      title: 'Create WebSocket server',
      description: 'Real-time updates for agent status and task changes',
      status: 'done',
      priority: 'high',
      assignedAgent: null,
      tags: ['backend', 'realtime'],
      metadata: { estimatedHours: 3 }
    },
    {
      id: uuidv4(),
      title: 'Build frontend dashboard',
      description: 'React-based dashboard with real-time updates',
      status: 'in-progress',
      priority: 'high',
      assignedAgent: 'frontend-agent',
      tags: ['frontend', 'react'],
      metadata: { estimatedHours: 8, progress: 60 }
    },
    {
      id: uuidv4(),
      title: 'Add agent metrics collection',
      description: 'Track tokens, costs, and performance metrics',
      status: 'todo',
      priority: 'medium',
      assignedAgent: null,
      tags: ['backend', 'metrics'],
      metadata: { estimatedHours: 2 }
    },
    {
      id: uuidv4(),
      title: 'Implement task filtering',
      description: 'Filter tasks by status, agent, tags, and priority',
      status: 'todo',
      priority: 'low',
      assignedAgent: null,
      tags: ['frontend', 'ux'],
      metadata: { estimatedHours: 2 }
    },
    {
      id: uuidv4(),
      title: 'Deploy to production',
      description: 'Setup production environment with PM2 and SSL',
      status: 'todo',
      priority: 'medium',
      assignedAgent: null,
      tags: ['devops', 'deployment'],
      metadata: { estimatedHours: 3 }
    }
  ];

  console.log('🌱 Seeding tasks...');

  tasks.forEach(task => {
    db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, assignedAgent, createdAt, updatedAt, dueDate, tags, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assignedAgent,
      now - Math.random() * 86400000 * 7, // Random time in last 7 days
      now,
      null,
      JSON.stringify(task.tags),
      JSON.stringify(task.metadata)
    );

    console.log(`  ✅ ${task.title}`);
  });

  return tasks;
}

function seedComments(tasks) {
  const db = getDatabase();
  const now = Date.now();

  console.log('\n💬 Seeding comments...');

  const comments = [
    {
      taskId: tasks[0].id,
      author: 'admin',
      content: 'JWT implementation complete with 24h expiry'
    },
    {
      taskId: tasks[0].id,
      author: 'security-agent',
      content: 'Tested with bcrypt password hashing'
    },
    {
      taskId: tasks[2].id,
      author: 'frontend-agent',
      content: 'Dashboard layout complete, working on WebSocket integration'
    },
    {
      taskId: tasks[2].id,
      author: 'admin',
      content: 'Looking good! Make sure to add loading states'
    }
  ];

  comments.forEach(comment => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, taskId, author, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, comment.taskId, comment.author, comment.content, now - Math.random() * 86400000);

    console.log(`  ✅ Comment on "${tasks.find(t => t.id === comment.taskId).title}"`);
  });
}

function seedActivities() {
  const db = getDatabase();
  const now = Date.now();

  console.log('\n📰 Seeding activity feed...');

  const activities = [
    {
      type: 'task',
      actor: 'admin',
      action: 'created',
      targetType: 'task',
      targetId: 'task-1',
      metadata: { title: 'Build authentication system' }
    },
    {
      type: 'agent',
      actor: 'admin',
      action: 'spawned',
      targetType: 'agent',
      targetId: 'frontend-agent',
      metadata: { task: 'Build frontend dashboard' }
    },
    {
      type: 'task',
      actor: 'admin',
      action: 'updated',
      targetType: 'task',
      targetId: 'task-3',
      metadata: { changes: ['status'] }
    },
    {
      type: 'comment',
      actor: 'security-agent',
      action: 'commented',
      targetType: 'task',
      targetId: 'task-1',
      metadata: { commentId: 'comment-1' }
    }
  ];

  activities.forEach((activity, i) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO activity_feed (id, type, actor, action, targetType, targetId, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      activity.type,
      activity.actor,
      activity.action,
      activity.targetType,
      activity.targetId,
      JSON.stringify(activity.metadata),
      now - (activities.length - i) * 3600000 // Spread over last N hours
    );

    console.log(`  ✅ ${activity.actor} ${activity.action} ${activity.targetType}`);
  });
}

function seedMetrics() {
  const db = getDatabase();
  const now = Date.now();

  console.log('\n📊 Seeding agent metrics...');

  const agents = ['main', 'frontend-agent', 'backend-agent'];

  agents.forEach(agentId => {
    // Create 24 hours of metrics (one per hour)
    for (let i = 0; i < 24; i++) {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO agent_metrics (id, agentId, sessionId, tokens, cost, runtime, tasksCompleted, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        agentId,
        `session-${agentId}`,
        Math.floor(Math.random() * 10000) + 1000,
        Math.random() * 0.5,
        Math.floor(Math.random() * 3600),
        Math.floor(Math.random() * 5),
        now - i * 3600000
      );
    }

    console.log(`  ✅ 24h metrics for ${agentId}`);
  });
}

function main() {
  console.log('🚀 Mission Control Database Seeder\n');

  initDatabase();
  const tasks = seedTasks();
  seedComments(tasks);
  seedActivities();
  seedMetrics();

  console.log('\n✅ Database seeded successfully!\n');
}

if (require.main === module) {
  main();
}

module.exports = { seedTasks, seedComments, seedActivities, seedMetrics };
