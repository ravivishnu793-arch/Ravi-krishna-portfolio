(() => {
  'use strict';

  function esc(str){
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function el(html){
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function flattenSkills(data){
    return (data.skillGroups || []).flatMap(g => g.items || []);
  }

  function renderHero(data){
    document.getElementById('heroName').textContent = data.hero.name;
    document.getElementById('heroRole').textContent = data.hero.role;
    document.getElementById('heroDesc').textContent = data.hero.desc;
    document.title = `${data.hero.name} — AI & Data Science`;
  }

  function renderSummary(data){
    document.getElementById('summaryText').textContent = data.summary;
  }

  function renderSkills(data){
    const wrap = document.getElementById('skillGroups');
    wrap.innerHTML = '';
    (data.skillGroups || []).forEach((group, gi) => {
      const groupEl = el(`
        <div class="skill-group">
          <h3 class="skill-group-title">${esc(group.title)}</h3>
          <ul class="tag-list" data-group="${gi}"></ul>
        </div>
      `);
      const list = groupEl.querySelector('.tag-list');
      (group.items || []).forEach((skill, si) => {
        const cls = group.variant === 'signal' ? 'tag tag-signal' : group.variant === 'teal' ? 'tag tag-teal' : 'tag';
        const tag = el(`
          <li class="${cls}" data-group="${gi}" data-index="${si}">
            <span class="tag-text">${esc(skill)}</span>
            <button type="button" class="tag-remove" aria-label="Remove ${esc(skill)}" hidden>&times;</button>
          </li>
        `);
        list.appendChild(tag);
      });
      wrap.appendChild(groupEl);
    });
  }

  function renderProjects(data){
    const wrap = document.getElementById('projectCards');
    wrap.innerHTML = '';
    (data.projects || []).forEach((p, i) => {
      const card = el(`
        <article class="card tilt" data-index="${i}">
          <div class="card-glow" aria-hidden="true"></div>
          <button type="button" class="item-remove" aria-label="Remove project" hidden>&times;</button>
          <p class="card-tag mono">${esc(p.tag)}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.desc)}</p>
          <ul class="card-stack mono">
            ${(p.stack || []).map(s => `<li>${esc(s)}</li>`).join('')}
          </ul>
        </article>
      `);
      wrap.appendChild(card);
    });
  }

  function renderTimeline(data){
    const wrap = document.getElementById('timelineList');
    wrap.innerHTML = '';
    (data.timeline || []).forEach((t, i) => {
      const item = el(`
        <li class="timeline-item" data-index="${i}">
          <div class="timeline-marker" aria-hidden="true"></div>
          <button type="button" class="item-remove" aria-label="Remove entry" hidden>&times;</button>
          <p class="timeline-date mono">${esc(t.date)}</p>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.desc)}</p>
        </li>
      `);
      wrap.appendChild(item);
    });
  }

  function renderSimpleList(containerId, items, kind){
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = '';
    (items || []).forEach((text, i) => {
      const li = el(`
        <li class="cert tilt" data-kind="${kind}" data-index="${i}">
          <span class="cert-dot"></span>
          <span class="cert-text">${esc(text)}</span>
          <button type="button" class="item-remove item-remove--inline" aria-label="Remove" hidden>&times;</button>
        </li>
      `);
      wrap.appendChild(li);
    });
  }

  function renderInterests(data){
    document.getElementById('interestsText').textContent = data.interests.text;
    document.getElementById('interestsLang').textContent = data.interests.languages;
  }

  function renderContact(data){
    const wrap = document.getElementById('contactGrid');
    const c = data.contact;
    wrap.innerHTML = `
      <a class="contact-item" href="mailto:${esc(c.email)}">
        <span class="contact-label mono">email</span>
        <span class="contact-value">${esc(c.email)}</span>
      </a>
      <a class="contact-item" href="tel:${esc((c.phone || '').replace(/\s+/g,''))}">
        <span class="contact-label mono">phone</span>
        <span class="contact-value">${esc(c.phone)}</span>
      </a>
      <div class="contact-item">
        <span class="contact-label mono">location</span>
        <span class="contact-value">${esc(c.location)}</span>
      </div>
    `;
  }

  function renderAll(data){
    renderHero(data);
    renderSummary(data);
    renderSkills(data);
    renderProjects(data);
    renderTimeline(data);
    renderSimpleList('certList', data.certificates, 'certificates');
    renderSimpleList('courseList', data.courses, 'courses');
    renderInterests(data);
    renderContact(data);

    document.dispatchEvent(new CustomEvent('content:rendered', {
      detail: { data, skillLabels: flattenSkills(data) }
    }));
  }

  window.PortfolioRender = { renderAll, flattenSkills, esc };

  document.addEventListener('content:loaded', (e) => renderAll(e.detail));
  document.addEventListener('content:updated', (e) => renderAll(e.detail));
})();
