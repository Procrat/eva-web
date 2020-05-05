<template>
  <el-input
    v-if="focused"
    v-focus
    :value="value"
    class="editable-content"
    type="textarea"
    placeholder="What do you want to do?"
    autosize
    @input="$emit('input', $event)"
    @change="$emit('change', $event)"
    @blur="focused = false"
  />
  <pre
    v-else
    class="fixed-content"
    tabindex="0"
    @click="focused = true"
    @focus="focused = true"
  >{{ value }}</pre>
</template>

<script>
export default {
  name: 'ScheduleEditableText',

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      focused: false,
    };
  },
};
</script>

<style lang="sass" scoped>
.fixed-content
  margin: 0
  border: 1px solid transparent
  border-radius: 4px
  padding: 5px 15px
  cursor: text
  font-family: inherit
  line-height: 1.5  // Make it consistent with el-textarea
  &:hover
    border-color: #DCDFE6
</style>
