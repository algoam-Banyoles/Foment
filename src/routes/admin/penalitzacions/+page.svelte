<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { isAdmin } from '$lib/auth';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  interface Event { id: string; nom: string }
  interface Player { id: string; nom: string }

  let events: Event[] = [];
  let players: Player[] = [];
  let event_id = '';
  let player_id = '';
  let tipus: 'incompareixenca' | 'no_acord_dates' | 'altres' = 'incompareixenca';
  let detalls = '';
  let saving = false;
  let banner: { message: string; type: 'success' | 'error' } | null = null;

  onMount(async () => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, nom')
      .eq('actiu', true)
      .order('creat_el', { ascending: false });
    events = eventsData ?? [];

    const { data: playersData } = await supabase
      .from('players')
      .select('id, nom')
      .order('nom');
    players = playersData ?? [];
  });

  async function save() {
    saving = true;
    banner = null;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch('/reptes/penalitzacions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ event_id, player_id, tipus, detalls })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error desconegut');
      }
      banner = { message: 'Penalització creada', type: 'success' };
      tipus = 'incompareixenca';
      detalls = '';
    } catch (e: any) {
      banner = { message: e.message, type: 'error' };
    } finally {
      saving = false;
    }
  }
</script>

{#if !$page.data.session || !isAdmin()}
  <div class="mb-4 rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">No autoritzat</div>
{:else}
  {#if banner}
    <div class="mb-4 rounded-xl border p-4" class:bg-green-100={banner.type==='success'} class:border-green-300={banner.type==='success'} class:text-green-700={banner.type==='success'} class:bg-red-100={banner.type==='error'} class:border-red-300={banner.type==='error'} class:text-red-700={banner.type==='error'}>
      {banner.message}
    </div>
  {/if}
  <form class="max-w-2xl" on:submit|preventDefault={save}>
    <div class="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <label for="event_id" class="mb-1 block">Event</label>
        <select id="event_id" bind:value={event_id} class="w-full rounded-xl border px-3 py-2">
          <option value="" disabled selected>Selecciona un event</option>
          {#each events as e}
            <option value={e.id}>{e.nom}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="player_id" class="mb-1 block">Jugador</label>
        <select id="player_id" bind:value={player_id} class="w-full rounded-xl border px-3 py-2">
          <option value="" disabled selected>Selecciona un jugador</option>
          {#each players as p}
            <option value={p.id}>{p.nom}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="tipus" class="mb-1 block">Tipus</label>
        <select id="tipus" bind:value={tipus} class="w-full rounded-xl border px-3 py-2">
          <option value="incompareixenca">incompareixenca</option>
          <option value="no_acord_dates">no_acord_dates</option>
          <option value="altres">altres</option>
        </select>
      </div>
      <div>
        <label for="detalls" class="mb-1 block">Detalls</label>
        <textarea id="detalls" bind:value={detalls} rows="4" class="w-full rounded-xl border px-3 py-2"></textarea>
      </div>
      <button type="submit" class="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={saving}>
        {saving ? 'Desant…' : 'Desar'}
      </button>
    </div>
  </form>
{/if}

