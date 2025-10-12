<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const showDialog = ref(false)
const showDrawer = ref(false)
const progressValue = ref(50)
const isLoading = ref(false)

// Add reactive data properties
const text = ref('')
const email = ref('')
const password = ref('')
const search = ref('')
const message = ref('')
const quantity = ref(1)
const color = ref(null)
const country = ref(null)
const skills = ref([])
const accept = ref(false)
const subscribe = ref(true)
const plan = ref('free')
const notifications = ref(false)
const darkMode = ref(true)

const colorOptions = ['Red', 'Green', 'Blue', 'Yellow', 'Purple']
const countryOptions = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany']
const skillOptions = ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Angular']
const planOptions = [
  { label: 'Free - $0/month', value: 'free' },
  { label: 'Basic - $9/month', value: 'basic' },
  { label: 'Pro - $29/month', value: 'pro' },
  { label: 'Enterprise - Contact us', value: 'enterprise' }
]

const handleLoadingDemo = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}

// Toast/Notification handlers
const showToast = (type: string) => {
  const messages: Record<string, any> = {
    info: { message: 'This is an info message', color: 'primary', icon: 'info' },
    success: { message: 'Success! Operation completed', color: 'positive', icon: 'check_circle' },
    warning: { message: 'Warning: Please review', color: 'warning', icon: 'warning' },
    error: { message: 'Error: Something went wrong', color: 'negative', icon: 'error' }
  }
  
  const config = messages[type]
  if (config) {
    $q.notify({
      message: config.message,
      color: config.color,
      icon: config.icon,
      position: 'top',
      timeout: 2000
    })
  }
}

// Table data and configuration
const tableFilter = ref('')
const tableColumns = [
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' as const },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' as const },
  { name: 'role', label: 'Role', field: 'role', sortable: true, align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', sortable: true, align: 'center' as const },
  { name: 'joinDate', label: 'Join Date', field: 'joinDate', sortable: true, align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', sortable: false, align: 'center' as const }
]

const tableRows = ref([
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active', joinDate: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Developer', status: 'Active', joinDate: '2024-02-20' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Designer', status: 'Inactive', joinDate: '2024-03-10' },
  { id: 4, name: 'Alice Williams', email: 'alice.williams@example.com', role: 'Manager', status: 'Active', joinDate: '2024-01-05' },
  { id: 5, name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Developer', status: 'Active', joinDate: '2024-04-12' },
  { id: 6, name: 'Diana Prince', email: 'diana.prince@example.com', role: 'Designer', status: 'Active', joinDate: '2024-02-28' },
  { id: 7, name: 'Edward Norton', email: 'edward.norton@example.com', role: 'Developer', status: 'Inactive', joinDate: '2024-03-15' },
  { id: 8, name: 'Fiona Apple', email: 'fiona.apple@example.com', role: 'Admin', status: 'Active', joinDate: '2024-01-20' },
  { id: 9, name: 'George Martin', email: 'george.martin@example.com', role: 'Manager', status: 'Active', joinDate: '2024-05-01' },
  { id: 10, name: 'Helen Mirren', email: 'helen.mirren@example.com', role: 'Designer', status: 'Active', joinDate: '2024-04-18' }
])

const tablePagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 5
})

const handleEditRow = (row: any) => {
  $q.notify({
    message: `Editing ${row.name}`,
    color: 'primary',
    icon: 'edit',
    position: 'top',
    timeout: 1500
  })
}

const handleDeleteRow = (row: any) => {
  $q.notify({
    message: `Deleting ${row.name}`,
    color: 'negative',
    icon: 'delete',
    position: 'top',
    timeout: 1500
  })
}
</script>

