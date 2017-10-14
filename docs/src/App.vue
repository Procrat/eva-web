<template>
  <div id="app">
    <el-row :gutter="15">
      <el-col id="sidebar" :span="5">
        <el-card>
          <el-form class="add-task-form">
            <el-form-item>
              <el-input v-model="content"
                placeholder="What do you want to do?"
                />
            </el-form-item>
            <el-form-item>
              <el-row type="flex" :gutter="5" class="deadline">
                <el-col>
                  <el-date-picker v-model="deadlineDate"
                    placeholder="Deadline"
                    format="dd/MM"
                    :picker-options="timePickerOptions"
                    class="deadline-date" />
                </el-col>
                <el-col>
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

      <el-col :span="19">
        <el-card>
          <div v-if="scheduleError">
            <el-alert
              type="error"
              title=""
              :description="scheduleError"
              show-icon
              :closable="false"
              />

            <el-table :data="tasks()"
              key="taskList">
              <el-table-column>
                <template scope="scope">{{ scope.row.content }}</template>
              </el-table-column>
              <el-table-column label="Deadline"
                align="center"
                width="140px">
                <template scope="scope">{{ formatDatetime(scope.row.deadline) }}</template>
              </el-table-column>
              <el-table-column label="Duration"
                align="center"
                width="100px">
                <template scope="scope">{{ formatDuration(scope.row.duration_minutes) }}</template>
              </el-table-column>
              <el-table-column label="Importance"
                align="center"
                width="120px">
                <template scope="scope">{{ scope.row.importance }}</template>
              </el-table-column>
              <el-table-column
                align="center"
                width="66px">
                <template scope="scope">
                  <el-button @click="remove(scope.row.id)"
                    type="danger"
                    :plain="true"
                    icon="delete"
                    size="mini"
                    />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else>
            <el-table :data="schedule"
              key="schedule"
              v-loading="loading"
              element-loading-text="Forging your schedule...">
              <el-table-column label="Schedule"
                align="center"
                width="140px">
                <template scope="scope">{{ formatDatetime(scope.row.when) }}</template>
              </el-table-column>
              <el-table-column>
                <template scope="scope">{{ scope.row.task.content }}</template>
              </el-table-column>
              <el-table-column label="Deadline"
                align="center"
                width="140px">
                <template scope="scope">{{ formatDatetime(scope.row.task.deadline) }}</template>
              </el-table-column>
              <el-table-column label="Duration"
                align="center"
                width="100px">
                <template scope="scope">{{ formatDuration(scope.row.task.duration_minutes) }}</template>
              </el-table-column>
              <el-table-column label="Importance"
                align="center"
                width="120px">
                <template scope="scope">{{ scope.row.task.importance }}</template>
              </el-table-column>
              <el-table-column
                align="center"
                width="66px">
                <template scope="scope">
                  <el-button @click="remove(scope.row.task.id)"
                    type="danger"
                    :plain="true"
                    icon="delete"
                    size="mini"
                    />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
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
      {minutes: 60, stringified: "1 hour"},
      {minutes: 120, stringified: "2 hours"},
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
      schedule: [],
      loading: true,
      scheduleError: '',
    }
  },
  created() {
    this.reschedule();
  },
  methods: {
    addTask(event) {
      // TODO replace this poor man's validation
      assert(this.content, 'No task given');
      assert(this.deadlineDate || this.deadlineTime, 'No deadline given');
      assert(this.durationMinutes, 'No duration given');

      let deadline = this.deadlineDate || today();
      let deadlineTime = (this.deadlineTime || '23:59')
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
        this.$message.error(result.error);
      } else {
        this.$message.success("Task added!");
        this.content = '';
        this.deadlineDate = '';
        this.deadlineTime = '';
        this.durationMinutes = '';
        this.importance = 5;
      }

      this.reschedule();
    },

    formatImportance(importance) {
      return "Importance: " + importance;
    },

    formatDatetime(datetime) {
      let date = stripTime(datetime);
      let dateStr;
      if (date.getTime() === today().getTime()) {
        dateStr = "";
      } else if (date.getTime() === addDays(today(), 1).getTime()) {
        dateStr = "Tomorrow";
      } else {
        dateStr = date.getDate() + "/" + date.getMonth();
      }

      let timeStr = datetime.getHours() + ":"
                    + datetime.getMinutes().toString().padStart(2, "0");
      if (timeStr == "23:59") {
        timeStr = "";
      }

      let datetimeStr = [dateStr, timeStr].join(" ").trim();
      if (datetimeStr == "") {
        datetimeStr = "Today";
      }
      return datetimeStr;
    },

    formatDuration(durationMinutes) {
      let hours = Math.floor(durationMinutes / 60);
      let minutes = durationMinutes % 60;
      if (hours > 0) {
        return hours + "h" + (minutes == 0 ? "" : minutes);
      } else {
        return minutes + "m";
      }
    },

    remove(id) {
      let result = this.api.removeTask(id);
      if (result != null) {
        this.$message.error(result.error);
      } else {
        this.$message.success("Task removed!");
      }
      this.reschedule();
    },

    reschedule(event) {
      let result = this.api.schedule();
      console.assert(result != null, "Reschedule returned null");
      if (result.error == null) {
        this.scheduleError = '';
        this.schedule = result;
        this.loading = false;
      } else {
        this.scheduleError = result.error;
      }
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

.add-task-form
  .duration, .deadline-date, .deadline-time
    width: 100% !important

  .deadline
    flex-wrap: wrap
  .deadline > *
    flex: 0 0 50%
    @media (max-width: 1100px)
      flex: 0 0 100%

.el-alert
  margin-bottom: 20px
  .el-alert__content
    padding-left: 16px
  .el-alert__description
    margin: 5px 0

.el-table
  .cell
    padding: 6px 18px
</style>
