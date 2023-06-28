<script lang="ts">
import Storage from 'src/storage';
import themer from 'src/themer';
import { tab } from 'src/utils';

let active = false;

const classes = 'border border-transparent border-b-none px-3.5 py-1.5 mx-0.5 hover:underline';
const classesActive =
	classes + ' bg-indigo-700 border border-indigo-600 rounded-tr-md rounded-tl-md pointer-events-none';

// Enabled: "bg-indigo-600", Not Enabled: "bg-gray-200"
$: toggle = themer()
	.add(
		'bg-gray-200 pointer-events-none absolute mx-auto h-3.5 w-7 rounded-full transition-colors duration-200 ease-in-out',
		true
	)
	.add('bg-teal-200', active)
	.compile();

// Enabled: "translate-x-5", Not Enabled: "translate-x-0"
$: thumb = themer()
	.add(
		'translate-x-0 pointer-events-none absolute left-0 inline-block h-[18px] w-[18px] transform rounded-full border border-gray-300 bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
		true
	)
	.add('translate-x-5', active)
	.compile();

function setActivity(value: boolean) {
	Storage.update({ active: value });
	active = value;
}
</script>

<div class="bg-indigo-600 text-white">
	<div class="text-sm flex items-end h-10">
		<div class="pl-3 pb-3.5">
			<img src="/src/assets/logo.png" alt="Texpand Logo" class="h-3" />
		</div>
		<div class="flex flex-1 pl-4 items-end">
			<button class="{$tab === 'home' ? classesActive : classes}" on:click="{() => tab.change('home')}"
				>Home</button>
			<button class="{$tab === 'add' ? classesActive : classes}" on:click="{() => tab.change('add')}"
				>Add</button>
			<button
				class="{$tab === 'settings' ? classesActive : classes}"
				on:click="{() => tab.change('settings')}">Settings</button>
			<!-- <button class="{$tab === 'help' ? classesActive : classes}" on:click="{() => tab.change('help')}"
					>Help</button> -->
		</div>
		<div class="pr-3">
			<button
				type="button"
				class="-top-1 group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none outline-none focus:ring-indigo-600 focus:ring-0 focus:ring-offset-0"
				role="switch"
				aria-checked="{active}"
				on:click="{() => setActivity(active === true ? false : true)}">
				<span class="sr-only">Active</span>
				<span aria-hidden="true" class="pointer-events-none absolute h-full w-full rounded-md bg-indigo-600"
				></span>
				<span aria-hidden="true" class="{toggle}"></span>
				<span aria-hidden="true" class="{thumb}"></span>
			</button>
		</div>
	</div>
</div>
