(function () {
  "use strict";

  const items = Array.isArray(window.LINGUISTIC_ITEMS) ? window.LINGUISTIC_ITEMS : [];
  const list = document.getElementById("item-list");
  const detail = document.getElementById("item-detail");
  const statusFilters = document.getElementById("status-filters");
  const categorySelect = document.getElementById("category-select");
  const visibleCount = document.getElementById("visible-count");
  const noResults = document.getElementById("no-results");
  const menuButton = document.getElementById("menu-button");
  const sidebar = document.getElementById("sidebar");

  let activeStatus = "all";
  let activeCategory = "all";
  let selectedId = items[0] ? items[0].id : null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.append(option);
      });
  }

  function statusClass(status) {
    if (status === "持续追踪") return "status status--open";
    return "status status--review";
  }

  function renderList() {
    const visible = filteredItems();
    visibleCount.textContent = `${visible.length} 条`;
    noResults.hidden = visible.length !== 0;

    if (!visible.some((item) => item.id === selectedId)) {
      selectedId = visible[0] ? visible[0].id : null;
    }

    list.innerHTML = visible
      .map(
        (item) => `
          <button class="item-row ${item.id === selectedId ? "is-selected" : ""}" type="button" data-item-id="${escapeHtml(item.id)}">
            <span class="glyph-box ${item.glyph.length > 2 ? "glyph-box--text" : ""}" aria-hidden="true">${escapeHtml(item.glyph)}</span>
            <span class="item-row__body">
              <span class="item-row__meta">
                <span>${escapeHtml(item.id)}</span>
                <span>${escapeHtml(item.category)}</span>
                <span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span>
              </span>
              <span class="item-row__title">${escapeHtml(item.title)}</span>
              <span class="item-row__summary">${escapeHtml(item.summary)}</span>
              <span class="item-row__date">记录于 ${escapeHtml(item.date)}</span>
            </span>
          </button>
        `
      )
      .join("");

    list.querySelectorAll("[data-item-id]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedId = button.dataset.itemId;
        renderList();
        renderDetail();
        if (window.matchMedia("(max-width: 820px)").matches) {
          detail.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  function renderDetail() {
    const item = items.find((entry) => entry.id === selectedId);
    if (!item) {
      detail.innerHTML = '<p class="detail-empty">目前没有通过审核并公开的条目。</p>';
      return;
    }

    const sourceLink = item.sourceUrl
      ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">查看标准文档</a>`
      : "";

    detail.innerHTML = `
      <div class="detail-topline">
        <span>${escapeHtml(item.id)}</span>
        <span>${escapeHtml(item.date)}</span>
      </div>
      <div class="detail-title-row">
        <div class="detail-glyph ${item.glyph.length > 2 ? "detail-glyph--text" : ""}" aria-label="相关字符 ${escapeHtml(item.glyph)}">${escapeHtml(item.glyph)}</div>
        <div>
          <div class="detail-tags">
            <span>${escapeHtml(item.category)}</span>
            <span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="related-glyphs">相关：${escapeHtml(item.related)}</p>
        </div>
      </div>

      <section class="detail-section">
        <h3>问题</h3>
        <p class="question-text">${escapeHtml(item.question)}</p>
      </section>

      <section class="detail-section">
        <h3>讨论脉络</h3>
        <ol class="thread-list">
          ${item.thread
            .map(
              (step) => `
                <li>
                  <span>${escapeHtml(step.label)}</span>
                  <p>${escapeHtml(step.text)}</p>
                </li>
              `
            )
            .join("")}
        </ol>
      </section>

      <section class="finding-box">
        <div class="finding-box__label">我目前的判断</div>
        <p>${escapeHtml(item.provisional)}</p>
        <div class="review-flag"><span aria-hidden="true"></span>我已完成公开前审核</div>
      </section>

      <section class="detail-section detail-grid">
        <div>
          <h3>我还需要核对</h3>
          <ul class="plain-list">
            ${item.missing.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <h3>字符记录</h3>
          <dl class="character-record">
            <div><dt>记录方式</dt><dd>${escapeHtml(item.character.mode)}</dd></div>
            <div><dt>码位</dt><dd>${escapeHtml(item.character.codepoint)}</dd></div>
            <div><dt>IDS</dt><dd>${escapeHtml(item.character.ids)}</dd></div>
          </dl>
          <p class="record-note">${escapeHtml(item.character.note)}</p>
        </div>
      </section>

      <section class="detail-section sources-section">
        <h3>资料线索</h3>
        <ul class="source-list">
          ${item.sources.map((source) => `<li>${escapeHtml(source)}</li>`).join("")}
        </ul>
        ${sourceLink}
      </section>
    `;
  }

  function renderRoute() {
    const requested = window.location.hash.replace("#", "") || "tracking";
    const route = ["home", "database", "tracking"].includes(requested) ? requested : "tracking";

    document.querySelectorAll("[data-view]").forEach((view) => {
      view.hidden = view.dataset.view !== route;
    });
    document.querySelectorAll("[data-route]").forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
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

  categorySelect.addEventListener("change", () => {
    activeCategory = categorySelect.value;
    renderList();
    renderDetail();
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
  renderRoute();
})();
