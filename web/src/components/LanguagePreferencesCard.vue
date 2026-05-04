<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { type SupportedLocale } from '@/services/i18n'
import SectionCard from '@/components/common/SectionCard.vue'

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const languageOptions = [
  { label: 'English', value: 'en' satisfies SupportedLocale },
  { label: 'Čeština', value: 'cs' satisfies SupportedLocale }
]

const onInterfaceLanguageChange = (val: SupportedLocale) =>
  authStore.setLanguage('interface', val)

const onItemsLanguageChange = (val: SupportedLocale) =>
  authStore.setLanguage('items', val)
</script>

<template>
  <SectionCard :title="t('profile.preferences')">
    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label>{{ t('profile.interfaceLanguage') }}</q-item-label>
          <q-item-label caption class="sp-text-muted">{{ t('profile.interfaceLanguageHint') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-select
            outlined
            dense
            emit-value
            map-options
            style="min-width: 140px"
            :model-value="authStore.user?.interfaceLanguage ?? 'cs'"
            :options="languageOptions"
            data-testid="interface-language-select"
            @update:model-value="onInterfaceLanguageChange"
          />
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>{{ t('profile.itemsLanguage') }}</q-item-label>
          <q-item-label caption class="sp-text-muted">{{ t('profile.itemsLanguageHint') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-select
            outlined
            dense
            emit-value
            map-options
            style="min-width: 140px"
            :model-value="authStore.user?.itemsLanguage ?? 'cs'"
            :options="languageOptions"
            data-testid="items-language-select"
            @update:model-value="onItemsLanguageChange"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </SectionCard>
</template>
