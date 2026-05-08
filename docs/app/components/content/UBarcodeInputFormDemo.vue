<script setup lang="ts">
import { reactive, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  productCode: z
    .string()
    .min(1, 'Required.')
    .regex(/^\d{8,13}$/, 'Must be 8–13 digits (EAN/UPC).'),
})

type Schema = z.output<typeof schema>

const state = reactive({ productCode: '' })
const submitted = ref<Schema | null>(null)

function onSubmit(event: FormSubmitEvent<Schema>) {
  submitted.value = event.data
}

function onReset() {
  state.productCode = ''
  submitted.value = null
}
</script>

<template>
  <ClientOnly>
    <UForm :schema="schema" :state="state" class="flex flex-col gap-4" @submit="onSubmit">
      <UFormField
        label="Product code"
        name="productCode"
        help="EAN-8, EAN-13, or UPC-A — type one or tap the icon to scan."
        required
      >
        <UBarcodeInput
          v-model="state.productCode"
          placeholder="e.g. 5901234123457"
          class="w-full"
        />
      </UFormField>

      <div class="flex gap-2">
        <UButton type="submit">Submit</UButton>
        <UButton type="reset" variant="ghost" color="neutral" @click="onReset"> Reset </UButton>
      </div>

      <UAlert
        v-if="submitted"
        color="success"
        variant="soft"
        icon="i-lucide-check"
        :title="`Submitted: ${submitted.productCode}`"
      />
    </UForm>
  </ClientOnly>
</template>
