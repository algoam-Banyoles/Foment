<script lang="ts">
  import { page } from '$app/stores';
  import { isAdmin } from '$lib/auth';
</script>

<nav class="flex gap-4">
  <a href="/" class="hover:underline">Inici</a>
  {#if $page.data.session}
    {#if isAdmin()}
      <a href="/admin" class="hover:underline">Admin</a>
      <a href="/admin/config" class="hover:underline">Configuració</a>
      <a href="/admin/penalitzacions" class="hover:underline">Penalitzacions</a>
    {/if}
  {/if}
</nav>
