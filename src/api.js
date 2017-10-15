export default function() {
  FS.mkdir("/indexed_db");
  FS.mount(IDBFS, {}, "/indexed_db");
  var idbPromise = new Promise((resolve, reject) => {
    FS.syncfs(true, (err) => {
      if (err == null) {
        resolve();
      } else {
        console.error("Could not load IndexedDB:", err);
        reject(err);
      }
    });
  });

  return idbPromise.then(() => ({

    addTask: function(task) {
      let result = Module.ccall('add_task', 'string', ['string'], [JSON.stringify(task)]);
      FS.syncfs(false, (err) => {
        console.assert(err == null, "Could not sync IndexedDB:", err);
      });
      return JSON.parse(result);
    },

    listTasks: function() {
      let result = Module.ccall('list_tasks', 'string', [], []);
      let parsed = JSON.parse(result);
      if (parsed != null && parsed.error == null) {
        parsed.forEach(task => {
          task.deadline = new Date(Date.parse(task.deadline));
        });
      }
      return parsed;
    },

    removeTask: function(id) {
      let result = Module.ccall('remove_task', 'string', ['number'], [id]);
      FS.syncfs(false, (err) => {
        console.assert(err == null, "Could not sync IndexedDB:", err);
      });
      return JSON.parse(result);
    },

    schedule: function() {
      let result = Module.ccall('schedule', 'string', [], []);
      let parsed = JSON.parse(result);
      if (parsed != null && parsed.error == null) {
        parsed.forEach(scheduled_task => {
          scheduled_task.when = new Date(Date.parse(scheduled_task.when));
          scheduled_task.task.deadline = new Date(Date.parse(scheduled_task.task.deadline));
        });
      }
      return parsed;
    },

  }));
};
