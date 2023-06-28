<style>
#search {
	border-left: none;
	border-top: none;
	border-right: none;
	outline: none;
}
</style>

<script lang="ts">
import type { ElementProps, TableMeta, TableRow } from 'src/types';
import Button from './Button.svelte';
import { writable } from 'svelte/store';
import Alert from './Alert.svelte';
import Storage from 'src/storage';
import {
	createDownloadLink,
	csvToObj,
	expandersToRows,
	fileReader,
	rowToExpandersObject,
	tab
} from 'src/utils';

type $$Props = ElementProps<'button'> & {
	title?: string;
	description?: string;
	keyprop?: string;
	headers: string[];
	rows: TableRow[];
	editable?: boolean;
	deleteable?: boolean;
	selectable?: boolean;
	filterable?: boolean;
	onSave?: (rows: TableRow[], meta: TableMeta) => void | Promise<void>;
};

const noop = (rows: TableRow[], meta: TableMeta) => {};

export let {
	keyprop,
	title,
	description,
	headers,
	editable,
	deleteable,
	rows,
	selectable,
	filterable,
	onSave
} = {
	keyprop: 'key',
	headers: [],
	rows: [],
	onSave: noop
} as Required<$$Props>;

let alert: Alert;
let notice: Alert;
let importer: HTMLInputElement;

export const store = writable({
	rows: [...rows],
	modified: [] as string[],
	removed: [] as string[],
	selected: [] as string[],
	editing: undefined as TableRow
});

$: isSelectedAll = $store.selected.length === $store.rows.length;
$: isIndeterminate = $store.selected.length > 0 && $store.selected.length !== $store.rows.length;

function getRowKey(row: TableRow) {
	if (!row) return '';
	return row.find((c) => c.name === keyprop).value as string;
}

function getKeys(rows: TableRow[]) {
	if (!rows) return [];
	return rows.reduce((a, c) => {
		const key = getRowKey(c);
		a.push(key);
		return a;
	}, [] as string[]);
}

export function select(...rows: TableRow[]) {
	store.update((s) => {
		return { ...s, selected: [...s.selected, ...getKeys(rows)] };
	});
}

export function unselect(...rows: TableRow[]) {
	const keys = getKeys(rows);
	store.update((s) => {
		return {
			...s,
			selected: s.selected.filter((c) => !keys.includes(c))
		};
	});
}

export function selectAll() {
	select(...$store.rows);
}

export function unselectAll() {
	unselect(...$store.rows);
}

export function remove(...rows: TableRow[]) {
	alert.open((confirmed) => {
		if (confirmed) {
			const keys = getKeys(rows);
			store.update((s) => {
				const newRows = s.rows.filter((r) => !keys.includes(getRowKey(r)));
				return { ...s, rows: newRows, removed: [...s.removed, ...keys] };
			});
		}
	});
}

export function add(row: TableRow) {
	store.update((s) => {
		s.rows.push(row);
		return { ...s };
	});
}

export function edit(row: TableRow) {
	store.update((s) => {
		return { ...s, editing: [...row] };
	});
}

export function unedit() {
	store.update((s) => {
		return { ...s, editing: undefined };
	});
}

export function filter(query = '') {
	store.update((s) => {
		if (!query) return { ...s, rows: [...rows] };
		const filtered = s.rows.filter((row) => {
			return row.some((col) => (col.value + '').toLowerCase().includes(query.toLowerCase()));
		});
		return { ...s, rows: filtered };
	});
}

function updateValue(name: string, value: any) {
	if (!$store.editing) return;
	$store.editing.forEach((c) => {
		if (c.name === name) c.value = value;
		return c;
	});
	store.update((s) => {
		return { ...s };
	});
}

function updateModified(...key: string[]) {
	store.update((s) => {
		return { ...s, modified: [...s.modified, ...key] };
	});
}

function saveRow() {
	store.update((s) => {
		if (s.editing) s.modified.push(getRowKey(s.editing));
		s.rows.reduce((a, c) => {
			if (getRowKey(c) === getRowKey(s.editing))
				c.forEach((o) => {
					s.editing.forEach((col) => {
						if (o.name === col.name) o.value = col.value;
					});
				});
			else a.push(c);
			return a;
		}, [] as TableRow[]);
		return { ...s, editing: undefined };
	});
}

function save() {
	if (onSave)
		onSave($store.rows, {
			source: rows,
			selected: $store.selected,
			modified: $store.modified,
			removed: $store.removed
		});
}

function toggleAll(
	e: Event & {
		currentTarget: EventTarget & HTMLInputElement;
	}
) {
	if (e.currentTarget.checked) {
		selectAll();
	} else {
		unselectAll();
	}
}
function exportRows(type = 'csv' as 'csv' | 'json') {
	let filtered = $store.rows;
	if ($store.selected.length) filtered = $store.rows.filter((r) => $store.selected.includes(getRowKey(r)));
	createDownloadLink(`texpand.${type}`, rowToExpandersObject(filtered), type);
}
function importRows(type = 'csv' as 'csv' | 'json') {
	fileReader(importer.files[0])
		.then((str) => {
			const result = (type === 'csv' ? csvToObj(str) : JSON.parse(str)) as Record<string, string>;
			const rowKeys = getKeys($store.rows);
			const imports = [] as string[];
			const dupes = [] as string[];
			const deduped = Object.keys(result)
				.filter((k) => {
					if (rowKeys.includes(k)) dupes.push(k);
					else {
						imports.push(k);
					}
					return !rowKeys.includes(k);
				})
				.reduce((a, c) => {
					a[c] = result[c];
					return a;
				}, {} as any);
			if (imports.length) {
				expandersToRows(deduped).forEach((r) => add(r));
				// Storage.get('expanders').then((obj) => {
				// 	const newExpanders = { ...obj.expanders, ...deduped };
				// 	console.log(newExpanders);
					Storage.update('expanders', deduped).then(v => console.log(v.expanders))
				//});
				notice.open(
					`${imports.length} code(s) imported ${dupes.length} were duplicates and ignored`,
					'success'
				);
				// new codes found update
				// Storage.update('expanders', deduped)
				// 	.then((res) => {
				// 		expandersToRows(deduped).forEach((r) => add(r));
				// 		notice.open(
				// 			`${imports.length} code(s) imported ${dupes.length} were duplicates and ignored`,
				// 			'success'
				// 		);
				// 	})
				// 	.catch((ex) => {
				// 		console.warn(ex.message);
				// 	});
			} else {
				notice.open(`${imports.length} code(s) imported ${dupes.length} were duplicates and ignored`);
			}
		})
		.catch((e) => {
			console.log('[TEXPAND]:', e);
			notice.open(`Error importing rows.`, 'danger');
		});
}
</script>

