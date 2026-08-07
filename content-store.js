(() => {
  'use strict';

  const STORAGE_KEY = 'portfolioContentOverride';
  const DATA_URL = 'content.json';

  let defaultData = null;
  let currentData = null;

  function readOverride(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e){
      console.warn('Could not read saved edits, using original content.', e);
      return null;
    }
  }

  function writeOverride(data){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e){
      console.error('Could not save edits in this browser.', e);
      return false;
    }
  }

  function broadcast(){
    document.dispatchEvent(new CustomEvent('content:updated', { detail: currentData }));
  }

  async function load(){
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    defaultData = await res.json();
    const override = readOverride();
    currentData = override ? override : JSON.parse(JSON.stringify(defaultData));
    document.dispatchEvent(new CustomEvent('content:loaded', { detail: currentData }));
    return currentData;
  }

  function get(){
    return currentData;
  }

  function save(newData){
    currentData = newData;
    const ok = writeOverride(currentData);
    broadcast();
    return ok;
  }

  function exportFile(){
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importFile(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          save(parsed);
          resolve(parsed);
        } catch (e){
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function resetToDefault(){
    localStorage.removeItem(STORAGE_KEY);
    currentData = JSON.parse(JSON.stringify(defaultData));
    broadcast();
  }

  window.ContentStore = { load, get, save, exportFile, importFile, resetToDefault };
})();
