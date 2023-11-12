import Popup from '../components/Popup.svelte';
import Storage from 'src/storage';
import '../styles.css';

const target = document.getElementById('app');

async function render() {
  const storage = await Storage.get();
  await Storage.update({ active: false});
  new Popup({
    target,
    props: {}
  });
}

document.addEventListener('DOMContentLoaded', render);
