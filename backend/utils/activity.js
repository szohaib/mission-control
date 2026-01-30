const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { broadcastActivity } = require('../websocket');

function logActivity({ type, actor, action, targetType, targetId, metadata }) {
  try {
    const db = getDatabase();
    const activityId = uuidv4();
    const timestamp = Date.now();

    db.prepare(`
      INSERT INTO activity_feed (id, type, actor, action, targetType, targetId, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      activityId,
      type,
      actor,
      action,
      targetType || null,
      targetId || null,
      metadata || null,
      timestamp
    );

    const activity = db.prepare('SELECT * FROM activity_feed WHERE id = ?').get(activityId);

    // Broadcast to WebSocket clients
    broadcastActivity(activity);

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

module.exports = {
  logActivity
};
