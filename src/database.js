import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

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
    const version = await this.getVersion();
    if (version === 0) {
      const oldTasks = (await this.pouch.allDocs({ include_docs: true })).rows.map(row => row.doc);
      const newTasks = oldTasks.map(task => ({ ...task, type: 'task', time_segment_id: 0 }));
      await this.pouch.bulkDocs(newTasks);
      const timeSegmentStart = new Date();
      const aWeekInSeconds = 7 * 24 * 60 * 60;
      const timeSegmentEnd = new Date(timeSegmentStart.getTime() + aWeekInSeconds * 1000);
      await this.pouch.put({
        _id: '0',
        type: 'time-segment',
        name: 'Default',
        start: timeSegmentStart.toISOString(),
        period: aWeekInSeconds,
        ranges: [[timeSegmentStart.toISOString(), timeSegmentEnd.toISOString()]],
      });
      await this.pouch.createIndex({ index: { fields: ['type'] } });
      await this.pouch.createIndex({ index: { fields: ['_id', 'type'] } });
      await this.pouch.createIndex({ index: { fields: ['time_segment_id', 'type'] } });
      // Change the version as the last step so that partial migrations don't
      // bump the version.
      await this.pouch.put({ _id: 'metadata', version: 1 });
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

  async put(id, type, document) {
    const response = await this.pouch.put({
      ...document,
      _id: id.toString(),
      id: undefined,
      type,
    });
    console.assert(response.ok);
    return response;
  }

  async get(id) {
    return this.pouch.get(id);
  }

  async remove(document) {
    return this.pouch.remove(document);
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
