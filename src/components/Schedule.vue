<template>
  <el-card>
    <template v-if="scheduleError">
      <el-alert
        :title="scheduleError"
        :closable="false"
        type="error"
        show-icon
        class="alert"
      />

      <el-table :data="tasks">
        <el-table-column>
          <template slot-scope="{ row }">
            <schedule-editable-text
              v-model="row.content"
              @change="updateTask(row)"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Deadline"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.deadline | formatDatetime }}
          </template>
        </el-table-column>

        <el-table-column
          label="Duration"
          align="center"
          width="100px"
        >
          <template slot-scope="{ row }">
            {{ row.duration | formatDuration }}
          </template>
        </el-table-column>

        <el-table-column
          label="Importance"
          align="center"
          width="120px"
        >
          <template slot-scope="{ row }">
            {{ row.importance }}
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          width="66px"
        >
          <template slot-scope="{ row }">
            <el-button
              plain
              size="mini"
              icon="el-icon-delete"
              type="danger"
              @click="remove(row.id)"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template
      v-else
      class="schedule"
    >
      <el-table
        v-loading="loading"
        :data="schedule"
        element-loading-text="Thinking really hard about your schedule..."
      >
        <div slot="empty">
          Add your first task and world domination will soon be yours!¹
          <br><br>
          <span style="font-size: 10px">
            ¹ There is no proven correlation between using Eva and
            achieving world domination.
          </span>
        </div>

        <el-table-column
          label="Schedule"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.when | formatDatetime }}
          </template>
        </el-table-column>

        <el-table-column>
          <template slot-scope="{ row }">
            <schedule-editable-text
              v-model="row.task.content"
              @change="updateTask(row.task)"
            />
          </template>
        </el-table-column>

        <el-table-column
          label="Deadline"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.task.deadline | formatDatetime }}
          </template>
        </el-table-column>

        <el-table-column
          label="Duration"
          align="center"
          width="100px"
        >
          <template slot-scope="{ row }">
            {{ row.task.duration | formatDuration }}
          </template>
        </el-table-column>

        <el-table-column
          label="Importance"
          align="center"
          width="120px"
        >
          <template slot-scope="{ row }">
            {{ row.task.importance }}
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          width="66px"
        >
          <template slot-scope="{ row }">
            <el-button
              plain
              type="danger"
              icon="el-icon-delete"
              size="mini"
              @click="remove(row.task.id)"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-card>
</template>


<script>
import * as DateTime from '@/datetime';

import ErrorHandling from '@/mixins/ErrorHandling';
import ScheduleEditableText from '@/components/ScheduleEditableText.vue';


export default {
  name: 'Schedule',

  components: {
    ScheduleEditableText,
  },

  filters: {
    formatDatetime: DateTime.formatDatetime,
    formatDuration: DateTime.formatDuration,
  },

  mixins: [ErrorHandling],

  props: {
    bus: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      schedule: [],
      loading: true,
      scheduleError: '',
      tasks: [],
    };
  },

  created() {
    this.bus
      .$on('task-added', this.reschedule)
      .$on('task-removed', this.reschedule)
      .$on('task-updated', this.reschedule);

    this.reschedule();
  },

  methods: {
    async remove(id) {
      try {
        await this.$api.removeTask(id);
        this.$message.success('Task removed!');
        this.bus.$emit('task-removed');
      } catch (error) {
        this.handleError(error);
      }
    },

    async reschedule() {
      try {
        this.schedule = await this.$api.schedule();
        this.scheduleError = '';
        this.loading = false;
      } catch (error) {
        if (typeof error === 'string') {
          this.scheduleError = error.toString();
          try {
            this.tasks = await this.$api.listTasks();
          } catch (listError) {
            this.handleError(listError);
          }
        } else {
          this.handleError(error);
        }
      }
    },

    async updateTask(task) {
      try {
        await this.$api.updateTask(task);
        this.$message.success('Task updated!');
        this.bus.$emit('task-updated');
      } catch (error) {
        this.handleError(error);
      }
    },
  },
};
</script>


<style lang="sass" scoped>
.alert.el-alert
  margin-bottom: 20px

.schedule
  .el-table
    .cell
      padding: 6px 18px
    .el-table__empty-block
      min-height: 225px
</style>
