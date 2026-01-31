const express = require('express');
const { getDatabase } = require('../database');

const router = express.Router();

// Get activity feed
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM activity_feed';
    const params = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const activities = db.prepare(query).all(...params);

    // Parse metadata
    const enrichedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json(enrichedActivities);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get feed statistics
router.get('/stats', (req, res) => {
  try {
    const db = getDatabase();

    const stats = {
      totalActivities: db.prepare('SELECT COUNT(*) as count FROM activity_feed').get().count,
      byType: {},
      byActor: {},
      recent24h: db.prepare(
        'SELECT COUNT(*) as count FROM activity_feed WHERE timestamp > ?'
      ).get(Date.now() - 86400000).count
    };

    // Activities by type
    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM activity_feed
      GROUP BY type
    `).all();

    byType.forEach(row => {
      stats.byType[row.type] = row.count;
    });

    // Activities by actor
    const byActor = db.prepare(`
      SELECT actor, COUNT(*) as count
      FROM activity_feed
      GROUP BY actor
      ORDER BY count DESC
      LIMIT 10
    `).all();

    byActor.forEach(row => {
      stats.byActor[row.actor] = row.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching feed stats:', error);
    res.status(500).json({ error: 'Failed to fetch feed statistics' });
  }
});

module.exports = router;
