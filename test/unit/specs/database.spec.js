import { expect } from 'chai';
import PouchDB from 'pouchdb';

import { Database } from '@/database';
import * as DateTime from '@/datetime';


describe('database', () => {
  beforeEach(async function _() {
    this.$innerDB = new PouchDB('tasks');
  });

  afterEach(async function _() {
    await this.$innerDB.destroy();
  });

  describe('#migrate', () => {
    it('should migrate from v0', async function _() {
      // Set up v0 style database
      await this.$innerDB.bulkDocs([{
        _id: '42',
        content: 'task 1',
        deadline: 1234,
        duration: 20,
        importance: 4,
      }, {
        _id: '43',
        content: 'task 2',
        deadline: 5678,
        duration: 200,
        importance: 7,
      }]);

      // Open database the normal way, triggering migration
      const database = await Database.open();

      // Check that metadata looks right
      expect(await database.getVersion()).to.equal(2);

      // Check that data looks right
      const tasksPerTimeSegment = await database.allTasksPerTimeSegment();
      expect(tasksPerTimeSegment).to.have.lengthOf(1);
      expect(tasksPerTimeSegment[0]).to.have.lengthOf(2);
      const [timeSegment, tasks] = tasksPerTimeSegment[0];

      expect(timeSegment).to.include({
        _id: '0',
        type: 'time-segment',
        name: 'Default',
        period: 7 * 24 * 60 * 60,
      });
      expect(timeSegment).to.have.property('ranges').that.has.lengthOf(7);
      timeSegment.ranges.forEach((range) => {
        expect(range).to.have.lengthOf(2);
        expect(new Date(range[0]).getHours()).to.equal(9);
        expect(new Date(range[1]).getHours()).to.equal(17);
      });
      expect(timeSegment).to.have.property('start', timeSegment.ranges[0][0]);
      expect(timeSegment).to.have.property('hue').that.is.within(0, 359);

      expect(tasks).to.have.lengthOf(2);
      expect(tasks[0]).to.include({
        _id: '42',
        type: 'task',
        time_segment_id: 0,
        content: 'task 1',
        deadline: 1234,
        duration: 20,
        importance: 4,
      });
      expect(tasks[1]).to.include({
        _id: '43',
        type: 'task',
        time_segment_id: 0,
        content: 'task 2',
        deadline: 5678,
        duration: 200,
        importance: 7,
      });
    });

    it('should migrate from v1', async function _() {
      // Set up v1 style database
      const start = new Date();
      const origDefaultTimeSegment = {
        _id: '0',
        type: 'time-segment',
        name: 'Default',
        period: 7 * 24 * 60 * 60,
        start,
        ranges: [[start, DateTime.addDays(start, 2)]],
      };
      const origOtherTimeSegment = {
        _id: '678',
        type: 'time-segment',
        name: 'Some other segment',
        period: 7 * 24 * 60 * 60,
        start,
        ranges: [[DateTime.addDays(start, 2), DateTime.addDays(start, 4)]],
      };
      const origTask = {
        _id: '42',
        type: 'task',
        time_segment_id: 0,
        content: 'task 1',
        deadline: 1234,
        duration: 20,
        importance: 4,
      };
      await this.$innerDB.bulkDocs([
        { _id: 'metadata', version: 1 },
        origDefaultTimeSegment,
        origOtherTimeSegment,
        origTask,
      ]);
      await this.$innerDB.createIndex({ index: { fields: ['type'] } });
      await this.$innerDB.createIndex({ index: { fields: ['_id', 'type'] } });
      await this.$innerDB.createIndex({ index: { fields: ['time_segment_id', 'type'] } });

      // Open database the normal way, triggering migration
      const database = await Database.open();

      // Check that data looks like right
      const tasksPerTimeSegment = await database.allTasksPerTimeSegment();
      expect(tasksPerTimeSegment).to.have.lengthOf(2);
      expect(tasksPerTimeSegment[0]).to.have.lengthOf(2);
      const [defaultTimeSegment, defaultsTasks] = tasksPerTimeSegment[0];
      expect(tasksPerTimeSegment[1]).to.have.lengthOf(2);
      const [otherTimeSegment, othersTasks] = tasksPerTimeSegment[1];

      // 1. All the time segments' data should still be there
      expect(defaultTimeSegment).to.deep.include({
        ...origDefaultTimeSegment,
        start: origDefaultTimeSegment.start.toISOString(),
        ranges: origDefaultTimeSegment.ranges.map(range => range.map(time => time.toISOString())),
      });
      expect(otherTimeSegment).to.deep.include({
        ...origOtherTimeSegment,
        start: origOtherTimeSegment.start.toISOString(),
        ranges: origOtherTimeSegment.ranges.map(range => range.map(time => time.toISOString())),
      });
      // 2. All time segments should now have a random hue in [0, 360]
      [defaultTimeSegment, otherTimeSegment].forEach((timeSegment) => {
        expect(timeSegment).to.have.property('hue').that.is.within(0, 359);
      });
      // 3. All tasks should have stayed the same
      expect(defaultsTasks).to.have.lengthOf(1);
      expect(defaultsTasks[0]).to.include(origTask);
      expect(othersTasks).to.have.lengthOf(0);
    });
  });
});
