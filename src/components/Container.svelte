<script lang="ts">
import themer from 'src/themer';
import Footer from './Footer.svelte';
import Header from './Header.svelte';
import type { ElementProps } from 'src/types';

type $$Props = ElementProps<'div'> & {
	active?: boolean;
	width?: number;
};

export let { active, width } = {
	active: false,
	width: 500
} as Required<$$Props>;

$: classes = themer().add('p-4 mb-8', true).append($$restProps.class, $$restProps.class).compile();
</script>

<div>
	<Header />
	<div {...$$restProps} class="{classes}" style="{'min-width: ' + width + 'px'}">
		<slot />
	</div>
	<Footer />
</div>
