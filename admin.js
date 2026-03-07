(() => {
  'use strict';

  const STORAGE_KEY_STRIPE = 'hdr_stripe';
  const STORAGE_KEY_GH = 'hdr_github';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* =========================================
     Helpers
     ========================================= */

  const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); }
    catch { return {}; }
  };

  const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const flash = (el, msg, type = 'ok') => {
    el.className = `admin__status admin__status--${type}`;
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; el.className = 'admin__status'; }, 4000);
  };

  const log = (msg, type = '') => {
    const el = $('#deployLog');
    el.classList.add('active');
    const span = document.createElement('span');
    if (type) span.className = `log-${type}`;
    span.textContent = `${new Date().toLocaleTimeString()} — ${msg}`;
    el.appendChild(span);
    el.appendChild(document.createElement('br'));
    el.scrollTop = el.scrollHeight;
  };

  /* =========================================
     Reveal / hide password fields
     ========================================= */

  $$('.admin__reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = $(`#${btn.dataset.target}`);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
    });
  });

  /* =========================================
     Stripe Configuration
     ========================================= */

  const linkDayPass = $('#linkDayPass');
  const linkExplorer = $('#linkExplorer');
  const linkFirstClass = $('#linkFirstClass');
  const stripeStatus = $('#stripeStatus');

  const hydrateStripe = () => {
    const cfg = load(STORAGE_KEY_STRIPE);
    const links = cfg.paymentLinks || {};
    linkDayPass.value = links['day-pass'] || '';
    linkExplorer.value = links['explorer'] || '';
    linkFirstClass.value = links['first-class'] || '';
  };

  $('#saveStripe').addEventListener('click', () => {
    const paymentLinks = {
      'day-pass': linkDayPass.value.trim(),
      'explorer': linkExplorer.value.trim(),
      'first-class': linkFirstClass.value.trim(),
    };

    for (const [plan, url] of Object.entries(paymentLinks)) {
      if (url && !url.startsWith('https://')) {
        flash(stripeStatus, `Payment link for "${plan}" must be an https:// URL.`, 'err');
        return;
      }
    }

    save(STORAGE_KEY_STRIPE, { paymentLinks });
    flash(stripeStatus, 'Stripe settings saved.', 'ok');
  });

  hydrateStripe();

  /* =========================================
     GitHub Deploy
     ========================================= */

  const ghToken = $('#ghToken');
  const ghRepo = $('#ghRepo');
  const ghBranch = $('#ghBranch');

  const hydrateGh = () => {
    const cfg = load(STORAGE_KEY_GH);
    ghToken.value = cfg.token || '';
    ghRepo.value = cfg.repo || '';
    ghBranch.value = cfg.branch || 'gh-pages';
  };

  const saveGhSettings = () => {
    save(STORAGE_KEY_GH, {
      token: ghToken.value.trim(),
      repo: ghRepo.value.trim(),
      branch: ghBranch.value.trim() || 'gh-pages',
    });
  };

  $('#saveGhBtn').addEventListener('click', () => {
    saveGhSettings();
    log('GitHub settings saved.', 'ok');
  });

  hydrateGh();

  const SITE_FILES = ['index.html', 'styles.css', 'script.js', 'admin.html', 'admin.css', 'admin.js', 'README.md'];

  const ghApi = async (path, opts = {}) => {
    const token = ghToken.value.trim();
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      ...opts,
    });
    return res;
  };

  const fetchFileContent = async (filename) => {
    const resp = await fetch(filename + '?t=' + Date.now());
    return resp.text();
  };

  const toBase64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  };

  const ensureRepo = async (owner, repoName) => {
    const check = await ghApi(`/repos/${owner}/${repoName}`);
    if (check.ok) {
      log(`Repository ${owner}/${repoName} exists.`, 'ok');
      return true;
    }

    log(`Creating repository ${owner}/${repoName}…`, 'info');
    const create = await ghApi('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: repoName,
        description: 'HotDesk Rail — Refurbished Train Cabins, Reimagined as Workspaces',
        homepage: `https://${owner}.github.io/${repoName}/`,
        auto_init: true,
        has_pages: true,
      }),
    });

    if (!create.ok) {
      const err = await create.json();
      throw new Error(err.message || 'Failed to create repository');
    }

    log('Repository created.', 'ok');
    await new Promise(r => setTimeout(r, 2000));
    return true;
  };

  const getOrCreateBranch = async (repo, branch) => {
    const refRes = await ghApi(`/repos/${repo}/git/ref/heads/${branch}`);
    if (refRes.ok) {
      const data = await refRes.json();
      return data.object.sha;
    }

    log(`Branch "${branch}" not found. Creating from default…`, 'info');
    const mainRef = await ghApi(`/repos/${repo}/git/ref/heads/main`);
    let baseSha;
    if (mainRef.ok) {
      baseSha = (await mainRef.json()).object.sha;
    } else {
      const masterRef = await ghApi(`/repos/${repo}/git/ref/heads/master`);
      if (!masterRef.ok) throw new Error('Cannot find default branch (main or master)');
      baseSha = (await masterRef.json()).object.sha;
    }

    const createRef = await ghApi(`/repos/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });

    if (!createRef.ok) {
      const err = await createRef.json();
      throw new Error(err.message || 'Failed to create branch');
    }

    log(`Branch "${branch}" created.`, 'ok');
    return baseSha;
  };

  const createTree = async (repo, baseSha, files) => {
    const tree = files.map(f => ({
      path: f.name,
      mode: '100644',
      type: 'blob',
      content: f.content,
    }));

    const res = await ghApi(`/repos/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseSha, tree }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create tree');
    }

    return (await res.json()).sha;
  };

  const createCommit = async (repo, treeSha, parentSha, message) => {
    const res = await ghApi(`/repos/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents: [parentSha],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create commit');
    }

    return (await res.json()).sha;
  };

  const updateRef = async (repo, branch, commitSha) => {
    const res = await ghApi(`/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commitSha, force: true }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update ref');
    }
  };

  const enablePages = async (repo, branch) => {
    log('Enabling GitHub Pages…', 'info');
    await ghApi(`/repos/${repo}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        source: { branch, path: '/' },
      }),
    });
  };

  $('#deployBtn').addEventListener('click', async () => {
    const token = ghToken.value.trim();
    const repoFull = ghRepo.value.trim();
    const branch = ghBranch.value.trim() || 'gh-pages';

    if (!token) { log('GitHub token is required.', 'err'); return; }
    if (!repoFull || !repoFull.includes('/')) {
      log('Repository must be in "owner/repo" format.', 'err');
      return;
    }

    saveGhSettings();

    const [owner, repoName] = repoFull.split('/');
    const deployBtn = $('#deployBtn');
    deployBtn.disabled = true;
    deployBtn.textContent = 'Deploying…';

    try {
      log('Starting deployment…', 'info');

      await ensureRepo(owner, repoName);

      log(`Fetching ${SITE_FILES.length} site files…`, 'info');
      const files = [];
      for (const name of SITE_FILES) {
        try {
          const content = await fetchFileContent(name);
          files.push({ name, content });
          log(`  ✓ ${name} (${(content.length / 1024).toFixed(1)} KB)`, 'ok');
        } catch {
          log(`  ✗ ${name} — skipped (not found)`, 'err');
        }
      }

      if (files.length === 0) {
        throw new Error('No files to deploy');
      }

      const latestSha = await getOrCreateBranch(repoFull, branch);
      log(`Branch HEAD: ${latestSha.slice(0, 7)}`, 'info');

      const commitRes = await ghApi(`/repos/${repoFull}/git/commits/${latestSha}`);
      const baseTreeSha = (await commitRes.json()).tree.sha;

      log('Creating tree…', 'info');
      const treeSha = await createTree(repoFull, baseTreeSha, files);

      log('Creating commit…', 'info');
      const commitSha = await createCommit(
        repoFull, treeSha, latestSha,
        `Deploy HotDesk Rail site — ${new Date().toISOString()}`
      );

      log('Updating branch ref…', 'info');
      await updateRef(repoFull, branch, commitSha);

      await enablePages(repoFull, branch);

      const siteUrl = `https://${owner}.github.io/${repoName}/`;
      log(`Deployment complete! Site will be live at: ${siteUrl}`, 'ok');
      log('GitHub Pages may take 1-2 minutes to propagate.', 'info');

    } catch (err) {
      log(`Error: ${err.message}`, 'err');
    } finally {
      deployBtn.disabled = false;
      deployBtn.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
        Deploy Now`;
    }
  });

  /* =========================================
     Clear All Settings
     ========================================= */

  $('#clearAll').addEventListener('click', () => {
    if (!confirm('This will remove all saved Stripe keys, GitHub tokens, and settings. Continue?')) return;
    localStorage.removeItem(STORAGE_KEY_STRIPE);
    localStorage.removeItem(STORAGE_KEY_GH);
    hydrateStripe();
    hydrateGh();
    log('All settings cleared.', 'info');
  });
})();
