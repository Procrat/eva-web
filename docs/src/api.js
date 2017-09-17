export default function() {
  FS.mkdir("/indexed_db");
  FS.mount(IDBFS, {}, "/indexed_db");
  var idb_promise = new Promise((resolve, reject) => {
    FS.syncfs(true, (err) => {
      if (err == null) {
        resolve();
      } else {
        console.error("Could not load IndexedDB:", err);
        reject(err);
      }
    });
  });

  return idb_promise.then(() => ({
    add_task: function(task) {
      let result = Module.ccall('add_task', 'string', ['string'], [JSON.stringify(task)]);
      FS.syncfs(false, (err) => {
        console.assert(err == null, "Could not sync IndexedDB:", err);
      });
      return JSON.parse(result);
    },
    list_tasks: function() {
      let result = Module.ccall('list_tasks', 'string', [], []);
      return JSON.parse(result);
    },
    remove_task: function(id) {
      let result = Module.ccall('remove_task', 'string', ['number'], [id]);
      FS.syncfs(false, (err) => {
        console.assert(err == null, "Could not sync IndexedDB:", err);
      });
      return JSON.parse(result);
    },
    print_schedule: function() {
      let result = Module.ccall('print_schedule', 'string', [], []);
      return JSON.parse(result);
    },
  }));
};
