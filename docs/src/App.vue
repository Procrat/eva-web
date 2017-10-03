<template>
  <div id="app">
    <div>{{ pseudoFlash }}</div>

    <el-row>
      <el-col id="sidebar" :span="4">
        <el-card>
          <el-form>
            <el-form-item>
              <el-input v-model="content"
                placeholder="What do you want to do?"
                />
            </el-form-item>
            <el-form-item>
              <el-row :gutter="5">
                <el-col :span="12">
                  <el-date-picker v-model="deadlineDate"
                    placeholder="Deadline"
                    format="dd/MM"
                    :picker-options="timePickerOptions"
                    class="deadline-date" />
                </el-col>
                <el-col :span="12">
                  <el-time-select v-model="deadlineTime"
                    :picker-options="{
                      start: '00:00',
                      step: '00:30',
                      end: '23:59'
                    }"
                    class="deadline-time"
                    />
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item>
              <el-select v-model="durationMinutes"
                filterable
                default-first-option
                placeholder="Duration"
                class="duration"
                >
                <el-option
                  v-for="option in durationOptions"
                  :key="option.minutes"
                  :label="option.stringified"
                  :value="option.minutes"
                  />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-slider v-model="importance"
                :min="0"
                :max="10"
                :format-tooltip="formatImportance"
                />
            </el-form-item>
            <el-row type="flex" justify="center">
              <el-button @click="addTask" type="primary">
                Let's do this!
              </el-button>
            </el-row>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="20">
        <div>
          <ul>
            <li class="task" v-for="task in tasks()">
              <span>{{ task.content }}</span>
              <span>{{ task.deadline }}</span>
              <span>{{ Math.floor(task.durationMinutes / 60) }}h{{ (task.durationMinutes % 60 != 0) ? task.durationMinutes % 60 : "" }}</span>
              <span>{{ task.importance }}</span>
              <button @click="remove(task.id)">Remove</button>
            </li>
          </ul>
        </div>

        <div>
          <button @click="reschedule">Reschedule</button>
          <div v-if="scheduleError">{{ scheduleError }}</div>
          <div v-else-if="schedule.length > 0">
            <ol>
              <li v-for="scheduledTask in schedule">
                <span>{{ scheduledTask.when }}</span>
                <span>{{ scheduledTask.task.content }}</span>
              </li>
            </ol>
          </div>
          <div v-else>Spinner</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>


<script>
function stripTime(datetime) {
  return new Date(datetime.getFullYear(),
                  datetime.getMonth(),
                  datetime.getDate());
}

function today() {
  return stripTime(new Date());
}

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

function addMonths(date, months) {
  date.setMonth(date.getMonth() + months);
  return date;
}

export default {
  name: 'app',
  props: ['api'],
  constants: {
    durationOptions: [
      {minutes: 2, stringified: "2 minutes"},
      {minutes: 5, stringified: "5 minutes"},
      {minutes: 10, stringified: "10 minutes"},
      {minutes: 15, stringified: "15 minutes"},
      {minutes: 30, stringified: "30 minutes"},
      {minutes: 1, stringified: "1 hour"},
      {minutes: 2, stringified: "2 hours"},
    ],
    timePickerOptions: {
      firstDayOfWeek: 1,
      disabledDate(date) {
        return date < today();
      },
      shortcuts: [
        {
          text: 'Today',
          onClick(picker) {
            picker.$emit('pick', today());
          }
        }, {
          text: 'Tomorrow',
          onClick(picker) {
            picker.$emit('pick', addDays(today(), 1));
          }
        }, {
          text: 'This week',
          onClick(picker) {
            // Weeks should start on Monday
            let weekDay = (today().getDay() + 6) % 7;
            let sunday = today();
            sunday.setDate(today().getDate() + (6 - weekDay));
            picker.$emit('pick', sunday);
          }
        }, {
          text: '+1 week',
          onClick(picker) {
            picker.$emit('pick', addDays(today(), 7));
          }
        }, {
          text: '+2 week',
          onClick(picker) {
            picker.$emit('pick', addDays(today(), 14));
          }
        }, {
          text: 'This month',
          onClick(picker) {
            let lastDay = today();
            lastDay.setMonth(lastDay.getMonth() + 1, 0);
            picker.$emit('pick', lastDay);
          }
        }, {
          text: '+1 month',
          onClick(picker) {
            picker.$emit('pick', addMonths(today(), 1));
          }
        }
      ]
    },
  },
  data() {
    return {
      content: '',
      deadlineDate: '',
      deadlineTime: '',
      durationMinutes: '',
      importance: 5,
      pseudoFlash: '',
      schedule: [],
      scheduleError: '',
    }
  },
  methods: {
    addTask(event) {
      // TODO replace this poor man's validation
      assert(this.content, 'No task given');
      assert(this.deadlineDate || this.deadlineTime, 'No deadline given');
      assert(this.durationMinutes, 'No duration given');

      let deadline = this.deadlineDate || today();
      let deadlineTime = (this.deadlineTime || '00:00')
        .split(':')
        .map((value) => parseInt(value));
      deadline.setHours(deadlineTime[0], deadlineTime[1]);
      assert(deadline > new Date(), 'Deadline is in the past');

      let task = {
        content: this.content,
        deadline: deadline,
        duration_minutes: this.durationMinutes,
        importance: parseInt(this.importance),
      };
      let result = this.api.addTask(task);
      if (result != null) {
        this.pseudoFlash = result.error;
      } else {
        this.pseudoFlash = "Task added!";
        this.content = '';
        this.deadlineDate = '';
        this.deadlineTime = '';
        this.durationMinutes = '';
        this.importance = 5;
      }
      this.$forceUpdate();
    },

    formatImportance(importance) {
      return "Importance: " + importance;
    },

    remove(id) {
      let result = this.api.removeTask(id);
      if (result != null) {
        this.pseudoFlash = result.error;
      } else {
        this.pseudoFlash = '';
      }
      this.$forceUpdate();
    },

    reschedule(event) {
      let result = this.api.schedule();
      console.assert(result != null, "Reschedule returned null");
      if (result.error == null) {
        this.scheduleError = '';
        this.schedule = result;
      } else {
        this.scheduleError = result.error;
      }
      this.$forceUpdate();
    },

    tasks() {
      return this.api.listTasks();
    },
  },
}
</script>


<style lang="sass">
*
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif

.duration, .deadline-date, .deadline-time
  width: 100% !important

.task > span
  display: inline-block
  min-width: 125px
  text-align: center
</style>
