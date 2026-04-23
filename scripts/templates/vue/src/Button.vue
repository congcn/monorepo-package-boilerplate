<template>
  <button class="__PACKAGE_NAME__-btn">{{ label }}</button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
})
</script>
