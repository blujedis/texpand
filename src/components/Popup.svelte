<script lang="ts">
import Table from './Table.svelte';
import { expandersToTableRows, tableToExpanderRows } from 'src/utils';
import Container from './Container.svelte';
import Alert from './Alert.svelte';
import Storage from '../storage';
import type { Expander, TableMeta, TableRow } from 'src/types';
import { tab, specialCharsExp } from 'src/utils';
import Button from './Button.svelte';
import { writable } from 'svelte/store';

let alert: Alert;
let table: Table;
let container: Container;

let code = '';
let expanded = '';
let newTag = '';

const tagStore = writable([] as string[]);

let timeout = $Storage.settings.timeout;
let casesensitive = $Storage.settings.casesensitive;
let prefixKey = $Storage.settings.prefixKey;
let disableKey = $Storage.settings.disableKey;
let enableKey = $Storage.settings.enableKey;

async function onSaveTable(rows: TableRow[], meta: TableMeta) {
	if (!meta.modified && !meta.removed)
		return alert.open(`Exiting, no records were modified or removed.`, 'warning');
	const result = await Storage.update('expanders', tableToExpanderRows(rows), true);
	if (result) alert.open(`${meta.modified} records were updated, ${meta.removed} were removed.`, 'success');
	else alert.open(`Save failed, please try again or contact support.`, 'warning');
}

async function saveNew() {
	if (!code || !expanded) return alert.open('Add failed missing Code or Expanded value.', 'danger');
	if ($Storage.settings.prefixKey && !specialCharsExp.test(code)) code = $Storage.settings.prefixKey + code;
	if ($Storage.settings.prefixKey && !specialCharsExp.test(code))
		// if defined auto prefix with desired char.
		code = $Storage.settings.prefixKey + code;
	if (!specialCharsExp.test(code))
		return alert.open(`Key code must begin with a special character but got "${code.charAt(0)}"`, 'danger');
	const obj = { code, expanded, tags: $tagStore } as Expander;
	const result = await Storage.update('expanders', obj);
	if (!result) return alert.open('An error occurred please try again or contact support.', 'danger');
	tab.change('list');
	alert.open(`Successuflly added new code ${code}.`, 'success');
}

function resetNew() {
	code = '';
	expanded = '';
	newTag = '';
	tagStore.set([]);
}

async function saveSettings() {
	if (!enableKey || !disableKey)
		return alert.open('Save failed missing one of the following required fields [enableKey, disabledKey]');
	const obj = { casesensitive, enableKey, disableKey, timeout };
	const result = await Storage.update('settings', { ...$Storage.settings, ...obj });
	if (result) {
		alert.open('Settings successfully saved.', 'success');
	} else {
		alert.open('An error occurred please try again or contact support.', 'danger');
	}
}

function resetSettings() {
	timeout = $Storage.settings.timeout;
	casesensitive = $Storage.settings.casesensitive;
	prefixKey = $Storage.settings.prefixKey;
	enableKey = $Storage.settings.enableKey;
	disableKey = $Storage.settings.disableKey;
}
</script>

<Container bind:this="{container}" width="{600}" active>
	{#if $tab === 'list'}
		<Table
			bind:this="{table}"
			headers="{[
				{ label: 'Code', name: 'code' },
				{ label: 'Expanded', name: 'expanded' },
				{ label: 'Tags', name: 'tags' }
			]}"
			rows="{expandersToTableRows($Storage.expanders)}"
			editable
			deleteable
			selectable
			filterable
			onSave="{onSaveTable}" />
	{:else if $tab === 'add'}
		<div>
			<div class="mb-2">
				<label for="key" class="block text-sm font-medium leading-2 text-slate-900">Code</label>
				<div class="mt-2">
					<input
						bind:value="{code}"
						type="text"
						name="key"
						id="key"
						class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
						placeholder="ex: /dis" />
				</div>
			</div>
			<div class="mb-2">
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
			<div>
				<label for="expanded" class="block text-sm font-medium leading-2 text-slate-900">Tags</label>
				<div class="mt-2">
					<div class="flex mb-2">
						<input
							bind:value="{newTag}"
							type="text"
							name="newTag"
							id="newTag"
							class="block w-full rounded-sm border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
							placeholder="ex: /dis"
							on:blur="{() => {
								if (newTag && newTag.length) {
									tagStore.update((s) => [...s, newTag]);
								}
								newTag = '';
							}}" />
						<Button
							icon="add"
							theme="default"
							class="ml-1"
							on:click="{() => {
								if (newTag && newTag.length) {
									tagStore.update((s) => [...s, newTag]);
								} else {
									alert.open(`Whoops no tag to add!`, 'warning');
								}
								newTag = '';
							}}" />
					</div>

					{#each $tagStore as tag}
						<span
							class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mr-1">
							{tag}
							<button
								on:click="{() => {
									tagStore.update((s) => {
										return s.filter((t) => t !== tag);
									});
								}}">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
								</svg>
							</button>
						</span>
					{/each}
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
						Auto prepend shortcuts with this value when defined.
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
