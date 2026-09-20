(function () {
  "use strict";

  const items = Array.isArray(window.LINGUISTIC_ITEMS) ? window.LINGUISTIC_ITEMS : [];
  const characters = Array.isArray(window.CHARACTER_DATABASE) ? window.CHARACTER_DATABASE : [];
  const list = document.getElementById("item-list");
  const detail = document.getElementById("item-detail");
  const statusFilters = document.getElementById("status-filters");
  const categorySelect = document.getElementById("category-select");
  const visibleCount = document.getElementById("visible-count");
  const noResults = document.getElementById("no-results");
  const menuButton = document.getElementById("menu-button");
  const sidebar = document.getElementById("sidebar");
  const databaseSearch = document.getElementById("database-search");
  const databaseRandom = document.getElementById("database-random");
  const characterList = document.getElementById("character-list");
  const characterDetail = document.getElementById("character-detail");
  const databaseNoResults = document.getElementById("database-no-results");
  const databaseVisibleCount = document.getElementById("database-visible-count");

  const STATUS_LABELS = { "持续追踪": "Ongoing", "已整理": "Reviewed" };
  const CATEGORY_LABELS = {
    "字源与字形": "Etymology & graph forms",
    "字书与校勘": "Dictionaries & textual criticism",
    "编码与标准": "Encoding & standards",
    "IDS 与字库": "IDS & fonts",
    "数据库方法": "Database methods",
    "音韵与读音": "Phonology & readings",
    "词义与词源": "Lexical meaning & etymology",
    "地名与专名": "Place names & proper names",
    "其他问题": "Other questions",
  };
  const THREAD_LABELS = {
    "我注意到": "Observation",
    "我目前认为": "Current reading",
    "我继续推测": "Working hypotheses",
    "我接下来需要": "Next checks",
  };

  let activeStatus = "all";
  let activeCategory = "all";
  let selectedId = items[0] ? items[0].id : null;
  let selectedCharacterId = characters[0] ? characters[0].id : null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function trustedHttpUrl(value) {
    try {
      const url = new URL(String(value));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function categoryLabel(value) {
    return CATEGORY_LABELS[value] || value || "Uncategorised";
  }

  function statusLabel(value) {
    return STATUS_LABELS[value] || value || "Ongoing";
  }

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return String(value || "Unspecified");
    const date = new Date(`${value}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  }

  function filteredItems() {
    return items.filter((item) => {
      const statusMatch = activeStatus === "all" || item.status === activeStatus;
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;
      return statusMatch && categoryMatch;
    });
  }

  function renderCounts() {
    document.getElementById("count-all").textContent = items.length;
    document.getElementById("count-open").textContent = items.filter((item) => item.status === "持续追踪").length;
    document.getElementById("count-review").textContent = items.filter((item) => item.status === "已整理").length;
  }

  function populateCategories() {
    [...new Set(items.map((item) => item.category))]
      .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "en"))
      .forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = categoryLabel(category);
        categorySelect.append(option);
      });
  }

  function statusClass(status) {
    return status === "持续追踪" ? "status status--open" : "status status--review";
  }

  function renderList() {
    const visible = filteredItems();
    visibleCount.textContent = `${visible.length} ${visible.length === 1 ? "entry" : "entries"}`;
    noResults.hidden = visible.length !== 0;
    if (!visible.some((item) => item.id === selectedId)) selectedId = visible[0]?.id || null;

    list.innerHTML = visible.map((item) => {
      const added = item.created_at || item.date;
      const updated = item.updated_at || item.date;
      return `
        <button class="item-row ${item.id === selectedId ? "is-selected" : ""}" type="button" data-item-id="${escapeHtml(item.id)}">
          <span class="glyph-box ${item.glyph.length > 2 ? "glyph-box--text" : ""}" aria-hidden="true">${escapeHtml(item.glyph)}</span>
          <span class="item-row__body">
            <span class="item-row__meta"><span>${escapeHtml(item.id)}</span><span>${escapeHtml(categoryLabel(item.category))}</span><span class="${statusClass(item.status)}">${escapeHtml(statusLabel(item.status))}</span></span>
            <span class="item-row__title" lang="zh-Hans">${escapeHtml(item.title)}</span>
            <span class="item-row__summary" lang="zh-Hans">${escapeHtml(item.summary)}</span>
            <span class="item-row__date">Added ${escapeHtml(formatDate(added))} · Updated ${escapeHtml(formatDate(updated))}</span>
          </span>
        </button>`;
    }).join("");

    list.querySelectorAll("[data-item-id]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedId = button.dataset.itemId;
        renderList();
        renderDetail();
        if (window.matchMedia("(max-width: 820px)").matches) detail.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderDetail() {
    const item = items.find((entry) => entry.id === selectedId);
    if (!item) {
      detail.innerHTML = '<p class="detail-empty">No research entry is available.</p>';
      return;
    }
    const sourceUrl = trustedHttpUrl(item.sourceUrl);
    const sourceLink = sourceUrl ? `<a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Open source document</a>` : "";
    const added = item.created_at || item.date;
    const updated = item.updated_at || item.date;
    detail.innerHTML = `
      <div class="detail-topline"><span>${escapeHtml(item.id)}</span><span>Added ${escapeHtml(formatDate(added))} · Updated ${escapeHtml(formatDate(updated))}</span></div>
      <div class="detail-title-row">
        <div class="detail-glyph ${item.glyph.length > 2 ? "detail-glyph--text" : ""}" aria-label="Related character ${escapeHtml(item.glyph)}">${escapeHtml(item.glyph)}</div>
        <div><div class="detail-tags"><span>${escapeHtml(categoryLabel(item.category))}</span><span class="${statusClass(item.status)}">${escapeHtml(statusLabel(item.status))}</span></div><h2 lang="zh-Hans">${escapeHtml(item.title)}</h2><p class="related-glyphs">Related forms: <span lang="zh-Hans">${escapeHtml(item.related)}</span></p></div>
      </div>
      <section class="detail-section"><h3>Question</h3><p class="question-text" lang="zh-Hans">${escapeHtml(item.question)}</p></section>
      <section class="detail-section"><h3>Research path</h3><ol class="thread-list">${item.thread.map((step) => `<li><span>${escapeHtml(THREAD_LABELS[step.label] || step.label)}</span><p lang="zh-Hans">${escapeHtml(step.text)}</p></li>`).join("")}</ol></section>
      <section class="finding-box"><div class="finding-box__label">Current position</div><p lang="zh-Hans">${escapeHtml(item.provisional)}</p></section>
      <section class="detail-section detail-grid">
        <div><h3>Next checks</h3><ul class="plain-list" lang="zh-Hans">${item.missing.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul></div>
        <div><h3>Character record</h3><dl class="character-record"><div><dt>Method</dt><dd lang="zh-Hans">${escapeHtml(item.character.mode)}</dd></div><div><dt>Code point</dt><dd>${escapeHtml(item.character.codepoint)}</dd></div><div><dt>IDS</dt><dd lang="zh-Hans">${escapeHtml(item.character.ids)}</dd></div></dl><p class="record-note" lang="zh-Hans">${escapeHtml(item.character.note)}</p></div>
      </section>
      <section class="detail-section sources-section"><h3>Source trail</h3><ul class="source-list" lang="zh-Hans">${item.sources.map((source) => `<li>${escapeHtml(source)}</li>`).join("")}</ul>${sourceLink}</section>`;
  }

  function searchableCharacterText(entry) {
    return [entry.character, ...(entry.aliases || []), entry.unicode, entry.title_english, entry.summary_english]
      .join(" ")
      .toLocaleLowerCase();
  }

  function unicodeNeighbours(query, limit = 6) {
    const han = Array.from(query).find((value) => /\p{Script=Han}/u.test(value));
    if (!han) return [];
    const target = han.codePointAt(0);
    return [...characters]
      .map((entry, index) => ({ entry, index, distance: Math.abs((Array.from(entry.character)[0]?.codePointAt(0) || 0) - target) }))
      .sort((left, right) => left.distance - right.distance || left.index - right.index)
      .slice(0, limit)
      .map(({ entry }) => entry);
  }

  function characterSearchState() {
    const rawQuery = databaseSearch.value.trim();
    const query = rawQuery.toLocaleLowerCase();
    if (!query) return { entries: characters, mode: "all", rawQuery, fallbackQuery: "" };

    const exact = characters.filter((entry) => searchableCharacterText(entry).includes(query));
    if (exact.length) return { entries: exact, mode: "exact", rawQuery, fallbackQuery: "" };

    if (/\p{Script=Han}/u.test(rawQuery)) {
      return { entries: unicodeNeighbours(rawQuery), mode: "unicode", rawQuery, fallbackQuery: "" };
    }

    if (/^[a-z]+(?:[\s'-][a-z]+)*$/i.test(rawQuery)) {
      for (let length = query.length - 1; length >= 3; length -= 1) {
        const fallbackQuery = query.slice(0, length).trimEnd();
        if (fallbackQuery.length < 3) break;
        const fallback = characters.filter((entry) => searchableCharacterText(entry).includes(fallbackQuery));
        if (fallback.length) return { entries: fallback, mode: "truncated", rawQuery, fallbackQuery };
      }
    }

    return { entries: [], mode: "none", rawQuery, fallbackQuery: "" };
  }

  function renderDatabaseCounts() {
    document.getElementById("database-count").textContent = characters.length;
    document.getElementById("database-graph-count").textContent = characters.reduce((total, entry) => total + (entry.forms?.kinship_graphs?.length || 0), 0);
    document.getElementById("database-image-count").textContent = characters.reduce((total, entry) => total + (entry.forms?.evolution?.length || 0), 0);
  }

  function renderCharacterList() {
    const state = characterSearchState();
    const visible = state.entries;
    const isSuggestion = state.mode === "unicode" || state.mode === "truncated";
    databaseVisibleCount.textContent = isSuggestion
      ? `0 exact · ${visible.length} suggested`
      : `${visible.length} ${visible.length === 1 ? "record" : "records"}`;
    databaseNoResults.hidden = !["unicode", "truncated", "none"].includes(state.mode);
    if (state.mode === "unicode") {
      databaseNoResults.textContent = `No exact matches for “${state.rawQuery}”. Nearby Unicode records:`;
    } else if (state.mode === "truncated") {
      databaseNoResults.textContent = `No exact matches for “${state.rawQuery}”. Showing results for “${state.fallbackQuery}”:`;
    } else if (state.mode === "none") {
      databaseNoResults.textContent = `No exact matches for “${state.rawQuery}”.`;
    }
    if (!visible.some((entry) => entry.id === selectedCharacterId)) {
      selectedCharacterId = visible[0]?.id || null;
    }
    characterList.innerHTML = visible.map((entry) => `
      <button class="character-row ${entry.id === selectedCharacterId ? "is-selected" : ""}" type="button" data-character-id="${escapeHtml(entry.id)}">
        <span class="character-row__glyph" lang="zh-Hans">${escapeHtml(entry.character)}</span>
        <span><strong>${escapeHtml(entry.title_english)}</strong><small>${escapeHtml(entry.unicode)}</small></span>
      </button>`).join("");
    characterList.querySelectorAll("[data-character-id]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedCharacterId = button.dataset.characterId;
        renderCharacterList();
        renderCharacterDetail();
      });
    });
  }

  function renderCharacterDetail() {
    const entry = characters.find((value) => value.id === selectedCharacterId);
    if (!entry) {
      characterDetail.innerHTML = '<p class="detail-empty">No character record is available.</p>';
      return;
    }
    const graphs = entry.forms?.kinship_graphs || [];
    const graph = graphs[0];
    const evolution = entry.forms?.evolution || [];
    const etymology = entry.etymology || {};
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    const query = databaseSearch.value.trim();
    const redirectedQuery = aliases.includes(query) ? query : "";
    characterDetail.innerHTML = `
      <header class="character-record-header">
        <div class="character-record-glyph" lang="zh-Hans">${escapeHtml(entry.character)}</div>
        <div><p class="record-kicker">${escapeHtml(entry.unicode)}</p><h2>${escapeHtml(entry.title_english)}</h2><p>${escapeHtml(entry.summary_english)}</p>${redirectedQuery ? `<p class="source-note">The requested form <span lang="zh-Hans">${escapeHtml(redirectedQuery)}</span> refers to this entry for <span lang="zh-Hans">${escapeHtml(entry.character)}</span>.</p>` : aliases.length ? `<p class="source-note">Referenced from: <span lang="zh-Hans">${escapeHtml(aliases.join(" · "))}</span></p>` : ""}</div>
      </header>

      <section class="database-section" id="kinship">
        <div class="section-heading"><div><p class="eyebrow">VARIANT RELATIONS</p><h3>Kinship diagram of variants <span lang="zh-Hant">異體字圖譜</span></h3></div><p>${escapeHtml(graph?.forms?.length || 0)} rendered forms</p></div>
        ${graph ? `<div class="graph-caption"><strong lang="zh-Hans">${escapeHtml(graph.label)}</strong>${graph.gloss ? `<span lang="zh-Hans">${escapeHtml(graph.gloss)}</span>` : ""}</div><div class="kinship-graph">${graph.svg}</div>` : '<p class="database-empty">No graph was returned for this entry.</p>'}
        <p class="source-note">The diagram preserves a single default relationship view. Unencoded and font-missing forms use bundled SVG paths; blue and red arrows retain the recorded relationship directions.</p>
      </section>

      <section class="database-section" id="etymology">
        <div class="section-heading"><div><p class="eyebrow">ETYMOLOGY</p><h3>Etymological account</h3></div><p lang="zh-Hans">${escapeHtml(etymology.pronunciation || "")}</p></div>
        <div class="etymology-reading">${(etymology.explanation_english || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("") || '<p>English editorial reading pending.</p>'}</div>
        ${(etymology.bibliography || []).length ? `<div class="source-bibliography"><h4>References in the entry</h4><ul lang="zh-Hans">${etymology.bibliography.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></div>` : ""}
        ${etymology.explanation_original ? `<details class="source-transcription"><summary>Chinese transcription (images omitted)</summary><p lang="zh-Hans">${escapeHtml(etymology.explanation_original)}</p></details>` : ""}
      </section>

      <section class="database-section" id="evolution">
        <div class="section-heading"><div><p class="eyebrow">HISTORICAL FORMS</p><h3>Evolution <span lang="zh-Hant">字形演化</span></h3></div><p>${evolution.length} images</p></div>
        <div class="evolution-grid">${evolution.map((form) => `
          <figure class="evolution-card">
            <div class="evolution-image"><img src="${escapeHtml(form.image)}" alt="${escapeHtml(entry.character)} — ${escapeHtml(form.dynasty)} ${escapeHtml(form.script)} form from ${escapeHtml(form.source)}" loading="lazy" /></div>
            <figcaption><strong lang="zh-Hant">${escapeHtml(form.dynasty || "Undated")} · ${escapeHtml(form.script || "Unclassified")}</strong><span lang="zh-Hant">${escapeHtml(form.source || "Source not named")}</span><small>${escapeHtml(form.catalogue_id)}</small></figcaption>
          </figure>`).join("")}</div>
      </section>`;

  }

  function renderRoute() {
    const requested = window.location.hash.replace("#", "") || "database";
    const route = ["home", "database", "tracking"].includes(requested) ? requested : "database";
    document.querySelectorAll("[data-view]").forEach((view) => { view.hidden = view.dataset.view !== route; });
    document.querySelectorAll("[data-route]").forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    sidebar.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  statusFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeStatus = button.dataset.filter;
    statusFilters.querySelectorAll("[data-filter]").forEach((entry) => entry.classList.toggle("is-active", entry === button));
    renderList();
    renderDetail();
  });
  categorySelect.addEventListener("change", () => { activeCategory = categorySelect.value; renderList(); renderDetail(); });
  databaseSearch.addEventListener("input", () => { renderCharacterList(); renderCharacterDetail(); });
  databaseRandom.addEventListener("click", () => {
    if (!characters.length) return;
    databaseSearch.value = "";
    selectedCharacterId = characters[Math.floor(Math.random() * characters.length)].id;
    renderCharacterList();
    renderCharacterDetail();
    if (window.matchMedia("(max-width: 820px)").matches) characterDetail.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  menuButton.addEventListener("click", () => {
    const open = sidebar.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  window.addEventListener("hashchange", renderRoute);

  populateCategories();
  renderCounts();
  renderList();
  renderDetail();
  renderDatabaseCounts();
  renderCharacterList();
  renderCharacterDetail();
  renderRoute();
})();
