import { expect } from 'chai';
import PouchDB from 'pouchdb';

import api from '@/api';


function sampleDeadline() {
  const deadline = new Date();
  // We don't store milliseconds, so let's round it so we can compare with it.
  deadline.setMilliseconds(0);
  return deadline;
}


function sampleNewTask(overrides) {
  return {
    content: 'some task',
    deadline: sampleDeadline(),
    duration: 60 * 60,
    importance: 8,
    time_segment_id: 0,
    ...overrides,
  };
}


function addHours(date, hours) {
  date.setHours(date.getHours() + hours);
  return date;
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
  });

  describe('#removeTask', () => {
    it('should blow up if the task doesn\'t exist', async function _() {
      return expect(this.$api.removeTask(123)).to.be.rejected;
    });

    it('should remove a task if it exists', async function _() {
      const addedTask = await this.$api.addTask(sampleNewTask());
      const result = await this.$api.removeTask(addedTask.id);
      expect(result).to.eql(null);
      const allTasks = await this.$api.listTasks();
      expect(allTasks).to.eql([]);
    });

    it('should only remove the given task', async function _() {
      const addedTask = await this.$api.addTask(sampleNewTask());
      const addedTask2 = await this.$api.addTask(sampleNewTask());
      const result = await this.$api.removeTask(addedTask.id);
      expect(result).to.eql(null);
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
        deadline: addHours(sampleDeadline(), 5),
      });
      const addedTask1 = await this.$api.addTask(task1);
      const task2 = sampleNewTask({
        content: 'task2',
        deadline: addHours(sampleDeadline(), 4),
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
});
