<template>
  <div id="app">
    <button @click="schedule">Schedule</button>
    <div>{{ pseudo_flash }}</div>
    <ol>
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
    </ol>
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
    schedule (event) {
      let result = this.api.print_schedule();
      console.log(result);
      if (result != null) {
        this.pseudo_flash = result.error;
      } else {
        this.pseudo_flash = '';
      }
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