<div class="w-full">
	<div>
		{#if title || description}
			<div class="flex items-center mb-2">
				<div class="flex-auto">
					{#if title}
						<h1 class="text-base font-semibold leading-6 text-gray-900">
							{title}
						</h1>
					{/if}
					{#if description}
						<p class="mt-2 text-sm text-gray-700">
							{description}
						</p>
					{/if}
				</div>
				<div class="flex-none"></div>
			</div>
		{/if}
		{#if filterable}
			<div class="mb-2">
				<input
					id="search"
					type="text"
					class="block w-full focus-visible:outline-none focus:outline-none rounded-none border-b py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 text-sm focus:ring-0"
					on:input="{(e) => filter(e.currentTarget.value || '')}"
					placeholder="Search Filter" />
			</div>
		{/if}
		<div class="flow-root bg-white">
			<div class="pb-4 ring-1 ring-black ring-opacity-5 shadow-md rounded-lg">
				<div class="inline-block min-w-full align-middle max-h-[275px] overflow-y-auto">
					<table class="w-full divide-y divide-slate-50">
						<thead>
							<tr>
								{#if selectable}
									<th
										scope="col"
										class="sticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
										<input
											type="checkbox"
											class="rounded-sm border-slate-400"
											on:click="{(e) => toggleAll(e)}"
											checked="{isSelectedAll}"
											indeterminate="{isIndeterminate}" />
									</th>
								{/if}
								{#each headers as hdr, i}
									<th
										scope="col"
										class="sticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
										>{hdr}</th>
								{/each}

								{#if editable || deleteable}
									<th
										scope="col"
										class="sticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 backdrop-blur backdrop-filter">
										<span class="sr-only">Actions</span>
									</th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each $store.rows as row, i}
								<tr>
									{#if selectable}
										<td
											class="align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500">
											<input
												type="checkbox"
												class="rounded-sm border-slate-400"
												on:click="{() =>
													$store.selected.includes(getRowKey(row)) ? unselect(row) : select(row)}"
												checked="{$store.selected.includes(getRowKey(row))}" />
										</td>
									{/if}
									{#each row as col, n}
										{#if $store.editing && getRowKey($store.editing) === getRowKey(row)}
											<td
												class="align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500">
												{#if col.type === 'input'}
													<input
														type="text"
														value="{col.value}"
														size="{1}"
														class="text-sm w-auto min-w-[90px]"
														on:change="{(e) => updateValue(col.name, e.currentTarget.value)}" />
												{:else if col.type === 'textarea'}
													<textarea
														class="text-sm"
														rows="{1}"
														on:change="{(e) => updateValue(col.name, e.currentTarget.value)}"
														>{col.value}</textarea>
												{:else}
													<td
														class="align-top whitespace-nowrap border-none border-gray-200 px-3 py-1.5 text-sm text-gray-500"
														>{col.value}
													</td>
												{/if}
											</td>
										{:else}
											<td
												class="align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500"
												>{col.value}
											</td>
										{/if}
									{/each}

									{#if editable || deleteable}
										<td
											class="align-top relative whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-right text-sm font-medium">
											{#if $store.editing && getRowKey($store.editing) === getRowKey(row)}
												<Button variant="icon" theme="danger" icon="cancel" on:click="{unedit}" />
												<Button variant="icon" theme="success" icon="save" on:click="{() => saveRow()}" />
											{:else}
												{#if deleteable}
													<Button
														variant="icon"
														theme="danger"
														icon="delete"
														on:click="{() => remove(row)}" />
												{/if}
												{#if editable}
													<Button variant="icon" theme="warning" icon="edit" on:click="{() => edit(row)}" />
												{/if}
											{/if}
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
	{#if editable || deleteable}
		<div class="mt-4">
			<div class="flex">
				<div class="flex-1">
					<Button icon="export" on:click="{() => exportRows()}">Export</Button>
					<Button icon="import" on:click="{() => importer.click()}">Import</Button>
					<input bind:this="{importer}" name="import" type="file" hidden on:change="{() => importRows()}" />
				</div>
				<div>
					<Button theme="success" icon="add" on:click="{() => tab.change('add')}">New</Button>
					<Button theme="primary" on:click="{() => save()}" icon="save">Save Changes</Button>
				</div>
			</div>
		</div>
	{/if}
	<!-- <div class="m-2">{selectedRows.length}</div> -->
	<Alert bind:this="{alert}" theme="danger" message="Are you sure?" confirmable="Delete" />
	<Alert bind:this="{notice}" dismissable />
</div>
