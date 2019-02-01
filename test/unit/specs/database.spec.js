import { expect } from 'chai';
import PouchDB from 'pouchdb';

import { Database } from '@/database';


describe('database', () => {
  beforeEach(async function _() {
    this.$innerDB = new PouchDB('tasks');
  });

  afterEach(async function _() {
    await this.$innerDB.destroy();
  });

  describe('#migrate', () => {
    it('should migrate from v0 to v1', async function _() {
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

      // Check that data looks like v1
      const tasksPerTimeSegment = await database.allTasksPerTimeSegment();
      expect(tasksPerTimeSegment).to.have.lengthOf(1);
      expect(tasksPerTimeSegment[0]).to.have.lengthOf(2);
      const [timeSegment, tasks] = tasksPerTimeSegment[0];

      expect(timeSegment).to.include({ name: 'Default', type: 'time-segment' });
      expect(timeSegment).to.have.property('ranges').that.has.lengthOf(1);
      const timeRange = timeSegment.ranges[0];
      expect(timeRange).to.have.lengthOf(2);
      expect(timeSegment).to.have.property('start', timeRange[0]);
      const expectedPeriod = (new Date(timeRange[1]).getTime()
                              - new Date(timeRange[0]).getTime()) / 1000;
      expect(timeSegment).to.have.property('period', expectedPeriod);

      expect(tasks).to.have.lengthOf(2);
      expect(tasks[0]).to.include({
        _id: '42',
        type: 'task',
        time_segment_id: parseInt(timeSegment._id, 10),
        content: 'task 1',
        deadline: 1234,
        duration: 20,
        importance: 4,
      });
      expect(tasks[1]).to.include({
        _id: '43',
        type: 'task',
        time_segment_id: parseInt(timeSegment._id, 10),
        content: 'task 2',
        deadline: 5678,
        duration: 200,
        importance: 7,
      });
    });
  });
});
