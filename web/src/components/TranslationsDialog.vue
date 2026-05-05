<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from './BaseDialog.vue'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/services/i18n'

export type TranslationsValue = Partial<Record<SupportedLocale, Partial<Record<string, string | string[]>>>>

export type FieldKind = 'text' | 'textarea' | 'list'

export interface TranslatableField {
  key: string
  label: string
  kind?: FieldKind
  placeholder?: string
}

interface Props {
  modelValue: boolean
  title?: string
  fields: TranslatableField[]
  translations: TranslationsValue
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: TranslationsValue): void
  (e: 'cancel'): void
}>()

const { t } = useI18n({ useScope: 'global' })

const localeLabels: Record<SupportedLocale, string> = {
  en: 'English',
  cs: 'Čeština'
}

const draft = ref<TranslationsValue>({})

const dialogTitle = computed(() => props.title ?? t('common.translations'))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      // Deep-clone so editing doesn't mutate the parent state until Save.
      const next: TranslationsValue = {}
      for (const loc of SUPPORTED_LOCALES) {
        next[loc] = {}
        for (const f of props.fields) {
          const v = props.translations?.[loc]?.[f.key]
          if (Array.isArray(v)) next[loc]![f.key] = [...v]
          else if (typeof v === 'string') next[loc]![f.key] = v
        }
      }
      draft.value = next
    }
  },
  { immediate: true }
)

function readField(locale: SupportedLocale, field: TranslatableField): string {
  const raw = draft.value[locale]?.[field.key]
  if (Array.isArray(raw)) return raw.join(', ')
  if (typeof raw === 'string') return raw
  return ''
}

function writeField(locale: SupportedLocale, field: TranslatableField, value: string) {
  if (!draft.value[locale]) draft.value[locale] = {}
  if (field.kind === 'list') {
    draft.value[locale]![field.key] = value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  } else {
    draft.value[locale]![field.key] = value
  }
}

function handleSave() {
  emit('save', draft.value)
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseDialog
    :model-value="modelValue"
    :title="dialogTitle"
    size="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="sp-translations">
      <section
        v-for="field in fields"
        :key="field.key"
        class="sp-translations__field"
      >
        <h3 class="sp-translations__field-label">{{ field.label }}</h3>
        <div
          v-for="loc in SUPPORTED_LOCALES"
          :key="`${field.key}-${loc}`"
          class="sp-translations__locale"
        >
          <div class="sp-translations__locale-name">{{ localeLabels[loc] }}</div>
          <q-input
            v-if="field.kind === 'textarea'"
            outlined
            type="textarea"
            autogrow
            :placeholder="field.placeholder ?? ''"
            :model-value="readField(loc, field)"
            :data-testid="`translation-${field.key}-${loc}`"
            @update:model-value="(v: any) => writeField(loc, field, String(v ?? ''))"
          />
          <q-input
            v-else
            outlined
            dense
            :placeholder="field.placeholder ?? ''"
            :model-value="readField(loc, field)"
            :data-testid="`translation-${field.key}-${loc}`"
            @update:model-value="(v: any) => writeField(loc, field, String(v ?? ''))"
          />
        </div>
      </section>
    </div>

    <template #footer>
      <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="handleCancel" />
      <q-btn unelevated no-caps :label="t('common.save')" color="primary" data-testid="translations-save" @click="handleSave" />
    </template>
  </BaseDialog>
</template>

<style scoped>
.sp-translations {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.sp-translations__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sp-translations__field-label {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--sp-text);
  margin: 0;
}
.sp-translations__locale {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sp-translations__locale-name {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--sp-text-muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
