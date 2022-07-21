<script setup>
import { Delete as DeleteIcon } from '@element-plus/icons-vue';

import * as DateTime from '@/datetime';
import ScheduleEditableText from '@/components/ScheduleEditableText.vue';
</script>

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
          <template #default="{ row }">
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
          <template #default="{ row }">
            {{ DateTime.formatDatetime(row.deadline) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Duration"
          align="center"
          width="100px"
        >
          <template #default="{ row }">
            {{ DateTime.formatDuration(row.duration) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Importance"
          align="center"
          width="120px"
        >
          <template #default="{ row }">
            {{ row.importance }}
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          width="66px"
        >
          <template #default="{ row }">
            <el-button
              plain
              size="small"
              :icon="DeleteIcon"
              type="danger"
              @click="remove(row.id)"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template v-else>
      <el-table
        v-loading="loading"
        :data="schedule"
        element-loading-text="Thinking really hard about your schedule..."
      >
        <template #empty>
          Add your first task and world domination will soon be yours!¹
          <br><br>
          <span style="font-size: 10px">
            ¹ There is no proven correlation between using Eva and
            achieving world domination.
          </span>
        </template>

        <el-table-column
          label="Schedule"
          align="center"
          width="140px"
        >
          <template #default="{ row }">
            {{ DateTime.formatDatetime(row.when) }}
          </template>
        </el-table-column>

        <el-table-column>
          <template #default="{ row }">
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
          <template #default="{ row }">
            {{ DateTime.formatDatetime(row.task.deadline) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Duration"
          align="center"
          width="100px"
        >
          <template #default="{ row }">
            {{ DateTime.formatDuration(row.task.duration) }}
          </template>
        </el-table-column>

        <el-table-column
          label="Importance"
          align="center"
          width="120px"
        >
          <template #default="{ row }">
            {{ row.task.importance }}
          </template>
        </el-table-column>

        <el-table-column
          align="center"
          width="66px"
        >
          <template #default="{ row }">
            <el-button
              plain
              type="danger"
              :icon="DeleteIcon"
              size="small"
              @click="remove(row.task.id)"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-card>
</template>

<script>
import bus from '@/bus';

import ErrorHandling from '@/mixins/ErrorHandling';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Schedule',

  mixins: [ErrorHandling],

  data() {
    return {
      schedule: [],
      loading: true,
      scheduleError: '',
      tasks: [],
    };
  },

  created() {
    bus.$on('task-added', this.reschedule);
    bus.$on('task-removed', this.reschedule);
    bus.$on('task-updated', this.reschedule);

    this.reschedule();
  },

  methods: {
    async remove(id) {
      try {
        await this.$api.removeTask(id);
        this.$message.success('Task removed!');
        bus.$emit('task-removed');
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
        bus.$emit('task-updated');
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
</style>
