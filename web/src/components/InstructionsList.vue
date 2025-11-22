<script setup lang="ts">
interface Props {
  instructions: string[]
  checkedInstructions?: Set<number>
  currentStep?: number
  showCheckboxes?: boolean
  showNavigation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCheckboxes: false,
  showNavigation: false,
  currentStep: 0
})

const emit = defineEmits<{
  toggleInstruction: [index: number]
  setCurrentStep: [index: number]
  nextStep: []
  previousStep: []
}>()

const handleToggle = (index: number) => {
  emit('toggleInstruction', index)
}

const handleSetCurrentStep = (index: number) => {
  emit('setCurrentStep', index)
}

const getInstructionOpacity = (index: number) => {
  if (!props.showNavigation) return 1
  return index === props.currentStep ? 1 : 0.4
}

const isCurrentStep = (index: number) => {
  return props.showNavigation && index === props.currentStep
}
</script>

<template>
  <div class="instructions-section">
    <div class="section-title text-h6 q-mb-md">Instructions</div>

    <!-- Step Navigation -->
    <div v-if="showNavigation" class="step-navigation q-mb-md">
      <q-btn
        flat
        round
        dense
        icon="chevron_left"
        @click="emit('previousStep')"
        :disable="currentStep === 0"
      />
      <div class="step-indicator">
        Step {{ currentStep + 1 }} of {{ instructions.length }}
      </div>
      <q-btn
        flat
        round
        dense
        icon="chevron_right"
        @click="emit('nextStep')"
        :disable="currentStep === instructions.length - 1"
      />
    </div>

    <!-- Instructions List -->
    <div class="instructions-list">
      <q-card
        v-for="(instruction, index) in instructions"
        :key="index"
        class="instruction-card q-mb-md"
        :class="{ 'current-step': isCurrentStep(index) }"
        :style="{ opacity: getInstructionOpacity(index) }"
        @click="showNavigation ? handleSetCurrentStep(index) : null"
      >
        <q-card-section class="row items-start">
          <div class="step-number q-mr-md">{{ index + 1 }}</div>
          <div class="col">
            <div class="instruction-text">{{ instruction }}</div>
          </div>
          <q-checkbox
            v-if="showCheckboxes"
            :model-value="checkedInstructions?.has(index)"
            @update:model-value="handleToggle(index)"
            color="primary"
            @click.stop
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-weight: 600;
  color: var(--q-primary);
}

.instructions-section {
  animation: fadeIn 0.3s ease 0.1s backwards;
}

.step-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.step-indicator {
  font-weight: 600;
  font-size: 1.1rem;
}

.instructions-list {
  width: 100%;
}

.instruction-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.instruction-card.current-step {
  border-left-color: var(--q-primary);
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.instruction-card:hover {
  transform: translateX(4px);
}

.step-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--q-primary);
  min-width: 40px;
  text-align: center;
}

.instruction-text {
  font-size: 1.1rem;
  line-height: 1.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive */
@media (max-width: 599px) {
  .step-number {
    font-size: 1.2rem;
    min-width: 30px;
  }

  .instruction-text {
    font-size: 1rem;
  }
}
</style>
