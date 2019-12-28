import Color from 'color';
import { expect } from 'chai';
import PouchDB from 'pouchdb';

import api from '@/api';
import * as DateTime from '@/datetime';


function sampleDate() {
  const date = new Date();
  // We don't store milliseconds, so let's round it so we can compare with it.
  date.setMilliseconds(0);
  return date;
}


function sampleNewTask(overrides) {
  return {
    content: 'some task',
    deadline: sampleDate(),
    duration: 60 * 60,
    importance: 8,
    time_segment_id: 0,
    ...overrides,
  };
}


function sampleNewTimeSegment() {
  const start = new Date();
  return {
    name: 'some time segment',
    start,
    period: 7 * 42 * 60 * 60,
    ranges: [{
      start: DateTime.addHours(start, 24),
      end: DateTime.addHours(start, 27),
    }],
    hue: 0,
  };
}


function timeSegmentWithoutGeneratedProperties(segment) {
  expect(segment.uniqueId).to.be.a('string');
  expect(segment.color).to.be.an.instanceof(Color);
  const copy = { ...segment };
  delete copy.uniqueId;
  copy.hue = copy.color.hue();
  delete copy.color;
  // We ensure that the returned object is read-only since we made a shallow
  // copy.
  return Object.freeze(copy);
}


describe('api', () => {
  beforeEach(async function setAPI() {
    this.$api = await api();
  });

  afterEach(async () => {
    const db = new PouchDB('tasks');
    await db.destroy();
  });

  describe('#addTask', () => {
    it('should add two equal tasks but with different id', async function _() {
      const newTask = sampleNewTask();
      const addedTask = await this.$api.addTask(newTask);
      expect(addedTask.id).to.be.a('number');
      expect(addedTask).to.deep.include(newTask);

      // Adding the same task twice should result in two tasks with different
      // id's
      const addedTask2 = await this.$api.addTask(newTask);
      expect(addedTask2.id).to.be.a('number').and.not.eql(addedTask.id);
      expect(addedTask2).to.deep.include(newTask);
    });

    it('should fail when a task with non-existent time segment is added', async function _() {
      const badTask = sampleNewTask({ time_segment_id: 1 });
      return expect(this.$api.addTask(badTask))
        .to.be.rejectedWith('A database error occurred while searching for the time segment of the new task: {"status":404,"name":"not_found","message":"missing","reason":"missing"}')
        .then(async () => {
          expect(await this.$api.listTasks()).to.have.lengthOf(0);
        });
    });
  });

  describe('#removeTask', () => {
    it('should blow up if the task doesn\'t exist', async function _() {
      return expect(this.$api.removeTask(123)).to.be.rejected;
    });

    it('should remove a task if it exists', async function _() {
      const addedTask = await this.$api.addTask(sampleNewTask());
      const result = await this.$api.removeTask(addedTask.id);
      expect(result).to.eql(undefined);
      const allTasks = await this.$api.listTasks();
      expect(allTasks).to.eql([]);
    });

    it('should only remove the given task', async function _() {
      const addedTask = await this.$api.addTask(sampleNewTask());
      const addedTask2 = await this.$api.addTask(sampleNewTask());
      const result = await this.$api.removeTask(addedTask.id);
      expect(result).to.eql(undefined);
      const allTasks = await this.$api.listTasks();
      expect(allTasks).to.have.deep.members([addedTask2]);
    });
  });

  describe('#listTasks', () => {
    it('should list no tasks by default', async function _() {
      const tasks = await this.$api.listTasks();
      expect(tasks).to.eql([]);
    });

    it('should list exactly those tasks that are added', async function _() {
      const addedTask = await this.$api.addTask(sampleNewTask());
      let tasks = await this.$api.listTasks();
      expect(tasks).to.have.lengthOf(1);
      expect(tasks[0]).to.eql(addedTask);

      const addedTask2 = await this.$api.addTask(sampleNewTask());
      tasks = await this.$api.listTasks();
      expect(tasks).to.have.lengthOf(2);
      expect(tasks).to.have.deep.members([addedTask, addedTask2]);
    });
  });

  describe('#schedule', () => {
    it('should return an empty list by default', async function _() {
      const result = await this.$api.schedule();
      expect(result).to.eql([]);
    });

    it('should return a schedule with exactly the tasks I added', async function _() {
      const task1 = sampleNewTask({
        content: 'task1',
        deadline: DateTime.addHours(DateTime.tomorrow(), 18),
      });
      const addedTask1 = await this.$api.addTask(task1);
      const task2 = sampleNewTask({
        content: 'task2',
        deadline: DateTime.addHours(DateTime.tomorrow(), 10),
      });
      const addedTask2 = await this.$api.addTask(task2);

      const schedule = await this.$api.schedule();

      expect(schedule).to.have.lengthOf(2);
      expect(schedule[0]).to.have.keys(['task', 'when']);
      expect(schedule[0].task).to.eql(addedTask2);
      expect(schedule[1]).to.have.keys(['task', 'when']);
      expect(schedule[1].task).to.eql(addedTask1);
    });
  });

  describe('#addTimeSegment', () => {
    it('should add a segment', async function _() {
      const newTimeSegment = sampleNewTimeSegment();
      await this.$api.addTimeSegment(newTimeSegment);
      const timeSegments = await this.$api.listTimeSegments();
      expect(timeSegments).to.have.lengthOf(2);
      const {
        id, // Only present after it's been stored
        ...cleanSegment
      } = timeSegmentWithoutGeneratedProperties(timeSegments[1]);
      expect(id).to.be.a('number');
      expect(cleanSegment).to.eql(newTimeSegment);
    });
  });

  describe('#deleteTimeSegment', () => {
    it('shouldn\'t delete segments that have tasks', async function _() {
      await this.$api.addTask(sampleNewTask());
      const defaultSegment = (await this.$api.listTimeSegments())[0];
      return expect(this.$api.deleteTimeSegment(defaultSegment))
        .to.be.rejectedWith('A database error occurred while deleting a time segment: There is still a task in this time segment. Please delete them or move them to another segment before deleting this segment.')
        .then(async () => {
          expect(await this.$api.listTimeSegments()).to.have.lengthOf(1);
        });
    });

    it('should delete segments that have no tasks', async function _() {
      await this.$api.addTimeSegment(sampleNewTimeSegment());
      await this.$api.deleteTimeSegment((await this.$api.listTimeSegments())[1]);
      const segments = await this.$api.listTimeSegments();
      expect(segments).to.have.lengthOf(1);
    });

    it('shouldn\'t delete the last segment', async function _() {
      const defaultSegment = (await this.$api.listTimeSegments())[0];
      return expect(this.$api.deleteTimeSegment(defaultSegment))
        .to.be.rejectedWith('A database error occurred while trying to delete a time segment: If you remove the last time segment, when should I schedule things?')
        .then(async () => {
          expect(await this.$api.listTimeSegments()).to.have.lengthOf(1);
        });
    });
  });

  describe('#updateTimeSegment', () => {
    it('should update a time segment, leaving the id intact', async function _() {
      const newSegment = sampleNewTimeSegment();
      await this.$api.addTimeSegment(newSegment);
      const timeSegments = await this.$api.listTimeSegments();
      expect(timeSegments).to.have.lengthOf(2);
      const addedSegment = timeSegments[1];
      addedSegment.name = 'new segment name';
      addedSegment.start = sampleDate();
      addedSegment.period = 8 * 42 * 60 * 60;
      addedSegment.ranges = [];
      addedSegment.hue = 100;
      await this.$api.updateTimeSegment(addedSegment);
      const updatedSegments = await this.$api.listTimeSegments();
      expect(updatedSegments).to.have.lengthOf(2);
      expect(timeSegmentWithoutGeneratedProperties(updatedSegments[1]))
        .to.eql(timeSegmentWithoutGeneratedProperties(addedSegment));
    });
  });

  describe('#listTimeSegment', () => {
    it('should list the default segment', async function _() {
      const segments = await this.$api.listTimeSegments();
      expect(segments).to.have.lengthOf(1);
      const segment = segments[0];
      expect(segment).to.include({
        id: 0,
        name: 'Default',
        period: 7 * 24 * 60 * 60,
      });
      expect(segment).to.have.property('ranges').that.has.lengthOf(7);
      segment.ranges.forEach((range) => {
        expect(range.start.getHours()).to.equal(9);
        expect(range.end.getHours()).to.equal(17);
      });
      expect(segment.start.getTime()).to.equal(segment.ranges[0].start.getTime());
      expect(segment.uniqueId).to.be.a('string');
      expect(segment.color).to.be.an.instanceof(Color);
    });
  });
});
