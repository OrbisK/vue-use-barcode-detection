<script setup lang="ts">
const route = useRoute()
const path = `/${(route.params.slug as string[] | undefined)?.join('/') ?? ''}`

const { data: page } = await useAsyncData(`docs-${path}`, () =>
  queryCollection('docs').path(path).first(),
)

const { data: nav } = await useAsyncData('docs-nav', () =>
  queryCollection('docs').order('path', 'ASC').select('path', 'title').all(),
)

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
})
</script>

<template>
  <div class="layout">
    <aside>
      <nav>
        <NuxtLink v-for="item in nav" :key="item.path" :to="item.path" active-class="active">
          {{ item.title }}
        </NuxtLink>
      </nav>
    </aside>
    <main>
      <ContentRenderer v-if="page" :value="page" />
      <div v-else>
        <h1>Page not found</h1>
        <NuxtLink to="/"> Back home </NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 16rem 1fr;
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  gap: 2rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
aside nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: sticky;
  top: 2rem;
}
aside a {
  color: inherit;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
aside a:hover {
  background: rgba(0, 0, 0, 0.05);
}
aside a.active {
  background: rgba(0, 0, 0, 0.1);
  font-weight: 600;
}
main :deep(pre) {
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.04);
  overflow-x: auto;
}
@media (max-width: 48rem) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
