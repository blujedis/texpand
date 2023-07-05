<style>
#search {
	border-left: none;
	border-top: none;
	border-right: none;
	outline: none;
}
</style>

<script lang="ts">
import type { ElementProps, Expander, TableColumn, TableHeader, TableMeta, TableRow } from 'src/types';
import Button from './Button.svelte';
import { writable, type Unsubscriber } from 'svelte/store';
import Alert from './Alert.svelte';
import Storage from '../storage';
import splitString from 'split-string';
import {
	createDownloadLink,
	csvToRows,
	expandersToTableRows,
	fileReader,
	tab,
	tableToExpanderRows
} from 'src/utils';

type $$Props = ElementProps<'button'> & {
	title?: string;
	description?: string;
	keyprop?: string;
	headers: TableHeader[];
	rows: TableRow[];
	editable?: boolean;
	deleteable?: boolean;
	selectable?: boolean;
	filterable?: boolean;
	showTags?: boolean;
	onSave: (rows: TableRow[], meta: TableMeta) => void | Promise<void>;
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
	onSave,
	showTags
} = {
	keyprop: 'code',
	headers: [],
	rows: [],
	onSave: noop,
	showTags: true
} as Required<$$Props>;

let alert: Alert;
let notice: Alert;
let importer: HTMLInputElement;
let search: string;

type StoreValue = {
	rows: TableRow[];
	modified: string[];
	removed: string[];
	selected: string[];
	editing?: TableRow;
	tags: string[];
};

export const store = writable({
	rows: [...rows].reduce((a, c) => {
		const row = [] as TableRow;
		c.forEach((col) => {
			const idx = headers.findIndex((h) => h.name === col.name);
			if (idx >= 0) row[idx] = col;
		});
		a.push(row);
		return a;
	}, [] as TableRow[]),
	selected: [] as string[],
	editing: undefined as TableRow,
	tags: [] as string[]
});

$: isSelectedAll = $store.selected.length === $store.rows.length;
$: isIndeterminate = $store.selected.length > 0 && $store.selected.length !== $store.rows.length;
$: uniqueTags = rows.reduce((utags, r) => {
	const rtags = (r.find((col) => col.name === 'tags') || ({ value: [] } as TableColumn)).value || [];
	const current = rtags.filter((t) => !utags.includes(t));
	return [...utags, ...current];
}, [] as string[]);

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
				onSave(newRows, {
					modified: 0,
					removed: keys.length
				});
				return { ...s, rows: newRows  };
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

function getFilteredRows(query = '') {
	const queries = splitString(query.trim())
		.map((q) => q.split(' '))
		.flat()
		.filter((q) => typeof q !== 'undefined');
	return !queries?.length
		? [...rows]
		: rows.filter((row) => {
				return row.some((col) => {
					const normalized = (
						(Array.isArray(col.value) ? col.value.join(' ') : col.value + '') || ''
					).toLowerCase();
					return queries.some((q) => normalized.includes(q.toLowerCase()));
				});
		  });
}

export function filter(query = '') {
	store.update((s) => {
		return { ...s, rows: getFilteredRows([query, ...s.tags].join(' ')) };
	});
}

export function resetFilter() {
	store.update((s) => {
		search = '';
		return { ...s, tags: [], rows: [...rows] };
	});
}

export function toggleTag(value: string) {
	store.update((s) => {
		let newTags = [];
		if (value === 'all') {
			if (!s.tags.includes('all')) newTags = [...uniqueTags, 'all'];
		} else {
			newTags = s.tags.includes(value) ? s.tags.filter((t) => t !== value) : [...s.tags, value];
		}
		const filtered = getFilteredRows([search || '', ...newTags].join(' '));
		if (newTags.length < uniqueTags.length + 1) newTags = newTags.filter((t) => t !== 'all');
		return { ...s, rows: filtered, tags: newTags };
	});
}

