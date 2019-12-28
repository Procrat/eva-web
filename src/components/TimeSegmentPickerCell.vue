<template>
  <td
    :class="{
      occupied: name != null,
      selected: selected,
      'dark-background': backgroundColor != null && backgroundColor.isDark(),
    }"
    :style="{ backgroundColor: backgroundColor && backgroundColor.string() }"
    @mousedown="$emit('mousedown', $props, $event)"
    @mouseover="$emit('mouseover', $props)"
    @mouseup="$emit('mouseup', $props)"
  >
    {{ name }}
  </td>
</template>


<script>
import Color from 'color';

import { Day, Time } from '@/datetime';

export default {
  props: {
    day: { type: Day, required: true },
    time: { type: Time, required: true },
    name: { type: String, default: undefined },
    color: { type: Color, default: undefined },
    selected: { type: Boolean, default: false },
  },

  computed: {
    backgroundColor() {
      if (this.color == null) {
        return undefined;
      }
      return this.selected ? this.color.darken(0.2) : this.color;
    },
  },
};
</script>


<style scoped lang="sass">
@import '@/assets/colors.sass'

td
  font-size: smaller
  text-align: center
  overflow: hidden
  white-space: nowrap
  text-overflow: ellipsis
  padding: 12px

  &.dark-background
    color: $inverted-foreground-color

  table.selectable &.selected,
  table.selectable &:not(.occupied)
    cursor: pointer
</style>
