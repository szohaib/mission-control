const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data');
let db = {};

function ensureDataDir() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
}

function loadCollection(name) {
  const filePath = path.join(dbPath, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

function saveCollection(name, data) {
  const filePath = path.join(dbPath, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function initDatabase() {
  ensureDataDir();

  // Initialize collections
  db = {
    tasks: loadCollection('tasks'),
    comments: loadCollection('comments'),
    activity_feed: loadCollection('activity_feed'),
    agent_metrics: loadCollection('agent_metrics')
  };

  console.log('✅ Database initialized (JSON file storage)');
  return db;
}

function getDatabase() {
  if (!db || Object.keys(db).length === 0) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Simple query builder for JSON collections
class QueryBuilder {
  constructor(collection) {
    this.collection = collection;
    this.filters = [];
  }

  where(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  all() {
    let results = [...this.collection];

    // Apply filters
    this.filters.forEach(filter => {
      results = results.filter(item => {
        const fieldValue = item[filter.field];
        switch (filter.operator) {
          case '=':
            return fieldValue === filter.value;
          case '!=':
            return fieldValue !== filter.value;
          case '>':
            return fieldValue > filter.value;
          case '<':
            return fieldValue < filter.value;
          case 'IN':
            return filter.value.includes(fieldValue);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (this.sortField) {
      results.sort((a, b) => {
        const aVal = a[this.sortField];
        const bVal = b[this.sortField];
        if (aVal < bVal) return this.sortDirection === 'ASC' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    return results;
  }

  get() {
    const results = this.all();
    return results.length > 0 ? results[0] : null;
  }
}

// Helper functions for common operations
const prepare = {
  // Insert
  run(collectionName, data) {
    const collection = db[collectionName];
    collection.push(data);
    saveCollection(collectionName, collection);
    return { changes: 1, lastInsertRowid: data.id };
  },

  // Select with filters
  query(collectionName) {
    return new QueryBuilder(db[collectionName]);
  },

  // Update
  update(collectionName, id, updates) {
    const collection = db[collectionName];
    const index = collection.findIndex(item => item.id === id);
    if (index !== -1) {
      collection[index] = { ...collection[index], ...updates };
      saveCollection(collectionName, collection);
      return { changes: 1 };
    }
    return { changes: 0 };
  },

  // Delete
  delete(collectionName, id) {
    const collection = db[collectionName];
    const initialLength = collection.length;
    db[collectionName] = collection.filter(item => item.id !== id);
    saveCollection(collectionName, db[collectionName]);
    return { changes: initialLength - db[collectionName].length };
  },

  // Count
  count(collectionName, filters = {}) {
    let collection = db[collectionName];
    Object.keys(filters).forEach(key => {
      collection = collection.filter(item => item[key] === filters[key]);
    });
    return collection.length;
  },

  // Aggregate
  sum(collectionName, field, filters = {}) {
    let collection = db[collectionName];
    Object.keys(filters).forEach(key => {
      collection = collection.filter(item => item[key] === filters[key]);
    });
    return collection.reduce((sum, item) => sum + (item[field] || 0), 0);
  }
};

module.exports = {
  initDatabase,
  getDatabase,
  prepare
};
