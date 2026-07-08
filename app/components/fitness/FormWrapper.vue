<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { AnimatePresence, Motion } from 'motion-v'

defineProps<{ title: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <ClientOnly>
      <DialogPortal>
        <AnimatePresence multiple>
          <DialogOverlay
            as-child
            class="bg-transparent backdrop-blur-md backdrop-brightness-80 w-screen h-screen fixed inset-0 z-5"
          >
            <Motion
              :initial="{ opacity: 0.8 }"
              :animate="{ opacity: 1 }"
              :exit="{ opacity: 0, scale: 1.6 }"
            />
          </DialogOverlay>

          <DialogContent
            as-child
            class="fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 card dark:text-gray-100 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-10"
          >
            <Motion
              :initial="{ opacity: 0, top: '30%' }"
              :animate="{ opacity: 1, top: '50%' }"
              :exit="{ opacity: 0, top: '30%' }"
            >
              <DialogTitle
                class="font-semibold font-head text-lg mb-5 leading-normal dark:text-gray-100"
              >
                {{ title }}
              </DialogTitle>

              <slot />

              <DialogClose
                class="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                aria-label="Close"
                as-child
              >
                <!-- <button type="button" class="i-mdi:close" /> -->
              </DialogClose>
            </Motion>
          </DialogContent>
        </AnimatePresence>
      </DialogPortal>
      <template #fallback />
    </ClientOnly>
  </DialogRoot>
</template>
