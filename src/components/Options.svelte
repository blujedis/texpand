<script lang="ts">
import Storage from '../storage';
import Footer from './Footer.svelte';

let message: string = null;

function save() {
	// Storage.set({}).then(() => {
	// 	message = 'Success!';

	// 	setTimeout(() => {
	// 		message = null;
	// 	}, 1500);
	// });
}
</script>

<div>
	<div>Hello World</div>
	<div>
		<button on:click="{save}">Save</button>
		{#if message}<span class="success">{message}</span>{/if}
	</div>
	<Footer />
</div>
