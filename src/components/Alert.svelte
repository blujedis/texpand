<script lang="ts">
import themer from 'src/themer';
import type { ElementProps } from 'src/types';
import { writable } from 'svelte/store';

type $$Props = ElementProps<'div'> & {
	message?: any;
	icon?: boolean;
	theme?: 'info' | 'primary' | 'warning' | 'danger' | 'success';
	dismissable?: boolean;
	visible?: boolean;
	confirmable?: boolean | string | [string, string];
};

export let { message, icon, theme, dismissable, visible, confirmable } = {
	message: '',
	icon: true,
	theme: 'info',
	dismissable: true
} as Required<$$Props>;

const wrapperMap = {
	info: 'border-cyan-400 bg-cyan-50',
	primary: 'border-indigo-400 bg-indigo-50',
	warning: 'border-amber-400 bg-amber-50',
	danger: 'border-rose-400 bg-rose-50',
	success: 'border-emerald-400 bg-emerald-50'
};

const iconMap = {
	info: 'text-cyan-400',
	primary: 'text-indigo-400',
	warning: 'text-amber-400',
	danger: 'text-rose-400',
	success: 'text-emerald-400'
};

const contentMap = {
	info: 'text-cyan-700',
	primary: 'text-indigo-700',
	warning: 'text-amber-700',
	danger: 'text-rose-700',
	success: 'text-emerald-700'
};

const buttonMap = {
	info: 'focus:ring-offset-cyan-50 bg-cyan-50 text-cyan-500 hover:bg-cyan-100 focus:ring-cyan-600',
	primary:
		'focus:ring-offset-indigo-50 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 focus:ring-indigo-600',
	warning: 'focus:ring-offset-amber-50 bg-amber-50 text-amber-500 hover:bg-amber-100 focus:ring-amber-600',
	danger: 'focus:ring-offset-rose-50 bg-rose-50 text-rose-500 hover:bg-rose-100 focus:ring-rose-600',
	success:
		'focus:ring-offset-emerald-50 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 focus:ring-emerald-600'
};

const store = writable({ visible, message, theme, onClosed: (confirm: 0 | 1) => {} });

$: wrapper = themer()
	.add('p-4 border-l-4 shadow-md z-40 ring-1 ring-black ring-opacity-5', true)
	.add(wrapperMap[$store.theme], true)
	.append($$restProps.class, $$restProps.class)
	.compile();

$: svg = themer().add('h-5 w-5', true).add(iconMap[$store.theme], true).compile();

$: content = themer().add('text-sm', true).add(contentMap[$store.theme], true).compile();

$: button = themer()
	.add('inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm', true)
	.add(buttonMap[$store.theme], true)
	.compile();

$: cancelText =
	typeof confirmable === 'string' || typeof confirmable === 'boolean'
		? 'Cancel'
		: Array.isArray(confirmable)
		? confirmable[1] || 'Cancel'
		: 'Cancel';
$: confirmText =
	typeof confirmable === 'boolean'
		? 'Confirmed'
		: typeof confirmable === 'string'
		? confirmable
		: Array.isArray(confirmable)
		? confirmable[0] || 'Confirmed'
		: 'Confirmed';

export function open(message: any, theme?: $$Props['theme'], onClosed?: (confirm: any) => void): void;
export function open(message: any, onClosed?: (confirm: any) => void): void;
export function open(onClosed?: (confirm: any) => void): void;
export function open(
	newMessage?: any,
	newTheme?: $$Props['theme'] | ((conf: any) => void),
	confirmHandler?: (conf: any) => void
) {
	if (typeof newMessage === 'function') {
		confirmHandler = newMessage;
		newMessage = undefined;
		newTheme = undefined;
	} else if (typeof newTheme === 'function') {
		confirmHandler = newTheme;
		newTheme = undefined;
	}

	store.update((s) => ({
		...s,
		visible: true,
		message: newMessage || s.message,
		theme: (newTheme as $$Props['theme']) || s.theme,
		onClosed: confirmHandler || s.onClosed
	}));
}

export function close(confirmed?: 1 | 0) {
	store.update((s) => ({ ...s, visible: false }));
	if (confirmable && $store.onClosed) $store.onClosed(confirmed || 0);
}
</script>

{#if $store.visible}
	<div class="absolute top-0 left-0 p-2 px-4 z-40 w-full">
		<div {...$$restProps} class="{wrapper}">
			<div class="flex">
				{#if icon}
					<div class="flex-shrink-0">
						{#if theme === 'info'}
							<svg class="{svg}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
									clip-rule="evenodd"></path>
							</svg>
						{:else if theme === 'danger'}
							<svg class="{svg}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
									clip-rule="evenodd"></path>
							</svg>
						{:else if theme === 'warning'}
							<svg class="{svg}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
									clip-rule="evenodd"></path>
							</svg>
						{:else if theme === 'success'}
							<svg class="{svg}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
									clip-rule="evenodd"></path>
							</svg>
						{:else}
							<svg class="{svg}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5"
								></path>
							</svg>
						{/if}
					</div>
				{/if}

				<div class="ml-3">
					<p class="{content}">
						<slot>
							{@html $store.message}
						</slot>
					</p>
				</div>

				{#if confirmable}
					<div class="ml-auto pl-3">
						<div class="-mx-1.5 -my-1.5 flex justify-between">
							<div class="mr-1">
								<button type="button" class="{button}" on:click="{() => close()}"> {cancelText} </button>
							</div>
							<div>
								<button type="button" class="{button}" on:click="{() => close(1)}"> {confirmText} </button>
							</div>
						</div>
					</div>
				{:else if dismissable}
					<div class="ml-auto pl-3">
						<div class="-mx-1.5 -my-1.5">
							<button type="button" class="{button}" on:click="{() => close()}">
								<span class="sr-only">Dismiss</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
									></path>
								</svg>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
