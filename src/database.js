import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

import * as DateTime from '@/datetime';

PouchDB.plugin(PouchDBFind);

export class Database {
  constructor(pouch) {
    this.pouch = pouch;
  }

  static async open() {
    const pouch = new PouchDB('tasks', { auto_compaction: true });
    const db = new Database(pouch);
    await db.migrate();
    return db;
  }

  async migrate() {
    let version = await this.getVersion();
    if (version === 0) {
      // Set the default time segment for all tasks
      const oldTasks = (await this.pouch.allDocs({ include_docs: true }))
        .rows
        .map((row) => row.doc);
      const newTasks = oldTasks.map((task) => ({ ...task, type: 'task', time_segment_id: 0 }));
      await this.pouch.bulkDocs(newTasks);
      // Add the default time segment itself
      const timeSegmentStart = new Date(2019, 0, 1, 9); // 9 o'clock on some day
      const ranges = Array.from({ length: 7 }, (_, i) => {
        const start = DateTime.addDays(timeSegmentStart, i);
        return [start, DateTime.addHours(start, 8)];
      });
      await this.pouch.put({
        _id: '0',
        type: 'time-segment',
        name: 'Default',
        start: timeSegmentStart.toISOString(),
        period: 7 * 24 * 60 * 60,
        ranges,
      });
      // Create some indices
      await this.pouch.createIndex({ index: { fields: ['type'] } });
      await this.pouch.createIndex({ index: { fields: ['_id', 'type'] } });
      await this.pouch.createIndex({ index: { fields: ['time_segment_id', 'type'] } });
      // Change the version as the last step so that partial migrations don't
      // bump the version.
      await this.pouch.put({ _id: 'metadata', version: 1 });
      version = 1;
    }
    if (version === 1) {
      // Add a random hue to all time segments
      const oldTimeSegments = (await this.pouch.find({ selector: { type: 'time-segment' } })).docs;
      const newTimeSegments = oldTimeSegments.map((segment) => ({
        ...segment,
        hue: Math.floor(Math.random() * 360),
      }));
      await this.pouch.bulkDocs(newTimeSegments);
      // Change the version as the last step so that partial migrations don't
      // bump the version.
      const metadata = await this.pouch.get('metadata');
      await this.pouch.put({ ...metadata, version: 2 });
      version = 2;
    }
  }

  async getVersion() {
    try {
      return (await this.pouch.get('metadata')).version;
    } catch (error) {
      if (error.reason === 'missing') {
        return 0;
      }
      throw error;
    }
  }

  async create(document, type, id) {
    const response = await this.pouch.put({
      ...document,
      _id: id.toString(),
      id: undefined,
      type,
    });
    console.assert(response.ok);
    return response;
  }

  async update(document, type, rev) {
    const response = await this.pouch.put({
      ...document,
      _id: document.id.toString(),
      _rev: rev,
      id: undefined,
      type,
    });
    console.assert(response.ok);
    return response;
  }

  async updateRegardlessOfRev(id, document, type) {
    const oldDocument = await this.get(id);
    return this.update(document, type, oldDocument._rev);
  }

  async get(id) {
    return this.pouch.get(id.toString());
  }

  async delete(document, type, rev) {
    const response = await this.pouch.remove({
      ...document,
      _id: document.id.toString(),
      _rev: rev,
      id: undefined,
      type,
    });
    console.assert(response.ok);
    return response;
  }

  async deleteRegardlessOfRev(id) {
    const document = await this.get(id);
    const response = await this.pouch.remove(document);
    console.assert(response.ok);
    return response;
  }

  async allTasks() {
    const response = await this.pouch.find({
      selector: { type: 'task' },
    });
    if (response.warning) {
      console.warn(`Fetching tasks issued a warning: ${response.warning}`);
    }
    return response.docs;
  }

  async tasksForTimeSegment(timeSegmentId) {
    const tasksResponse = await this.pouch.find({
      selector: { type: 'task', time_segment_id: timeSegmentId },
    });
    if (tasksResponse.warning) {
      console.warn(`Fetching tasks issued a warning: ${tasksResponse.warning}`);
    }
    return tasksResponse.docs;
  }

  async allTasksPerTimeSegment() {
    const tasksResponse = await this.pouch.find({
      selector: { type: 'task', time_segment_id: { $gte: null } },
      sort: ['time_segment_id'],
    });
    if (tasksResponse.warning) {
      console.warn(`Fetching tasks issued a warning: ${tasksResponse.warning}`);
    }
    const tasks = tasksResponse.docs;

    const timeSegmentsResponse = await this.pouch.find({
      selector: { type: 'time-segment', _id: { $gte: null } },
      sort: ['_id'],
    });
    if (timeSegmentsResponse.warning) {
      console.warn(`Fetching time segments issued a warning: ${timeSegmentsResponse.warning}`);
    }
    const timeSegments = timeSegmentsResponse.docs;

    const tasksPerTimeSegment = [];
    let taskIdx = 0;
    timeSegments.forEach((timeSegment) => {
      const startIdx = taskIdx;
      while (taskIdx < tasks.length
             && tasks[taskIdx].time_segment_id === parseInt(timeSegment._id, 10)) {
        taskIdx += 1;
      }
      tasksPerTimeSegment.push([timeSegment, tasks.slice(startIdx, taskIdx)]);
    });
    return tasksPerTimeSegment;
  }

  async allTimeSegments() {
    const response = await this.pouch.find({
      selector: { type: 'time-segment' },
    });
    if (response.warning) {
      console.warn(`Fetching time segments issued a warning: ${response.warning}`);
    }
    return response.docs;
  }
}

export default Database;
