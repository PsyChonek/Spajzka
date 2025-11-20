<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageWrapper from '@/components/PageWrapper.vue'

const router = useRouter()

const features = [
  {
    icon: 'inventory_2',
    title: 'Pantry',
    description: 'Manage your pantry inventory with quantities, prices, and more',
    route: '/pantry',
    color: 'primary'
  },
  {
    icon: 'shopping_cart',
    title: 'Shopping',
    description: 'Keep track of items you need to buy with a simple checklist',
    route: '/shopping',
    color: 'secondary'
  },
  {
    icon: 'restaurant_menu',
    title: 'Recipes',
    description: 'Create and manage your personal and group recipes with ingredients and instructions',
    route: '/recipes',
    color: 'accent'
  }
]

const navigateTo = (route: string) => {
  router.push(route)
}
</script>

<template>
  <PageWrapper max-width="1200px" min-height="80vh">
    <div class="home">
      <div class="hero-section">
        <div class="hero-icon q-mb-lg">
          <img src="/favicon.svg" alt="Spajzka Logo" class="logo vue q-ml-sm" width="256" height="256" />
        </div>
        <h1 class="text-h2 text-weight-bold q-mb-md">Welcome to Spajzka</h1>
        <p class="text-h5 text-grey-7 q-mb-xl">Your personal pantry and shopping list manager</p>
      </div>

      <div class="features-section">
        <div class="row q-col-gutter-lg justify-center">
          <div
            v-for="feature in features"
            :key="feature.route"
            class="col-12 col-sm-6 col-md-5"
          >
            <q-card
              class="feature-card cursor-pointer"
              @click="navigateTo(feature.route)"
            >
              <q-card-section class="text-center">
                <q-icon
                  :name="feature.icon"
                  size="64px"
                  :color="feature.color"
                  class="q-mb-md"
                />
                <div class="text-h5 q-mb-sm">{{ feature.title }}</div>
                <div class="text-body1 text-grey-7">{{ feature.description }}</div>
              </q-card-section>
              <q-card-actions align="center">
                <q-btn
                  flat
                  :color="feature.color"
                  label="Open"
                  icon-right="arrow_forward"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>

      <div class="info-section q-mt-xl">
        <q-banner class="bg-grey-2" rounded>
          <template v-slot:avatar>
            <q-icon name="info" color="primary" size="md" />
          </template>
          <div class="text-body1">
            <strong>Getting Started</strong><br />
            Click on any card above to start managing your pantry list or shopping list.
          </div>
        </q-banner>
      </div>
    </div>
  </PageWrapper>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
}

.hero-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.features-section {
  flex: 1;
  padding: 2rem 0;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.info-section {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #FFCC41AA);
}
</style>
