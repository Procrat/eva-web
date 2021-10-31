<template>
  <label
    class="el-radio"
    :class="{
      'is-focus': focus,
      'is-checked': isSelected,
      'is-disabled': disabled,
    }"
    :style="{
      '--color': color != null ? color.string() : undefined,
    }"
    @keydown.space.stop.prevent="select"
  >
    <span
      class="el-radio__input"
      :class="{
        'is-checked': isSelected,
        'is-disabled': disabled,
      }"
    >
      <span class="el-radio__inner" />
      <input
        :value="label"
        type="radio"
        :name="groupName"
        :disabled="disabled"
        class="el-radio__original"
        @focus="focus = true"
        @blur="focus = false"
        @input="select"
      >
    </span>
    <span
      class="el-radio__label"
      @keydown.stop
    >
      <slot />
      <template v-if="!$slots.default">{{ label }}</template>
    </span>
  </label>
</template>

<script>
/**
 * A generic radio button component, based on Element's, but with the added benefits of
 *   - being able to use it with a v-model that isn't a string or number, but any object, and
     - being able to set its color (and that of any contained input field).
 */

import Color from 'color';

export default {
  name: 'ColoredRadio',

  model: {
    prop: 'selectedValue',
    event: 'input',
  },

  props: {
    value: { type: null, required: true },
    label: { type: String, required: true },
    selectedLabel: { type: String, default: null },
    selectedValue: { type: null, default: null },
    groupName: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    color: { type: Color, default: undefined },
  },

  data() {
    return {
      focus: false,
    };
  },

  computed: {
    isSelected() {
      return this.selectedLabel === this.label;
    },
  },

  methods: {
    select() {
      if (!this.disabled) {
        this.$emit('update:selectedLabel', this.label);
        this.$emit('input', this.value);
      }
    },
  },
};
</script>

<style scoped lang="sass">
@import "element-ui/packages/theme-chalk/src/mixins/mixins.scss"

@include b(radio)
  @include e(input)
    @include when(checked)
      .el-radio__inner
        border-color: var(--color)
        background: var(--color)

  @include e(inner)
    border-color: var(--color)
    &:focus, &:hover
      border-color: var(--color)
      box-shadow: 0 0 2px var(--color)
</style>

<style lang="sass">
@import "element-ui/packages/theme-chalk/src/mixins/mixins.scss"

/* Unscoped styling for when the slot contains an input field */
@include b(radio)
  .el-input__inner
    border-color: var(--color)
    &:focus, &:hover
      border-color: var(--color)
      box-shadow: 0 0 2px var(--color)
</style>
