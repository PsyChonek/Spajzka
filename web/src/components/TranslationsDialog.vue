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
    <div class="sp-translations-grid">
      <div class="sp-translations-grid__header">
        <div></div>
        <div v-for="loc in SUPPORTED_LOCALES" :key="loc" class="text-weight-medium">
          {{ localeLabels[loc] }}
        </div>
      </div>
      <div
        v-for="field in fields"
        :key="field.key"
        class="sp-translations-grid__row"
      >
        <div class="sp-translations-grid__label">{{ field.label }}</div>
        <template v-for="loc in SUPPORTED_LOCALES" :key="`${field.key}-${loc}`">
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
        </template>
      </div>
    </div>

    <template #footer>
      <q-btn flat no-caps :label="t('common.cancel')" color="grey-8" @click="handleCancel" />
      <q-btn unelevated no-caps :label="t('common.save')" color="primary" data-testid="translations-save" @click="handleSave" />
    </template>
  </BaseDialog>
</template>

<style scoped>
.sp-translations-grid {
  display: grid;
  gap: 0.75rem;
}
.sp-translations-grid__header,
.sp-translations-grid__row {
  display: grid;
  grid-template-columns: 110px 1fr 1fr;
  gap: 0.75rem;
  align-items: center;
}
.sp-translations-grid__label {
  font-weight: 500;
  color: var(--sp-text-muted, #666);
}
</style>
