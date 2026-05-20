(function () {
  const $ = (id) => document.getElementById(id);
  let controller = null;

  function text(id) {
    return String($(id).value || '').trim();
  }

  function number(id) {
    const value = Number(text(id));
    return Number.isFinite(value) ? value : null;
  }

  function providerOptions() {
    const mode = text('provider_mode') || 'static';
    const options = {
      mount: '#qa_picker',
      provider: mode,
      fieldPrefix: text('field_prefix') || 'location',
      baseUrl: text('base_url') || '../data/fixtures/daet',
      apiUrl: text('api_url') || '',
      reverse: {
        enabled: true,
        failOnNoMatch: false
      },
      ui: {
        displayMode: 'embedded',
        selectedLabelFormat: 'province_city_barangay',
        density: 'compact'
      }
    };

    if (mode === 'static') {
      delete options.apiUrl;
    }
    if (mode === 'api') {
      delete options.baseUrl;
    }

    return options;
  }

  function renderConfig() {
    const options = providerOptions();
    $('config_output').textContent = '<div id="location_picker"></div>\n\n'
      + '<script src="/packages/philippines-location-map-picker/dist/location-map-picker.umd.js"><\/script>\n'
      + '<script>\n'
      + 'PhilippinesLocationMapPicker.mountLocationMapPickerField(' + JSON.stringify({ ...options, mount: '#location_picker' }, null, 2) + ');\n'
      + '<\/script>';
  }

  function writeOutput(value) {
    $('qa_output').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options || { headers: { Accept: 'application/json' } });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error('Response was not JSON: ' + text.slice(0, 400));
    }
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(data));
    }
    return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
  }

  async function apiGet(apiUrl, endpoint, params) {
    const url = new URL(apiUrl.replace(/\/+$/, '') + '/' + endpoint, window.location.href);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    return fetchJson(url.toString());
  }

  async function apiPost(apiUrl, endpoint, body) {
    const url = apiUrl.replace(/\/+$/, '') + '/' + endpoint;
    return fetchJson(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
  }

  async function staticGet(baseUrl, path) {
    return fetchJson(baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, ''));
  }

  async function runContract() {
    const mode = text('provider_mode') || 'static';
    const output = {
      generated_at: new Date().toISOString(),
      mode,
      steps: []
    };

    if (mode === 'api') {
      const apiUrl = text('api_url');
      output.health = await apiGet(apiUrl, 'health', {}).catch((error) => ({ warning: error.message }));
      output.coverage = await apiGet(apiUrl, 'coverage', {}).catch((error) => ({ warning: error.message }));
      const regions = await apiGet(apiUrl, 'regions', {});
      const region = regions[0];
      const provinces = await apiGet(apiUrl, 'provinces', { region_id: region.id });
      const province = provinces[0];
      const cities = await apiGet(apiUrl, 'cities', { region_id: region.id, province_id: province.id });
      const city = cities[0];
      const barangays = await apiGet(apiUrl, 'barangays', { city_id: city.id });
      output.steps.push({ name: 'hierarchy', status: 'pass', counts: { regions: regions.length, provinces: provinces.length, cities: cities.length, barangays: barangays.length } });
    } else {
      const baseUrl = text('base_url');
      const manifest = await staticGet(baseUrl, 'fixture-manifest.json').catch(() => ({}));
      const regions = await staticGet(baseUrl, 'psgc/regions.json');
      const region = regions[0];
      const provinces = await staticGet(baseUrl, 'psgc/provinces/' + region.id + '.json');
      const province = provinces[0];
      const cities = await staticGet(baseUrl, 'psgc/cities/' + province.id + '.json');
      const city = cities[0];
      const barangays = await staticGet(baseUrl, 'psgc/barangays/' + city.id + '.json');
      output.fixture = manifest.name || baseUrl;
      output.steps.push({ name: 'hierarchy', status: 'pass', counts: { regions: regions.length, provinces: provinces.length, cities: cities.length, barangays: barangays.length } });
    }

    output.ok = true;
    writeOutput(output);
  }

  async function runReverse() {
    const mode = text('provider_mode') || 'static';
    const lat = number('reverse_lat');
    const lng = number('reverse_lng');
    if (lat === null || lng === null) {
      throw new Error('Reverse lat/lng are required.');
    }

    if (mode === 'api') {
      writeOutput(await apiPost(text('api_url'), 'reverse', { lat, lng }));
      return;
    }

    if (!controller) {
      mountPicker();
      await controller.ready;
    }

    if (!controller.picker.mapPicker || typeof controller.picker.mapPicker.setPin !== 'function') {
      throw new Error('Mounted picker map instance is not available yet.');
    }
    controller.picker.mapPicker.setPin({ lat, lng }, true, { centerOnPin: true, force: true });
    const match = await controller.picker.reverseFillFromPin(true);
    writeOutput(match || { matched: false });
  }

  function mountPicker() {
    if (controller && typeof controller.destroy === 'function') {
      controller.destroy();
    }
    $('qa_picker').innerHTML = '';
    controller = window.PhilippinesLocationMapPicker.mountLocationMapPickerField(providerOptions());
    writeOutput('Picker mounted.');
    renderConfig();
  }

  async function copyConfig() {
    renderConfig();
    await navigator.clipboard.writeText($('config_output').textContent);
    writeOutput('Config copied.');
  }

  $('provider_mode').addEventListener('change', renderConfig);
  ['base_url', 'api_url', 'field_prefix', 'reverse_lat', 'reverse_lng'].forEach((id) => {
    $(id).addEventListener('input', renderConfig);
  });
  $('mount_picker').addEventListener('click', () => {
    try { mountPicker(); } catch (error) { writeOutput({ ok: false, error: error.message }); }
  });
  $('run_contract').addEventListener('click', () => runContract().catch((error) => writeOutput({ ok: false, error: error.message })));
  $('reverse_test').addEventListener('click', () => runReverse().catch((error) => writeOutput({ ok: false, error: error.message })));
  $('copy_config').addEventListener('click', () => copyConfig().catch((error) => writeOutput({ ok: false, error: error.message })));

  renderConfig();
}());
