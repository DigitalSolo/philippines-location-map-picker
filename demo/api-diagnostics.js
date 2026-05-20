(function () {
  const $ = (id) => document.getElementById(id);

  function text(id) {
    return String($(id).value || '').trim();
  }

  function number(id) {
    const value = Number(text(id));
    return Number.isFinite(value) ? value : null;
  }

  function apiUrl(endpoint) {
    return text('api_url').replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, '');
  }

  function writeJson(value) {
    $('output').textContent = JSON.stringify(value, null, 2);
  }

  function unwrap(value) {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'data')) {
      return value.data;
    }
    return value;
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options || { headers: { Accept: 'application/json' } });
    const raw = await response.text();
    let decoded = null;
    try {
      decoded = raw ? JSON.parse(raw) : null;
    } catch (error) {
      throw new Error('Response was not JSON: ' + raw.slice(0, 500));
    }
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(decoded));
    }
    return unwrap(decoded);
  }

  function get(endpoint, params) {
    const url = new URL(apiUrl(endpoint), window.location.href);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return fetchJson(url.toString());
  }

  function post(endpoint, body) {
    return fetchJson(apiUrl(endpoint), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
  }

  function renderSummary(value) {
    const coverage = value.coverage || value.health?.coverage || value;
    const schema = value.schema || {};
    const cards = [];

    if (typeof coverage.active_barangays !== 'undefined') {
      cards.push(['Active barangays', coverage.active_barangays]);
      cards.push(['Geometry rows', coverage.geometry_rows]);
      cards.push(['Missing geometry', coverage.active_barangays_without_geometry]);
      cards.push(['Coverage %', coverage.coverage_percent]);
    }
    if (typeof schema.ok !== 'undefined') {
      cards.push(['Schema OK', schema.ok ? 'yes' : 'no']);
      cards.push(['FK compatible', schema.foreign_key_compatible ? 'yes' : 'no']);
      cards.push(['Spatial index', schema.spatial_index_found ? 'yes' : 'no']);
    }

    $('summary').innerHTML = cards.length
      ? cards.map(([label, count]) => '<div><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(count) + '</strong></div>').join('')
      : '<div><span>Status</span><strong>Ready</strong></div>';
  }

  function renderRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      $('rows').textContent = 'No rows.';
      return;
    }

    const columns = Object.keys(rows[0]);
    $('rows').innerHTML = '<table><thead><tr>'
      + columns.map((column) => '<th>' + escapeHtml(column) + '</th>').join('')
      + '</tr></thead><tbody>'
      + rows.map((row) => '<tr>' + columns.map((column) => '<td>' + escapeHtml(row[column]) + '</td>').join('') + '</tr>').join('')
      + '</tbody></table>';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function runDiagnostics() {
    const data = await get('diagnostics');
    renderSummary(data);
    renderRows([]);
    writeJson(data);
  }

  async function runSearch() {
    const data = await get('search', { q: text('search_text'), limit: 50 });
    renderSummary({});
    renderRows(data);
    writeJson(data);
  }

  async function runMissingGeometry() {
    const data = await get('missing-geometry', { limit: 250 });
    renderSummary(data);
    renderRows(data.rows || []);
    writeJson(data);
  }

  async function runReverseProbe() {
    const lat = number('reverse_lat');
    const lng = number('reverse_lng');
    if (lat === null || lng === null) {
      throw new Error('Reverse lat and lng are required.');
    }
    const data = await post('reverse-probe', {
      lat,
      lng,
      city_id: text('reverse_city_id')
    });
    renderSummary({});
    renderRows(data.candidates || []);
    writeJson(data);
  }

  function bind(id, fn) {
    $(id).addEventListener('click', () => fn().catch((error) => writeJson({ ok: false, error: error.message })));
  }

  bind('run_diagnostics', runDiagnostics);
  bind('run_search', runSearch);
  bind('run_reverse_probe', runReverseProbe);
  bind('run_missing_geometry', runMissingGeometry);
}());
