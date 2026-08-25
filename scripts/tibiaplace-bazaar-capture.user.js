// ==UserScript==
// @name         TibiaPlace — Capturar JSON do Bazaar
// @namespace    https://github.com/jandrey/tibiaplace
// @version      1.0.0
// @description  Cola a URL do bazaar RubinOT e captura o JSON da API para importar no TibiaPlace.
// @author       TibiaPlace
// @match        https://rubinot.com.br/*
// @match        https://www.rubinot.com.br/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const PANEL_ID = "tp-bazaar-capture-panel";
  const STORAGE_KEY = "tp-bazaar-last-json";

  function parseBazaarId(input) {
    const trimmed = (input || "").trim();
    if (!trimmed) return null;
    const match = trimmed.match(/bazaar\/(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  function bazaarApiUrl(id) {
    return `https://rubinot.com.br/api/bazaar/${id}`;
  }

  function bazaarPageUrl(id) {
    return `https://rubinot.com.br/bazaar/${id}`;
  }

  async function fetchBazaarJson(bazaarId) {
    const res = await fetch(bazaarApiUrl(bazaarId), {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        Referer: bazaarPageUrl(bazaarId),
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        res.ok
          ? "Resposta não é JSON válido (Cloudflare ou HTML)."
          : `HTTP ${res.status}: resposta inválida.`,
      );
    }

    if (data?.error) {
      throw new Error(
        data.error === "Access denied"
          ? "Access denied — faça login no RubinOT e abra a página do char antes."
          : `RubinOT: ${data.error}`,
      );
    }

    if (!data?.player?.name || !data?.auction?.id) {
      throw new Error("JSON incompleto (falta player ou auction).");
    }

    if (data.auction.id !== bazaarId) {
      throw new Error(
        `ID divergente: esperado ${bazaarId}, veio ${data.auction.id}.`,
      );
    }

    return data;
  }

  function copyText(text) {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text);
      return Promise.resolve();
    }
    return navigator.clipboard.writeText(text);
  }

  /** Intercepta fetch da página do bazaar e guarda o último JSON capturado. */
  function installFetchHook() {
    const original = window.fetch.bind(window);
    window.fetch = async function (...args) {
      const response = await original(...args);
      try {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : "";
        const match = url.match(/\/api\/bazaar\/(\d+)/);
        if (match && response.ok) {
          const clone = response.clone();
          clone
            .json()
            .then((data) => {
              if (data?.player?.name && data?.auction?.id) {
                sessionStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(data, null, 2),
                );
                const id = data.auction.id;
                const btn = document.getElementById("tp-bazaar-capture-btn");
                if (btn) {
                  btn.title = `Último JSON capturado: ${data.player.name} (#${id})`;
                }
              }
            })
            .catch(() => {});
        }
      } catch {
        /* ignore hook errors */
      }
      return response;
    };
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const pathMatch = location.pathname.match(/\/bazaar\/(\d+)/);
    const defaultUrl = pathMatch
      ? bazaarPageUrl(Number.parseInt(pathMatch[1], 10))
      : "";

    const wrap = document.createElement("div");
    wrap.id = PANEL_ID;
    wrap.innerHTML = `
      <div class="tp-bc-header">
        <strong>TibiaPlace — Bazaar JSON</strong>
        <button type="button" class="tp-bc-close" title="Fechar">×</button>
      </div>
      <p class="tp-bc-hint">Cole a URL do bazaar (logado no RubinOT). O script busca <code>/api/bazaar/ID</code> com sua sessão.</p>
      <label class="tp-bc-label">URL do bazaar</label>
      <input class="tp-bc-input" type="url" placeholder="https://rubinot.com.br/bazaar/271119" value="${defaultUrl}" />
      <div class="tp-bc-actions">
        <button type="button" class="tp-bc-btn tp-bc-primary">Capturar JSON</button>
        <button type="button" class="tp-bc-btn tp-bc-secondary">Usar último da página</button>
        <button type="button" class="tp-bc-btn tp-bc-secondary">Copiar JSON</button>
      </div>
      <p class="tp-bc-status" aria-live="polite"></p>
      <textarea class="tp-bc-output" rows="12" placeholder="O JSON aparece aqui…" spellcheck="false"></textarea>
      <p class="tp-bc-foot">No TibiaPlace: Novo anúncio → Colar JSON capturado.</p>
    `;

    document.body.appendChild(wrap);

    const input = wrap.querySelector(".tp-bc-input");
    const output = wrap.querySelector(".tp-bc-output");
    const status = wrap.querySelector(".tp-bc-status");
    const btnCapture = wrap.querySelector(".tp-bc-primary");
    const btnLast = wrap.querySelectorAll(".tp-bc-secondary")[0];
    const btnCopy = wrap.querySelectorAll(".tp-bc-secondary")[1];

    function setStatus(msg, type = "") {
      status.textContent = msg;
      status.className = `tp-bc-status${type ? ` tp-bc-${type}` : ""}`;
    }

    async function captureFromUrl() {
      const id = parseBazaarId(input.value);
      if (!id) {
        setStatus("URL inválida. Use …/bazaar/271119", "error");
        return;
      }
      setStatus("Buscando…");
      btnCapture.disabled = true;
      try {
        const data = await fetchBazaarJson(id);
        const json = JSON.stringify(data, null, 2);
        output.value = json;
        sessionStorage.setItem(STORAGE_KEY, json);
        setStatus(
          `OK — ${data.player.name} (Lv ${data.player.level} ${data.player.vocationName})`,
          "ok",
        );
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : "Erro ao capturar",
          "error",
        );
      } finally {
        btnCapture.disabled = false;
      }
    }

    function loadLastFromPage() {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (!cached) {
        setStatus(
          "Nada capturado ainda. Abra a página do bazaar ou clique em Capturar.",
          "error",
        );
        return;
      }
      output.value = cached;
      setStatus("JSON recuperado da última requisição interceptada.", "ok");
    }

    async function copyOutput() {
      if (!output.value.trim()) {
        setStatus("Nada para copiar.", "error");
        return;
      }
      try {
        await copyText(output.value);
        setStatus("Copiado para a área de transferência.", "ok");
      } catch {
        setStatus("Falha ao copiar — selecione o texto manualmente.", "error");
      }
    }

    btnCapture.addEventListener("click", captureFromUrl);
    btnLast.addEventListener("click", loadLastFromPage);
    btnCopy.addEventListener("click", copyOutput);
    wrap.querySelector(".tp-bc-close").addEventListener("click", () => {
      wrap.classList.remove("tp-bc-open");
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") captureFromUrl();
    });

    if (pathMatch && sessionStorage.getItem(STORAGE_KEY)) {
      loadLastFromPage();
    }
  }

  function createToggleButton() {
    if (document.getElementById("tp-bazaar-capture-btn")) return;

    const btn = document.createElement("button");
    btn.id = "tp-bazaar-capture-btn";
    btn.type = "button";
    btn.textContent = "TP JSON";
    btn.title = "TibiaPlace — capturar JSON do Bazaar";
    btn.addEventListener("click", () => {
      const panel = document.getElementById(PANEL_ID);
      if (panel) panel.classList.toggle("tp-bc-open");
    });
    document.body.appendChild(btn);
  }

  GM_addStyle(`
    #tp-bazaar-capture-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483646;
      padding: 10px 14px;
      border: none;
      border-radius: 8px;
      background: #e85d04;
      color: #fff;
      font: 600 12px/1 system-ui, sans-serif;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.35);
    }
    #tp-bazaar-capture-btn:hover { background: #f48c06; }
    #${PANEL_ID} {
      display: none;
      position: fixed;
      bottom: 64px;
      right: 20px;
      z-index: 2147483647;
      width: min(420px, calc(100vw - 40px));
      max-height: min(80vh, 640px);
      overflow: auto;
      padding: 14px;
      border-radius: 12px;
      background: #1a1a1a;
      color: #e4e4e7;
      font: 13px/1.45 system-ui, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
      border: 1px solid #333;
    }
    #${PANEL_ID}.tp-bc-open { display: block; }
    #${PANEL_ID} .tp-bc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    #${PANEL_ID} .tp-bc-close {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
    }
    #${PANEL_ID} .tp-bc-hint {
      margin: 0 0 10px;
      font-size: 11px;
      color: #a1a1aa;
    }
    #${PANEL_ID} code { font-size: 10px; color: #fbbf24; }
    #${PANEL_ID} .tp-bc-label {
      display: block;
      font-size: 11px;
      color: #a1a1aa;
      margin-bottom: 4px;
    }
    #${PANEL_ID} .tp-bc-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #444;
      background: #0f0f0f;
      color: #fff;
      font-size: 12px;
    }
    #${PANEL_ID} .tp-bc-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 10px 0;
    }
    #${PANEL_ID} .tp-bc-btn {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #444;
      background: #27272a;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }
    #${PANEL_ID} .tp-bc-btn:hover { background: #3f3f46; }
    #${PANEL_ID} .tp-bc-primary {
      background: #e85d04;
      border-color: #e85d04;
    }
    #${PANEL_ID} .tp-bc-primary:hover { background: #f48c06; }
    #${PANEL_ID} .tp-bc-status {
      min-height: 18px;
      margin: 0 0 8px;
      font-size: 11px;
      color: #a1a1aa;
    }
    #${PANEL_ID} .tp-bc-status.tp-bc-ok { color: #4ade80; }
    #${PANEL_ID} .tp-bc-status.tp-bc-error { color: #f87171; }
    #${PANEL_ID} .tp-bc-output {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #444;
      background: #0f0f0f;
      color: #d4d4d8;
      font: 11px/1.4 ui-monospace, monospace;
      resize: vertical;
    }
    #${PANEL_ID} .tp-bc-foot {
      margin: 8px 0 0;
      font-size: 10px;
      color: #71717a;
    }
  `);

  installFetchHook();
  createPanel();
  createToggleButton();
})();
