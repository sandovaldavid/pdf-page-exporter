// End-to-end suite for the unpacked extension, driven by `playwright-cli run-code`.
// Run it through test/run.sh — it needs the browser launched with the extension
// loaded and a few paths that run.sh sets up.
//
// The fixture is served FROM the real drive.google.com origin via request
// interception, so the extension's host_permissions genuinely apply. The only
// thing stubbed is chrome.tabs.query({active,currentWindow}): a popup opened as
// a tab would otherwise return itself instead of the document tab. Everything
// else (chrome.scripting, chrome.runtime, chrome.storage, both content scripts,
// jsPDF, the download) is the real thing.
//
// Sandbox note: this runs in a restricted evaluator — no require, no URL,
// no setTimeout. Use page.waitForTimeout and string splitting instead.
async page => {
  const OUT = '/tmp/dpu-e2e';
  const context = page.context();
  context.setDefaultTimeout(240000);

  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

  // A hung wait would otherwise surface as a bare "Timeout exceeded" with no
  // hint about which scenario stalled. Every section announces itself so the
  // failure report can name it.
  let section = 'startup';
  const enter = (name) => { section = name; };

  const consoleErrors = [];
  const pageErrors = [];
  context.on('page', (p) => {
    p.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    p.on('pageerror', (e) => pageErrors.push(e.message));
  });

  try {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 20000 });
  const extensionId = sw.url().split('/')[2];
  check('service worker registers', sw.url().endsWith('/src/background/service-worker.js'), sw.url());

  await context.route('https://drive.google.com/__dpu_sidebar', (r) =>
    r.fulfill({
      contentType: 'text/html; charset=utf-8',
      // A panel with an image that is NOT a page: small, and not a blob: URL.
      body: '<!DOCTYPE html><html lang="es"><body><h2>Detalles</h2>' +
            '<img width="32" height="32" alt="icono" src="data:image/gif;base64,' +
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></body></html>',
    }));
  await context.route('https://drive.google.com/file/d/**', (r) =>
    r.fulfill({ path: OUT + '/viewer.html', contentType: 'text/html; charset=utf-8' }));

  // Open a document tab and start recording the overlay's status timeline.
  const openDoc = async (slug, query) => {
    const p = await context.newPage();
    p.setDefaultTimeout(240000);
    await p.goto(`https://drive.google.com/file/d/${slug}/view?${query}`);
    await p.waitForFunction(() => window.__fixtureReady === true);
    // Wait for the first page bitmap before letting any test press Export. The
    // fixture decodes pages with a deliberate delay, and a real user cannot
    // export a viewer that has not painted a page yet either — without this the
    // test races the extension's own "no pages detected" guard and blames it.
    await p.waitForFunction(() => window.__fixtureRendered >= 1, { timeout: 30000 });
    const tab = await sw.evaluate(async (s) => {
      const t = (await chrome.tabs.query({ url: `https://drive.google.com/file/d/${s}/*` }))[0];
      return { id: t.id, url: t.url, title: t.title };
    }, slug);
    await p.evaluate(() => {
      window.__timeline = [];
      const obs = new MutationObserver(() => {
        const s = document.querySelector('.dpu-status');
        if (!s) return;
        const txt = s.textContent.trim();
        if (window.__timeline[window.__timeline.length - 1] !== txt) window.__timeline.push(txt);
      });
      obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    return { p, tab };
  };

  const openPopup = async (tab, breakServiceWorker) => {
    await context.addInitScript(({ t, brk }) => {
      if (!location.protocol.startsWith('chrome-extension')) return;
      const real = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = (q, cb) => {
        if (q && q.active && q.currentWindow) return cb ? cb([t]) : Promise.resolve([t]);
        return real(q, cb);
      };
      if (brk) {
        const realSend = chrome.runtime.sendMessage.bind(chrome.runtime);
        chrome.runtime.sendMessage = (msg, ...rest) => {
          if (msg && msg.type === 'DPU_GET_STATE') return Promise.reject(new Error('SW asleep'));
          return realSend(msg, ...rest);
        };
      }
    }, { t: tab, brk: !!breakServiceWorker });
    const pop = await context.newPage();
    pop.setDefaultTimeout(240000);
    await pop.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await pop.waitForFunction(() => !document.getElementById('exportForm').hidden);
    return pop;
  };

  // ============================================================ A. Happy path
  enter('A: happy path, 20 pages');
  {
    const { p, tab } = await openDoc('MAIN', 'pages=20');
    const before = await p.evaluate(() => window.__fixtureRendered);
    const slots = await p.evaluate(() => document.querySelectorAll('.page-slot').length);
    check('fixture virtualizes (few bitmaps before export)', slots === 20 && before < 6,
      `${before}/${slots} rendered up front`);

    const pop = await openPopup(tab);

    const a11y = await pop.evaluate(() => ({
      lang: document.documentElement.lang,
      role: document.getElementById('progressTrack').getAttribute('role'),
      min: document.getElementById('progressTrack').getAttribute('aria-valuemin'),
      progressLive: document.getElementById('progressText').getAttribute('aria-live'),
      resultLive: document.getElementById('resultText').getAttribute('aria-live'),
      filename: document.getElementById('filenameInput').value,
    }));
    check('popup has lang="es"', a11y.lang === 'es', a11y.lang);
    check('progress bar exposes progressbar role', a11y.role === 'progressbar' && a11y.min === '0', JSON.stringify(a11y));
    check('progress and result are live regions',
      a11y.progressLive === 'polite' && a11y.resultLive === 'polite', JSON.stringify(a11y));
    check('filename suggested from tab title, no ".pdf.pdf"',
      a11y.filename === 'Documento de prueba', a11y.filename);

    await pop.fill('#filenameInput', 'main20');
    const dl = context.waitForEvent('download');
    await pop.click('#exportBtn');
    const download = await dl;
    await download.saveAs(OUT + '/main20.pdf');

    check('all 20 pages captured despite virtualization',
      (await p.evaluate(() => window.__fixtureRendered)) === 20);
    check('popup reports success',
      (await pop.evaluate(() => document.getElementById('resultText').textContent)) === 'PDF descargado: 20 páginas');

    const state = await sw.evaluate(async () =>
      (await chrome.storage.session.get('dpuExportState')).dpuExportState);
    check('session state is complete and tagged with the tab',
      state.status === 'done' && state.capturedPages === 20 &&
      state.expectedPageCount === 20 && state.tabId === tab.id, JSON.stringify(state));
    check('badge shows OK', (await sw.evaluate(() => chrome.action.getBadgeText({}))) === 'OK');

    // Finding #9: jsPDF (420 KB) must reach only the frames that hold pages.
    const frames = await sw.evaluate(async (tabId) => {
      const res = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: () => ({
          path: location.pathname,
          jsPDF: typeof window.jspdf,
          detector: !!window.__dpuPageDetector,
          capture: typeof window.__dpuStartCapture,
          pages: window.__dpuPageDetector ? window.__dpuPageDetector.detectPages().pageElements.length : -1,
        }),
      });
      return res.map((r) => r.result);
    }, tab.id);
    const main = frames.find((f) => f.path.includes('/file/d/'));
    const side = frames.find((f) => f.path.includes('__dpu_sidebar'));
    check('viewer frame got jsPDF and found pages',
      main && main.jsPDF === 'object' && main.capture === 'function' && main.pages === 20, JSON.stringify(main));
    check('sidebar frame got the detector but NOT jsPDF',
      side && side.detector === true && side.jsPDF === 'undefined' &&
      side.capture === 'undefined' && side.pages === 0, JSON.stringify(side));
  }

  // ================================== B. No detectable pages (finding #1)
  enter('B: document with no pages');
  {
    await context.route('https://drive.google.com/empty', (r) =>
      r.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!DOCTYPE html><html lang="es"><head><title>Vacio - Google Drive</title></head>' +
              '<body><div>Cargando…</div></body></html>',
      }));
    const p = await context.newPage();
    await p.goto('https://drive.google.com/empty');
    const tab = await sw.evaluate(async () => {
      const t = (await chrome.tabs.query({ url: 'https://drive.google.com/empty' }))[0];
      return { id: t.id, url: t.url, title: t.title };
    });

    const pop = await openPopup(tab);
    const t0 = Date.now();
    await pop.click('#exportBtn');
    await pop.waitForFunction(() => !document.getElementById('resultState').hidden, { timeout: 20000 });
    const elapsed = Date.now() - t0;

    const res = await pop.evaluate(() => ({
      text: document.getElementById('resultText').textContent,
      isError: document.getElementById('resultState').classList.contains('dpu-result-error'),
      progressVisible: !document.getElementById('progressState').hidden,
      btnEnabled: !document.getElementById('exportBtn').disabled,
    }));
    check('empty document fails fast instead of hanging at 0%',
      res.isError && !res.progressVisible && elapsed < 10000, `${elapsed}ms ${JSON.stringify(res)}`);
    check('empty document error names the recovery step',
      res.text.includes('No se detectaron páginas'), res.text);
    check('export button is usable again after the failure', res.btnEnabled);

    const injected = await sw.evaluate(async (tabId) => {
      const r = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true }, func: () => typeof window.jspdf,
      });
      return r.map((x) => x.result);
    }, tab.id);
    check('jsPDF is not injected when detection fails',
      injected.every((v) => v === 'undefined'), JSON.stringify(injected));
  }

  // ============================ C. Cancel must abort the export (finding #5)
  //
  // This cancels during the SCROLL phase, not during PDF assembly, and that is
  // deliberate. Assembly used to rasterize every page and ran for many seconds,
  // which is what made a cancel there matter — and an earlier revision of this
  // suite proved the guard works, catching the click with the overlay reading
  // "Generando PDF…" and confirming no download followed. Encoding pages during
  // the scroll shrank assembly to a loop of addImage calls over ready bytes, so
  // that window is now milliseconds and cannot be hit reliably from a test.
  //
  // The guard stays in capture.js because it is correct and free. What is
  // asserted here is the part that still has a meaningful window and is what
  // users actually do: cancel while the document is being scrolled, and get no
  // file.
  enter('C: cancel aborts the export');
  {
    const { p, tab } = await openDoc('CANCEL', 'pages=20');

    let downloaded = false;
    const onDownload = () => { downloaded = true; };
    context.on('download', onDownload);

    const pop = await openPopup(tab);
    await pop.click('#exportBtn');

    // Let the export get properly under way before cancelling.
    await p.waitForFunction(
      () => (window.__timeline || []).some((t) => /^Página \d+ de \d+$/.test(t)),
      { timeout: 60000 }
    );
    const statusAtCancel = await p.evaluate(() => {
      const s = document.querySelector('.dpu-status').textContent.trim();
      document.querySelector('.dpu-cancel').click();
      return s;
    });
    check('cancel was clicked mid-export, not before it started',
      /^Página \d+ de \d+$/.test(statusAtCancel), statusAtCancel);

    await p.waitForFunction(() => {
      const s = document.querySelector('.dpu-status');
      return s && s.textContent.trim() === 'Cancelado';
    }, { timeout: 30000 });

    await pop.waitForFunction(() => !document.getElementById('resultState').hidden, { timeout: 30000 });
    check('popup reports the cancellation',
      (await pop.evaluate(() => document.getElementById('resultText').textContent))
        .includes('cancelada por el usuario'));

    // An ignored cancel would still run to completion and download. Give it room.
    await p.waitForTimeout(8000);
    context.off('download', onDownload);
    check('cancelling produces no file', downloaded === false);
  }

  // ============================================ D. Escape cancels too
  enter('D: escape cancels');
  {
    const { p, tab } = await openDoc('ESC', 'pages=15');
    const pop = await openPopup(tab);
    await pop.selectOption('#qualitySelect', 'high');
    await pop.click('#exportBtn');
    await p.waitForFunction(() => (window.__timeline || []).some((t) => t.startsWith('Página')));
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => {
      const s = document.querySelector('.dpu-status');
      return s && (s.textContent.trim() === 'Cancelado' || s.textContent.trim() === 'Cancelando…');
    });
    check('Escape cancels the export', true,
      JSON.stringify(await p.evaluate(() => window.__timeline.slice(-3))));
  }

  // ================ E. Popup survives a service worker that never answers (#6)
  enter('E: service worker down');
  {
    const { tab } = await openDoc('SWDOWN', 'pages=3');
    const pop = await openPopup(tab, true);
    const cdp = await context.newCDPSession(pop);
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: "document.getElementById('exportForm')",
    });
    const listeners = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    const submits = listeners.listeners.filter((l) => l.type === 'submit').length;
    check('submit handler survives a failed DPU_GET_STATE', submits === 1, `${submits} submit listeners`);
  }

  // ========== F. Toolbar advertising the wrong total must not show "9 de 5"
  enter('F: wrong advertised total');
  {
    const { p, tab } = await openDoc('WRONG', 'pages=9&label=5');
    const pop = await openPopup(tab);
    await pop.fill('#filenameInput', 'wrongcount');
    const dl = context.waitForEvent('download');
    await pop.click('#exportBtn');
    await (await dl).saveAs(OUT + '/wrongcount.pdf');

    const impossible = await p.evaluate(() =>
      window.__timeline.filter((t) => {
        const m = t.match(/Página (\d+) de (\d+)/);
        return m && Number(m[1]) > Number(m[2]);
      }));
    check('never renders an impossible counter like "Página 9 de 5"',
      impossible.length === 0, JSON.stringify(await p.evaluate(() => window.__timeline)));
    check('a wrong advertised total does not truncate the export',
      (await pop.evaluate(() => document.getElementById('resultText').textContent)) === 'PDF descargado: 9 páginas');
  }

  // ===== G. Aggressive virtualization: pages unmounted and blob: URLs revoked
  //
  // Honest scope: this does NOT prove that rasterizing at capture time is
  // required. Measured both ways — a detached <img> keeps its decoded bitmap
  // while a JS reference to it is alive, so deferring rasterization to assembly
  // time passes this too. The failure mode that motivates capturing early is
  // Chrome discarding decoded data for out-of-tree images under memory
  // pressure, which is not deterministically reproducible here. What this check
  // does prove is that an export completes correctly while the viewer is
  // unmounting pages underneath it.
  enter('G: aggressive virtualization');
  {
    const { p, tab } = await openDoc('EVICT', 'pages=20&evict=1');
    const pop = await openPopup(tab);
    await pop.fill('#filenameInput', 'evicted20');
    const dl = context.waitForEvent('download');
    await pop.click('#exportBtn');
    await (await dl).saveAs(OUT + '/evicted20.pdf');

    const evicted = await p.evaluate(() => window.__fixtureEvicted);
    const stillInDom = await p.evaluate(() => document.querySelectorAll('img[src^="blob:"]').length);
    check('the viewer really did unmount pages mid-export', evicted > 0, `${evicted} evictions`);
    check('most pages are gone from the DOM by the end', stillInDom < 20, `${stillInDom} still present`);
    check('export survives pages being unmounted and their blob URLs revoked',
      (await pop.evaluate(() => document.getElementById('resultText').textContent)) === 'PDF descargado: 20 páginas');
  }

  check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('no uncaught page exceptions', pageErrors.length === 0, pageErrors.join(' | '));

  return { checks, failed: checks.filter((c) => !c.ok).length };
  } catch (err) {
    checks.push({ name: `section "${section}" did not finish`, ok: false, detail: String(err && err.message).slice(0, 200) });
    return { checks, failed: checks.filter((c) => !c.ok).length, stalledIn: section };
  }
}