export function toggleAllRows(
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

export function exportRows(type = 'csv' as 'csv' | 'json') {
	let filtered = $store.rows;
	if ($store.selected.length) filtered = $store.rows.filter((r) => $store.selected.includes(getRowKey(r)));
	const exportedRows = tableToExpanderRows(filtered);
	createDownloadLink(`texpand.${type}`, exportedRows, type);
}

export async function importRows(type = 'csv' as 'csv' | 'json') {
	fileReader(importer.files[0])
		.then((str) => {
			const result = (type === 'csv' ? csvToRows(str) : JSON.parse(str)) as Expander[];
			const rowKeys = getKeys($store.rows);
			const dupes = [] as string[];
			const imports = result.filter((row) => {
				if (rowKeys.includes(row.code)) dupes.push(row.code);
				return !rowKeys.includes(row.code);
			});
			if (imports.length) {
				Storage.update('expanders', imports).then((s) => {
					store.update((s) => {
						return { ...s, rows: [...s.rows, ...expandersToTableRows(imports)] };
					});
					notice.open(
						`${imports.length} code(s) imported ${dupes.length} were duplicates and ignored`,
						'success'
					);
				});
			} else {
				notice.open(`${imports.length} code(s) imported ${dupes.length} were duplicates and ignored`);
			}
		})
		.catch((e) => {
			console.log('[TEXPAND]:', e);
			notice.open(`Error importing rows.`, 'danger');
		});
}

function updateValue(name: string, value: any) {
	if (!$store.editing) return;
	$store.editing.forEach((c) => {
		if (c.name === name) c.value = value;
	});
	store.update((s) => {
		return { ...s };
	});
}

function saveRow() {
	store.update((s) => {
		const editRow = s.editing;
		s.rows.forEach((r) => {
			if (getRowKey(r) === getRowKey(editRow)) {
				r.forEach((rCol) => {
					editRow.forEach((col) => {
						if (rCol.name === col.name) {
							rCol.value = col.value;
						}
					});
				});
			}
		});
		onSave(s.rows, {
			modified: 1,
			removed: 0
		});
		return { ...s, editing: undefined };
	});
}

// function save() {
// 	if ($store.editing)
// 		return alert.open(`A row is being edited, please save or cancel before saving changes.`, 'warning');
// 	if (onSave)
// 		onSave($store.rows, {
// 			source: rows,
// 			selected: $store.selected,
// 			modified: $store.modified,
// 			removed: $store.removed
// 		});
// }

function handleSubmitBadges(
	e: Event & { readonly submitter: HTMLElement } & { currentTarget: EventTarget & HTMLFormElement },
	currentValue?: any
) {
	e.preventDefault();
	const formData = new FormData(e.currentTarget);
	for (const [k, v] of formData.entries()) {
		updateValue(k, [...currentValue, v]);
	}
	e.currentTarget.reset();
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
				<div class="flex items-end">
					<input
						bind:value="{search}"
						id="search"
						type="text"
						class="block w-full focus-visible:outline-none focus:outline-none rounded-none border-b py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 text-sm focus:ring-0 flex-1"
						on:input="{(e) => filter(e.currentTarget.value || '')}"
						placeholder="Search Filter" />
					<div>
						<button
							class="text-indigo-600 hover:text-indigo-500 appearance-none pl-6"
							on:click="{resetFilter}">Reset</button>
					</div>
				</div>
			</div>
		{/if}
		{#if showTags}
			<div class="mb-4">
				{#each uniqueTags as tag}
					<button on:click="{(e) => toggleTag(tag)}">
						<span
							aria-checked="{$store.tags.includes(tag)}"
							class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mr-1 aria-checked:bg-indigo-500 aria-checked:text-white hover:bg-indigo-100/90">
							{tag}
						</span>
					</button>
				{/each}
				<button on:click="{(e) => toggleTag('all')}">
					<span
						aria-checked="{$store.tags.includes('all')}"
						class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mr-1 aria-checked:bg-indigo-500 aria-checked:text-white hover:bg-indigo-100/90">
						all
					</span>
				</button>
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
										class="text-leftsticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
										<input
											type="checkbox"
											class="rounded-sm border-slate-400"
											on:click="{(e) => toggleAllRows(e)}"
											checked="{isSelectedAll}"
											indeterminate="{isIndeterminate}" />
									</th>
								{/if}
								{#each headers as hdr}
									<th
										scope="col"
										class="text-left sticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter break-normal"
										>{hdr.label}</th>
								{/each}

								{#if editable || deleteable}
									<th
										scope="col"
										class="text-left sticky top-0 border-b z-10 border-gray-300 bg-slate-50 bg-opacity-75 py-2 px-3 pt-3 backdrop-blur backdrop-filter">
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
											class="text-left align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500">
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
												class="text-left align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500 break-normal">
												{#if col?.type === 'input'}
													<input
														type="text"
														value="{col.value}"
														size="{1}"
														class="text-sm w-auto min-w-[90px]"
														on:change="{(e) => updateValue(col.name, e.currentTarget.value)}" />
												{:else if col?.type === 'textarea'}
													<textarea
														class="text-sm"
														rows="{1}"
														on:change="{(e) => updateValue(col.name, e.currentTarget.value)}"
														>{col.value}</textarea>
												{:else if col?.type === 'select' || col.type === 'select.multiple'}
													<select
														multiple="{col.type === 'select.multiple'}"
														on:change="{(e) => updateValue(col.name, e.currentTarget.value)}">
														{#each col.items || [] as opt}
															<option value="{opt?.value}">{opt.label || opt?.value + ''}</option>
														{/each}
													</select>
												{:else if col?.type === 'badges'}
													{#each col.value as val}
														<span
															class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mr-1">
															{val}
															<button
																on:click="{() =>
																	updateValue(
																		col.name,
																		col.value.filter((v) => v !== val)
																	)}">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																	class="w-4 h-4">
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M6 18L18 6M6 6l12 12"></path>
																</svg>
															</button>
														</span>
													{/each}
													<form on:submit="{(e) => handleSubmitBadges(e, col.value)}" class="mr-1">
														<input
															name="{col.name}"
															type="text"
															class="mt-1 text-sm w-auto min-w-[90px] px-1 py-1" />
														<button type="submit">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																stroke-width="1.5"
																stroke="currentColor"
																class="w-5 h-5">
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
															</svg>
														</button>
													</form>
												{:else if typeof col?.formatter === 'function'}
													{col.formatter(col.value)}
												{:else}
													{col.value}
												{/if}
											</td>
										{:else}
											<td
												class="text-left align-top whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-sm text-gray-500 break-normal">
												{#if typeof col?.formatter === 'function'}
													{col.formatter(col.value)}
												{:else if col?.type === 'badges' && Array.isArray(col.value)}
													{#each col?.value as val}
														<span
															class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mr-1"
															>{val}</span>
													{/each}
												{:else}
													{col?.value}
												{/if}
											</td>
										{/if}
									{/each}

									{#if editable || deleteable}
										<td
											class="text-left align-top relative whitespace-nowrap border-b border-gray-200 px-3 py-1.5 text-right text-sm font-medium">
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
					<!-- <Button
						theme="primary"
						on:click="{() => save()}"
						icon="save"
						disabled="{Array.isArray($store.editing)}">Save Changes</Button> -->
				</div>
			</div>
		</div>
	{/if}
	<!-- <div class="m-2">{selectedRows.length}</div> -->
	<Alert bind:this="{alert}" theme="danger" message="Are you sure?" confirmable="Delete" />
	<Alert bind:this="{notice}" dismissable />
</div>
