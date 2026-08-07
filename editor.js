(() => {
  'use strict';

  const body = document.body;
  const editToggle = document.getElementById('editToggle');
  const editToggleLabel = document.getElementById('editToggleLabel');
  const dataPanel = document.getElementById('dataPanel');
  const modal = document.getElementById('editModal');
  const modalTitle = document.getElementById('editModalTitle');
  const modalForm = document.getElementById('editModalForm');
  const modalClose = document.getElementById('editModalClose');

  let editMode = false;

  /* ============================================
     EDIT MODE ON/OFF
     ============================================ */
  function applyEditVisibility(){
    document.querySelectorAll('.edit-field-btn, .item-remove, .tag-remove')
      .forEach(elm => { elm.hidden = !editMode; });
  }

  function setEditMode(on){
    editMode = on;
    body.classList.toggle('edit-mode', editMode);
    editToggle.setAttribute('aria-pressed', String(editMode));
    editToggleLabel.textContent = editMode ? 'Done' : 'Edit';
    dataPanel.hidden = !editMode;
    applyEditVisibility();
  }

  editToggle.addEventListener('click', () => setEditMode(!editMode));

  // Re-apply visibility after every re-render (edit mode persists across saves)
  document.addEventListener('content:rendered', applyEditVisibility);

  /* ============================================
     MODAL HELPERS
     ============================================ */
  function closeModal(){
    modal.hidden = true;
    modalForm.onsubmit = null;
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function buildField(label, name, value = '', opts = {}){
    const wrap = document.createElement('label');
    wrap.className = 'edit-field-label';
    wrap.textContent = label;
    const control = opts.textarea ? document.createElement('textarea') : document.createElement('input');
    if (!opts.textarea) control.type = opts.type || 'text';
    if (opts.textarea) control.rows = opts.rows || 4;
    control.name = name;
    control.value = value;
    if (opts.required !== false) control.required = true;
    if (opts.placeholder) control.placeholder = opts.placeholder;
    wrap.appendChild(control);
    return wrap;
  }

  function openFormModal(title, fieldsSpec, onSubmit){
    modalTitle.textContent = title;
    modalForm.innerHTML = '';
    fieldsSpec.forEach(spec => {
      modalForm.appendChild(buildField(spec.label, spec.name, spec.value, spec));
    });
    const actions = document.createElement('div');
    actions.className = 'edit-modal-actions';
    actions.innerHTML = `
      <button type="button" class="btn btn-text btn-small" id="modalCancel">Cancel</button>
      <button type="submit" class="btn btn-primary btn-small">Save</button>
    `;
    modalForm.appendChild(actions);
    modal.hidden = false;
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(modalForm);
      const values = {};
      fieldsSpec.forEach(spec => { values[spec.name] = fd.get(spec.name); });
      onSubmit(values);
      closeModal();
    };
    modalForm.querySelector('#modalCancel').addEventListener('click', closeModal);
    const firstInput = modalForm.querySelector('input, textarea, select');
    if (firstInput) firstInput.focus();
  }

  /* ============================================
     DATA MUTATIONS
     ============================================ */
  function currentData(){
    return JSON.parse(JSON.stringify(window.ContentStore.get()));
  }

  function persist(data){
    window.ContentStore.save(data);
  }

  /* ============================================
     ADD ACTIONS — triggered by section "+ Add" buttons
     ============================================ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.edit-field-btn');
    if (!btn) return;
    const type = btn.dataset.edit;
    const data = currentData();

    if (type === 'summary'){
      openFormModal('Edit summary', [
        { label: 'Summary', name: 'text', value: data.summary, textarea: true, rows: 5 }
      ], (v) => { data.summary = v.text; persist(data); });
    }

    else if (type === 'interests'){
      openFormModal('Edit interests', [
        { label: 'Text', name: 'text', value: data.interests.text, textarea: true, rows: 4 },
        { label: 'Languages', name: 'languages', value: data.interests.languages }
      ], (v) => { data.interests = { text: v.text, languages: v.languages }; persist(data); });
    }

    else if (type === 'contact'){
      openFormModal('Edit contact details', [
        { label: 'Email', name: 'email', value: data.contact.email, type: 'email' },
        { label: 'Phone', name: 'phone', value: data.contact.phone },
        { label: 'Location', name: 'location', value: data.contact.location }
      ], (v) => { data.contact = v; persist(data); });
    }

    else if (type === 'skills'){
      const groupNames = data.skillGroups.map(g => g.title);
      openFormModal('Add a skill', [
        { label: `Group (existing: ${groupNames.join(', ')}, or type a new one)`, name: 'group', value: groupNames[0] || 'Core' },
        { label: 'Skill name', name: 'skill', value: '' }
      ], (v) => {
        let group = data.skillGroups.find(g => g.title.toLowerCase() === v.group.trim().toLowerCase());
        if (!group){
          group = { title: v.group.trim(), variant: 'plain', items: [] };
          data.skillGroups.push(group);
        }
        group.items.push(v.skill.trim());
        persist(data);
      });
    }

    else if (type === 'project'){
      openFormModal('Add a project', [
        { label: 'Category tag (e.g. forecasting)', name: 'tag', value: '' },
        { label: 'Title', name: 'title', value: '' },
        { label: 'Description', name: 'desc', value: '', textarea: true },
        { label: 'Tech stack (comma-separated)', name: 'stack', value: '' }
      ], (v) => {
        data.projects.push({
          tag: v.tag.trim(),
          title: v.title.trim(),
          desc: v.desc.trim(),
          stack: v.stack.split(',').map(s => s.trim()).filter(Boolean)
        });
        persist(data);
      });
    }

    else if (type === 'timeline'){
      openFormModal('Add a timeline entry', [
        { label: 'Date / range', name: 'date', value: '' },
        { label: 'Title', name: 'title', value: '' },
        { label: 'Description', name: 'desc', value: '', textarea: true, required: false }
      ], (v) => {
        data.timeline.unshift({ date: v.date.trim(), title: v.title.trim(), desc: (v.desc || '').trim() });
        persist(data);
      });
    }

    else if (type === 'certificates' || type === 'courses'){
      const label = type === 'certificates' ? 'Add a certificate' : 'Add a course';
      openFormModal(label, [
        { label: 'Name', name: 'text', value: '' }
      ], (v) => {
        data[type].push(v.text.trim());
        persist(data);
      });
    }
  });

  /* ============================================
     DELETE ACTIONS — event delegation
     ============================================ */
  document.addEventListener('click', (e) => {
    // remove a skill tag
    const tagRemove = e.target.closest('.tag-remove');
    if (tagRemove){
      const li = tagRemove.closest('li[data-group]');
      const gi = Number(li.dataset.group);
      const si = Number(li.dataset.index);
      const data = currentData();
      data.skillGroups[gi].items.splice(si, 1);
      if (data.skillGroups[gi].items.length === 0) data.skillGroups.splice(gi, 1);
      persist(data);
      return;
    }

    // remove a project or timeline entry
    const itemRemove = e.target.closest('.item-remove');
    if (itemRemove){
      const card = itemRemove.closest('[data-index]');
      const i = Number(card.dataset.index);
      const data = currentData();
      if (card.classList.contains('card')) data.projects.splice(i, 1);
      else if (card.classList.contains('timeline-item')) data.timeline.splice(i, 1);
      else if (card.dataset.kind === 'certificates') data.certificates.splice(i, 1);
      else if (card.dataset.kind === 'courses') data.courses.splice(i, 1);
      persist(data);
      return;
    }
  });

  /* ============================================
     DATA PANEL — export / import / reset
     ============================================ */
  document.getElementById('exportBtn').addEventListener('click', () => {
    window.ContentStore.exportFile();
  });

  document.getElementById('importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await window.ContentStore.importFile(file);
    } catch (err){
      alert('That file could not be read. Make sure it is a content.json exported from this page.');
    }
    e.target.value = '';
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all edits made in this browser and go back to the original content?')){
      window.ContentStore.resetToDefault();
    }
  });
})();
