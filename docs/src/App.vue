<template>
  <div id="app">
    <div>{{ pseudo_flash }}</div>

    <div>
      <ul>
        <li>
          <form @submit.prevent="addTask">
            <input type="text" v-model="content" placeholder="Task" />
            <input type="text" v-model="deadline" placeholder="Deadline" />
            <input type="text" v-model="duration" placeholder="Duration" />
            <input type="text" v-model="importance" placeholder="Importance" />
            <input type="submit" value="Add" />
          </form>
        </li>
        <li class="task" v-for="task in tasks()">
          <span>{{ task.content }}</span>
          <span>{{ task.deadline }}</span>
          <span>{{ Math.floor(task.duration_minutes / 60) }}h{{ (task.duration_minutes % 60 != 0) ? task.duration_minutes % 60 : "" }}</span>
          <span>{{ task.importance }}</span>
          <button @click="remove(task.id)">Remove</button>
        </li>
      </ul>
    </div>

    <div>
      <button @click="reschedule">Reschedule</button>
      <div v-if="schedule_error">{{ schedule_error }}</div>
      <div v-else-if="schedule.length > 0">
        <ol>
          <li v-for="scheduled_task in schedule">
            <span>{{ scheduled_task.when }}</span>
            <span>{{ scheduled_task.task.content }}</span>
          </li>
        </ol>
      </div>
      <div v-else>Spinner</div>
    </div>
  </div>
</template>


<script>
export default {
  name: 'app',
  props: ['api'],
  data () {
    return {
      content: '',
      deadline: '',
      duration: '',
      importance: '',
      pseudo_flash: '',
      schedule: [],
      schedule_error: '',
    }
  },
  methods: {
    addTask (event) {
      let task = {
        content: this.content,
        deadline: this.deadline,
        duration: this.duration,
        importance: parseInt(this.importance),
      };
      let result = this.api.add_task(task);
      if (result != null) {
        this.pseudo_flash = result.error;
      } else {
        this.pseudo_flash = "Task added!";
      }
      this.$forceUpdate();
    },
    reschedule (event) {
      let result = this.api.schedule();
      console.assert(result != null, "Reschedule returned null");
      if (result.error == null) {
        this.schedule_error = '';
        this.schedule = result;
      } else {
        this.schedule_error = result.error;
      }
      this.$forceUpdate();
    },
    tasks () {
      return this.api.list_tasks();
    },
    remove (id) {
      let result = this.api.remove_task(id);
      if (result != null) {
        this.pseudo_flash = result.error;
      } else {
        this.pseudo_flash = '';
      }
      this.$forceUpdate();
    }
  },
}
</script>


<style lang="sass">
.task > span
  display: inline-block
  min-width: 125px
  text-align: center
</style>
