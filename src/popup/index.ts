import Popup from '../components/Popup.svelte';
import Storage from 'src/storage';
import '../styles.css';

const target = document.getElementById('app');

async function render() {
  let result = await Storage.get();
  await Storage.update({ active: false });
  new Popup({ target, props: { active: result.active, expanders: result.expanders, settings: result.settings } })
}

document.addEventListener('DOMContentLoaded', render);
