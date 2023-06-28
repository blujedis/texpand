<script lang="ts">
import Button from './Button.svelte';
import { tab } from 'src/utils';

function openOptions() {
	tab.change('settings');
	// if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
	// else window.open(chrome.runtime.getURL('options.html'));
}
</script>

<div class="fixed bottom-0 left-0 w-full">
	<div class="flex items-center text-center text-xs text-slate-400 justify-between px-4 py-2">
		<div>&copy; Blujedi Corp LLC 2023</div>
		<Button variant="link" class="text-xs" on:click="{openOptions}">Settings</Button>
	</div>
</div>
