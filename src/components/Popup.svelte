<script lang="ts">
import Table from './Table.svelte';
import { expandersToRows, rowToExpandersObject } from 'src/utils';
import Container from './Container.svelte';
import Alert from './Alert.svelte';
import Storage from '../storage';
import type { StorageSettings, TableMeta, TableRow } from 'src/types';
import { tab, specialCharsExp } from 'src/utils';
import Button from './Button.svelte';
import { onMount } from 'svelte';

export let active = false;
export let settings = {} as StorageSettings['settings'];
export let expanders = {} as StorageSettings['expanders'];

let alert: Alert;
let table: Table;
let container: Container;

let key = '';
let expanded = '';

let timeout = settings.timeout;
let casesensitive = settings.casesensitive;
let prefixKey = settings.prefixKey;
let disableKey = settings.disableKey;
let enableKey = settings.enableKey;

async function onSave(rows: TableRow[], meta: TableMeta) {
	if (!meta.modified.length && !meta.removed.length)
		return alert.open(`Exiting, no records modified or removed.`, 'warning');
	const result = await Storage.update('expanders', rowToExpandersObject(rows));
	alert.open(`${meta.modified.length} records were updated, ${meta.removed.length} were removed.`, 'success');
}

async function saveNew() {
	if (!key || !expanded) return alert.open('Add failed missing Code or Expanded value.', 'danger');
	if (settings.prefixKey && !specialCharsExp.test(key))
		// if defined auto prefix with desired char.
		key = settings.prefixKey + key;
	if (!specialCharsExp.test(key))
		return alert.open(`Key code must begin with a special character but got "${key.charAt(0)}"`, 'danger');
	const obj = { [key]: expanded };
	const result = await Storage.update('expanders', { ...expanders, ...obj });
	if (result) expanders = result.expanders;
	else return alert.open('An error occurred please try again or contact support.', 'danger');
	tab.change('home');
}

function resetNew() {
	key = '';
	expanded = '';
}

async function saveSettings() {
	if (!enableKey || !disableKey)
		return alert.open('Save failed missing one of the following required fields [enableKey, disabledKey]');
	const obj = { casesensitive, enableKey, disableKey };
	const result = await Storage.update('settings', { ...settings, ...obj });
	if (result) {
		settings = { ...settings, casesensitive, disableKey, enableKey };
		alert.open('Settings successfully saved.', 'success');
	} else {
		alert.open('An error occurred please try again or contact support.', 'danger');
	}
}

function resetSettings() {
	timeout = settings.timeout;
	casesensitive = settings.casesensitive;
	prefixKey = settings.prefixKey;
	enableKey = settings.enableKey;
	disableKey = settings.disableKey;
}

</script>

<Container bind:this="{container}" active>
	{#if $tab === 'home'}
		<Table
			bind:this="{table}"
			headers="{['Code', 'Expanded']}"
			rows="{expandersToRows(expanders)}"
			editable
			deleteable
			selectable
			filterable
			onSave="{onSave}" />
	{:else if $tab === 'add'}
		<div>
			<div class="mb-2">
				<label for="key" class="block text-sm font-medium leading-2 text-slate-900">Code</label>
				<div class="mt-2">
					<input
						bind:value="{key}"
						type="text"
						name="key"
						id="key"
						class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
						placeholder="ex: /dis" />
				</div>
			</div>
			<div>
				<label for="expanded" class="block text-sm font-medium leading-2 text-slate-900">Expanded</label>
				<div class="mt-2">
					<textarea
						bind:value="{expanded}"
						name="expanded"
						id="expanded"
						class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
						placeholder="ex: Discount"></textarea>
				</div>
			</div>
			<div class="flex mt-4">
				<div class="flex-1">&nbsp;</div>
				<div class="flex items-center justify-between">
					<Button on:click="{() => resetNew()}" class="mr-1">Reset</Button>
					<Button icon="save" theme="primary" on:click="{() => saveNew()}">Save New</Button>
				</div>
			</div>
		</div>
	{:else if $tab === 'settings'}
		<div>
			<div class="mb-2">
				<div class="flex justify-between">
					<div>
						<label for="expanded" class="block text-sm font-medium leading-2 text-slate-900"
							>Enable Key</label>
						<div class="mt-2">
							<input
								bind:value="{enableKey}"
								type="text"
								name="enableKey"
								id="enableKey"
								class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
								size="{1}"
								placeholder="ex: [" />
							<p class="mt-2 text-sm text-slate-500" id="email-description">Ctrl + above enables Texpand.</p>
						</div>
					</div>

					<div>
						<label for="disableKey" class="block text-sm font-medium leading-2 text-slate-900"
							>Disable Key</label>
						<div class="mt-2">
							<input
								bind:value="{disableKey}"
								type="text"
								name="disableKey"
								id="disableKey"
								class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
								size="{1}"
								placeholder="ex: ]" />
							<p class="mt-2 text-sm text-slate-500" id="email-description">Ctrl + above disables Texpand.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mb-2">
				<label for="prefixKey" class="block text-sm font-medium leading-2 text-slate-900">Prefix Key</label>
				<div class="mt-2">
					<input
						bind:value="{prefixKey}"
						type="text"
						name="prefixKey"
						id="prefixKey"
						class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
						size="{1}"
						placeholder="ex: /" />
					<p class="mt-2 text-sm text-slate-500" id="email-description">
						Prepend shortcuts with this value when defined.
					</p>
				</div>
			</div>

			<div class="flex mb-2 justify-between">
				<div class="mb-2">
					<label for="timeout" class="block text-sm font-medium leading-2 text-slate-900">Timeout</label>
					<div class="mt-2">
						<input
							bind:value="{timeout}"
							type="number"
							name="timeout"
							id="timeout"
							class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
							placeholder="default: 6000" />
					</div>
				</div>

				<div>
					<label for="casesensitive" class="block text-sm font-medium leading-2 text-slate-900"
						>Case Sensitive?</label>
					<div class="mt-2">
						<input
							bind:checked="{casesensitive}"
							type="checkbox"
							name="casesensitive"
							id="casesensitive"
							class="rounded-sm"
							placeholder="Matching & filtering is casesensitive" />
					</div>
				</div>
			</div>

			<div class="flex mt-4">
				<div class="flex-1">&nbsp;</div>
				<div class="flex items-center justify-between">
					<Button on:click="{() => resetSettings()}" class="mr-1">Reset</Button>
					<Button icon="save" theme="primary" on:click="{() => saveSettings()}">Save Settings</Button>
				</div>
			</div>
		</div>
	{/if}

	<Alert bind:this="{alert}" />
</Container>