<template>
  <div class="examples-page q-pa-md">
    <header class="page-header q-mb-lg">
      <h1 class="text-h3">Quasar Components Examples</h1>
      <p class="text-subtitle1">Interactive showcase of Quasar component library</p>
    </header>

    <!-- Buttons Section -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Buttons</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Button Colors</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-btn color="grey">Neutral</q-btn>
            <q-btn color="primary">Primary</q-btn>
            <q-btn color="positive">Success</q-btn>
            <q-btn color="warning">Warning</q-btn>
            <q-btn color="negative">Danger</q-btn>
          </div>

          <h3 class="text-h6">Button Sizes</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-btn size="sm" color="primary">Small</q-btn>
            <q-btn size="md" color="primary">Medium</q-btn>
            <q-btn size="lg" color="primary">Large</q-btn>
          </div>

          <h3 class="text-h6">Outline Buttons</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-btn outline color="primary">Primary Outline</q-btn>
            <q-btn outline color="positive">Success Outline</q-btn>
            <q-btn outline color="negative">Danger Outline</q-btn>
          </div>

          <h3 class="text-h6">Button States</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-btn disable color="primary">Disabled</q-btn>
            <q-btn :loading="isLoading" @click="handleLoadingDemo" color="primary">
              {{ isLoading ? 'Loading...' : 'Click to Load' }}
            </q-btn>
            <q-btn round color="primary">R</q-btn>
            <q-btn fab color="primary" icon="favorite" />
          </div>

          <h3 class="text-h6">Buttons with Icons</h3>
          <div class="q-gutter-sm">
            <q-btn color="primary" icon="download" label="Download" />
            <q-btn color="positive" icon-right="upload" label="Upload" />
            <q-btn color="negative" icon="delete" label="Delete" />
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Inputs Section -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Input Fields</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Text Inputs</h3>
          <div class="q-gutter-md">
            <q-input v-model="text" label="Name" hint="Your full name" />
            <q-input v-model="email" type="email" label="Email">
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input>
            <q-input v-model="password" type="password" label="Password">
              <template v-slot:append>
                <q-icon name="visibility_off" />
              </template>
            </q-input>
            <q-input v-model="search" label="Search">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-input model-value="This is disabled" disable label="Disabled" />
          </div>

          <h3 class="text-h6 q-mt-md">Textarea</h3>
          <q-input v-model="message" type="textarea" label="Message" hint="Maximum 500 characters" />

          <h3 class="text-h6 q-mt-md">Number Input</h3>
          <q-input v-model.number="quantity" type="number" label="Quantity" />
        </q-card-section>
      </q-card>
    </section>

    <!-- Select Section -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Select / Dropdown</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Single Select</h3>
          <div class="q-gutter-md">
            <q-select v-model="color" :options="colorOptions" label="Choose a color" />
            <q-select v-model="country" :options="countryOptions" label="Choose a country" />
          </div>

          <h3 class="text-h6 q-mt-md">Multiple Select</h3>
          <q-select v-model="skills" :options="skillOptions" label="Choose skills" multiple clearable />
        </q-card-section>
      </q-card>
    </section>

    <!-- Checkboxes and Radio Buttons -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Checkboxes & Radio Buttons</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Checkboxes</h3>
          <div class="q-gutter-sm">
            <q-checkbox v-model="accept" label="Accept terms and conditions" />
            <q-checkbox v-model="subscribe" label="Subscribe to newsletter" />
            <q-checkbox :model-value="false" disable label="Disabled option" />
          </div>

          <q-separator class="q-my-md" />

          <h3 class="text-h6">Radio Buttons</h3>
          <q-option-group v-model="plan" :options="planOptions" label="Choose a plan" />

          <q-separator class="q-my-md" />

          <h3 class="text-h6">Toggles</h3>
          <div class="q-gutter-sm">
            <q-toggle v-model="notifications" label="Enable notifications" />
            <q-toggle v-model="darkMode" label="Dark mode" />
            <q-toggle :model-value="false" disable label="Disabled toggle" />
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Chips/Tags Section -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Chips & Tags</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Chips</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-chip color="primary">Primary</q-chip>
            <q-chip color="positive">Success</q-chip>
            <q-chip color="grey">Neutral</q-chip>
            <q-chip color="warning">Warning</q-chip>
            <q-chip color="negative">Danger</q-chip>
          </div>

          <h3 class="text-h6">Removable Chips</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-chip removable color="primary">JavaScript</q-chip>
            <q-chip removable color="positive">TypeScript</q-chip>
            <q-chip removable color="grey">Vue.js</q-chip>
            <q-chip removable color="warning">React</q-chip>
          </div>

          <h3 class="text-h6">Chip Sizes</h3>
          <div class="q-gutter-sm">
            <q-chip size="sm">Small</q-chip>
            <q-chip size="md">Medium</q-chip>
            <q-chip size="lg">Large</q-chip>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Progress & Loading -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Progress & Loading</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Progress Bar</h3>
          <q-linear-progress :value="progressValue / 100" class="q-mb-md" />
          <div class="q-gutter-sm">
            <q-btn @click="progressValue = Math.max(0, progressValue - 10)" icon="remove" />
            <span>{{ progressValue }}%</span>
            <q-btn @click="progressValue = Math.min(100, progressValue + 10)" icon="add" />
          </div>

          <h3 class="text-h6 q-mt-md">Spinners</h3>
          <div class="q-gutter-md">
            <q-spinner size="sm" />
            <q-spinner size="md" />
            <q-spinner size="lg" />
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Banners & Badges -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Banners & Badges</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Banners</h3>
          <q-banner class="bg-primary text-white q-mb-sm">
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            <strong>Info:</strong> This is an informational message.
          </q-banner>
          <q-banner class="bg-positive text-white q-mb-sm">
            <template v-slot:avatar>
              <q-icon name="check_circle" />
            </template>
            <strong>Success:</strong> Your changes have been saved!
          </q-banner>
          <q-banner class="bg-warning text-white q-mb-sm">
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            <strong>Warning:</strong> Please review your information.
          </q-banner>
          <q-banner class="bg-negative text-white">
            <template v-slot:avatar>
              <q-icon name="error" />
            </template>
            <strong>Error:</strong> Something went wrong.
          </q-banner>

          <h3 class="text-h6 q-mt-md">Badges</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-badge color="primary">Primary</q-badge>
            <q-badge color="positive">Success</q-badge>
            <q-badge color="grey">Neutral</q-badge>
            <q-badge color="warning">Warning</q-badge>
            <q-badge color="negative">Danger</q-badge>
          </div>

          <h3 class="text-h6">Pill Badges</h3>
          <div class="q-gutter-sm">
            <q-badge color="primary" rounded>99+</q-badge>
            <q-badge color="positive" rounded>New</q-badge>
            <q-badge color="negative" rounded>5</q-badge>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Avatars -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Avatars</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Avatar Sizes</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-avatar size="sm" color="primary" text-color="white">S</q-avatar>
            <q-avatar size="md" color="primary" text-color="white">M</q-avatar>
            <q-avatar size="lg" color="primary" text-color="white">L</q-avatar>
          </div>

          <h3 class="text-h6">Avatar Shapes</h3>
          <div class="q-gutter-sm">
            <q-avatar color="primary" text-color="white">U</q-avatar>
            <q-avatar square color="primary" text-color="white">U</q-avatar>
            <q-avatar rounded color="primary" text-color="white">U</q-avatar>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Tooltips -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Tooltips</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Tooltip Placements</h3>
          <div class="q-gutter-sm">
            <q-btn color="primary">
              Top
              <q-tooltip>Top tooltip</q-tooltip>
            </q-btn>
            <q-btn color="primary">
              Right
              <q-tooltip anchor="center right" self="center left">Right tooltip</q-tooltip>
            </q-btn>
            <q-btn color="primary">
              Bottom
              <q-tooltip anchor="bottom middle" self="top middle">Bottom tooltip</q-tooltip>
            </q-btn>
            <q-btn color="primary">
              Left
              <q-tooltip anchor="center left" self="center right">Left tooltip</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Dialog & Drawer -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Dialog & Drawer</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Dialog</h3>
          <div class="q-gutter-sm q-mb-md">
            <q-btn color="primary" @click="showDialog = true">Open Dialog</q-btn>
          </div>

          <q-dialog v-model="showDialog">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">Example Dialog</div>
              </q-card-section>

              <q-card-section>
                <p>This is a dialog example with Quasar.</p>
                <p>You can add any content here including forms, images, or other components.</p>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="grey" v-close-popup />
                <q-btn flat label="Confirm" color="primary" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <h3 class="text-h6">Drawer</h3>
          <div class="q-gutter-sm">
            <q-btn color="positive" @click="showDrawer = true">Open Drawer</q-btn>
          </div>

          <q-drawer v-model="showDrawer" side="right" overlay bordered>
            <q-scroll-area class="fit">
              <div class="q-pa-md">
                <div class="text-h6 q-mb-md">Example Drawer</div>
                <p>This is a drawer component.</p>
                <p>Drawers slide in from the side and are great for navigation menus or additional content.</p>
                <q-btn color="primary" @click="showDrawer = false" label="Close" />
              </div>
            </q-scroll-area>
          </q-drawer>
        </q-card-section>
      </q-card>
    </section>

    <!-- Icons -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Icons</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Common Icons (Material Icons)</h3>
          <div class="row q-gutter-md">
            <div class="col-auto text-center">
              <q-icon name="home" size="2rem" />
              <div>home</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="person" size="2rem" />
              <div>person</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="settings" size="2rem" />
              <div>settings</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="favorite" size="2rem" />
              <div>favorite</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="star" size="2rem" />
              <div>star</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="search" size="2rem" />
              <div>search</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="notifications" size="2rem" />
              <div>notifications</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="mail" size="2rem" />
              <div>mail</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="download" size="2rem" />
              <div>download</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="upload" size="2rem" />
              <div>upload</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="delete" size="2rem" />
              <div>delete</div>
            </div>
            <div class="col-auto text-center">
              <q-icon name="edit" size="2rem" />
              <div>edit</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Separators -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Separators</h2>
      <q-card>
        <q-card-section>
          <p>Content above separator</p>
          <q-separator />
          <p>Content below separator</p>
          <q-separator vertical style="height: 2rem;" class="q-my-md" />
          <p>Vertical separator example</p>
        </q-card-section>
      </q-card>
    </section>

    <!-- Toast/Notifications -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Toast / Notifications</h2>
      <q-card>
        <q-card-section>
          <h3 class="text-h6">Notification Types</h3>
          <div class="q-gutter-sm">
            <q-btn color="primary" @click="showToast('info')">Info Toast</q-btn>
            <q-btn color="positive" @click="showToast('success')">Success Toast</q-btn>
            <q-btn color="warning" @click="showToast('warning')">Warning Toast</q-btn>
            <q-btn color="negative" @click="showToast('error')">Error Toast</q-btn>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <!-- Table with Sorting, Filtering, and Pagination -->
    <section class="example-section q-mb-lg">
      <h2 class="text-h5">Table with Sorting, Filtering & Pagination</h2>
      <q-card>
        <q-card-section>
          <q-table
            :rows="tableRows"
            :columns="tableColumns"
            :filter="tableFilter"
            v-model:pagination="tablePagination"
            row-key="id"
            :rows-per-page-options="[5, 10, 15, 20]"
          >
            <template v-slot:top>
              <div class="q-table__title">User Management</div>
              <q-space />
              <q-input
                dense
                debounce="300"
                v-model="tableFilter"
                placeholder="Search users..."
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.status === 'Active' ? 'positive' : 'grey'"
                  :label="props.row.status"
                />
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  @click="handleEditRow(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="handleDeleteRow(props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </section>
  </div>
</template>

<style scoped>
.examples-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
