<script setup lang="ts">
defineProps({
  placeholder: {
    default: "",
  },
  required: {
    default: false,
  },
  modelValue: {
    defualt: "",
  },
  type: {
    default: "text",
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    ref="apple"
    @input="$emit('update:modelValue', $event.target.value)"
    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
    :placeholder="placeholder"
    :required="required"
  />
</template>
