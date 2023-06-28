import Options from '../components/Options.svelte';
// import { storage } from 'src/storage';
import '../styles.css';

const target = document.getElementById('app');

function render() {
    // storage.get().then(({ count }) => {
        new Options({ target, props: {  } });
    // });
}

document.addEventListener('DOMContentLoaded', render);
