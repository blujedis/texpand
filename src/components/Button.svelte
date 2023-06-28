<script lang="ts">
import type { ElementProps } from 'src/types';
import themer from '../themer';

type $$Props = ElementProps<'button'> & {
	icon?: 'save' | 'delete' | 'edit' | 'export' | 'import' | 'cancel' | 'add' | null;
	theme?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
	variant?: 'default' | 'link' | 'icon';
};

export let { icon, theme, variant } = {
	icon: null,
	theme: 'default',
	variant: 'default'
} as Required<$$Props>;

const variants = {
	default: {
		default: 'focus-visible:outline-slate-300 bg-slate-200 hover:bg-slate-300 text-slate-700',
		primary: 'focus-visible:outline-indigo-600 bg-indigo-600 hover:bg-indigo-500',
		warning: 'focus-visible:outline-amber-600 bg-amber-600 hover:bg-amber-500',
		danger: 'focus-visible:outline-rose-600  bg-rose-600 hover:bg-rose-500',
		success: 'focus-visible:outline-emerald-600  bg-emerald-600 hover:bg-emerald-500'
	},
	link: {
		default: 'focus-visible:outline-slate-300 text-slate-600 hover:text-slate-700',
		primary: 'focus-visible:outline-indigo-600 text-indigo-600 hover:text-indigo-700',
		warning: 'focus-visible:outline-amber-600 text-amber-600 hover:text-amber-700',
		danger: 'focus-visible:outline-rose-600 text-rose-600 hover:text-rose-700',
		success: 'focus-visible:outline-emerald-600 text-emerald-600 hover:text-emerald-700'
	},
	icon: {
		default: 'focus-visible:outline-slate-300 text-slate-600 hover:text-slate-700',
		primary: 'focus-visible:outline-indigo-600 text-indigo-600 hover:text-indigo-700',
		warning: 'focus-visible:outline-amber-600 text-amber-600 hover:text-amber-700',
		danger: 'focus-visible:outline-rose-600 text-rose-600 hover:text-rose-700',
		success: 'focus-visible:outline-emerald-600 text-emerald-600 hover:text-emerald-700'
	}
};

$: classes = themer()
	.add(
		'inline-flex items-center text-xs font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm min-h-[32px]',
		true
	)
	.add(variants[variant][theme], true)
	.add('text-white', theme !== 'default' && !['link', 'icon'].includes(variant))
	.add('gap-x-1.5 px-2.5 py-1.5', !['link', 'icon'].includes(variant))
	.add('underline', variant === 'link')
	.add('p-1 rounded-full focus-visible:outline-offset-0', variant === 'icon')
	.append($$restProps.class, $$restProps.class)
	.compile();

$: iconClasses = themer().add('h-5 w-5', true).add('-ml-0.5', $$slots.default).compile();
</script>

<button type="button" class="{classes}" on:click>
	{#if icon && variant !== 'link'}
		{#if icon === 'save'}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" class="{iconClasses}"
				><path
					fill="currentColor"
					d="M3 5a2 2 0 0 1 2-2h8.379a2 2 0 0 1 1.414.586l1.621 1.621A2 2 0 0 1 17 6.621V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm2-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1v-4.5A1.5 1.5 0 0 1 6.5 10h7a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 0 1-1V6.621a1 1 0 0 0-.293-.707l-1.621-1.621A1 1 0 0 0 13.379 4H13v2.5A1.5 1.5 0 0 1 11.5 8h-4A1.5 1.5 0 0 1 6 6.5V4H5Zm2 0v2.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V4H7Zm7 12v-4.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5V16h8Z"
				></path
				></svg>
		{:else if icon === 'add'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="{iconClasses}">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
			</svg>
		{:else if icon === 'delete'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="{iconClasses}">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
		{:else if icon === 'cancel'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				class="{iconClasses}"
				><path
					fill="currentColor"
					d="M11.5 22C6.26 22 2 17.75 2 12.5A9.5 9.5 0 0 1 11.5 3a9.5 9.5 0 0 1 9.5 9.5a9.5 9.5 0 0 1-9.5 9.5m0-1a8.5 8.5 0 0 0 8.5-8.5c0-2.17-.81-4.15-2.14-5.65l-12.01 12A8.468 8.468 0 0 0 11.5 21m0-17A8.5 8.5 0 0 0 3 12.5c0 2.17.81 4.14 2.15 5.64l12-12A8.49 8.49 0 0 0 11.5 4Z"
				></path
				></svg>
		{:else if icon === 'export'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="{iconClasses}">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
				></path>
			</svg>
		{:else if icon === 'import'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="{iconClasses}">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
				></path>
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="{iconClasses}">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
				></path>
			</svg>
		{/if}
	{/if}
	<slot />
</button>
