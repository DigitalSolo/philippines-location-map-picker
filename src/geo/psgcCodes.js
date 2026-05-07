export function cleanPsgcCode(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

export function isTenDigitPsgc(value) {
  return cleanPsgcCode(value).length === 10;
}

export function isLegacyNineDigitPsgc(value) {
  return cleanPsgcCode(value).length === 9;
}

export function uniqueCodes(values) {
  return [...new Set(values.map(cleanPsgcCode).filter(Boolean))];
}

export function deriveRegionId(value) {
  const code = cleanPsgcCode(value);

  if (code.length >= 10) {
    return `${code.slice(0, 2)}00000000`;
  }

  if (code.length >= 2) {
    return code.slice(0, 2);
  }

  return '';
}

function legacyProvinceCodeToTenDigit(code) {
  if (code.length === 4) {
    return `${code.slice(0, 2)}0${code.slice(2, 4)}00000`;
  }

  if (code.length === 5) {
    return `${code}00000`;
  }

  return '';
}

function legacyCityCodeToTenDigit(code) {
  if (code.length === 6) {
    return `${code.slice(0, 2)}0${code.slice(2, 4)}${code.slice(4, 6)}000`;
  }

  if (code.length === 7) {
    return `${code}000`;
  }

  return '';
}

function legacyBarangayCodeToTenDigit(code) {
  if (code.length === 9) {
    return `${code.slice(0, 2)}0${code.slice(2, 4)}${code.slice(4, 6)}${code.slice(6, 9)}`;
  }

  return '';
}

export function toTenDigitPsgcCode(value, level = '') {
  const code = cleanPsgcCode(value);

  if (code.length === 10) {
    return code;
  }

  if (level === 'region' && code.length === 2) {
    return `${code}00000000`;
  }

  if (level === 'province') {
    return legacyProvinceCodeToTenDigit(code);
  }

  if (level === 'city') {
    return legacyCityCodeToTenDigit(code);
  }

  if (level === 'barangay') {
    return legacyBarangayCodeToTenDigit(code);
  }

  if (code.length === 9) {
    return legacyBarangayCodeToTenDigit(code);
  }

  if (code.length === 7) {
    return legacyCityCodeToTenDigit(code);
  }

  if (code.length === 6) {
    return legacyCityCodeToTenDigit(code);
  }

  if (code.length === 5) {
    return legacyProvinceCodeToTenDigit(code);
  }

  if (code.length === 4) {
    return legacyProvinceCodeToTenDigit(code);
  }

  if (code.length === 2) {
    return `${code}00000000`;
  }

  return '';
}

export function deriveProvinceId(value) {
  const code = cleanPsgcCode(value);
  const tenDigitCode = code.length === 10 ? code : toTenDigitPsgcCode(code);

  if (tenDigitCode.length === 10) {
    return `${tenDigitCode.slice(0, 5)}00000`;
  }

  return '';
}

export function deriveCityId(value) {
  const code = cleanPsgcCode(value);
  const tenDigitCode = code.length === 10 ? code : toTenDigitPsgcCode(code);

  if (tenDigitCode.length === 10) {
    return `${tenDigitCode.slice(0, 7)}000`;
  }

  return '';
}

export function deriveBarangayCityId(value) {
  return deriveCityId(value);
}

export function legacyCityPrefix(value) {
  return cleanPsgcCode(value).slice(0, 6);
}

export function regionCodeCandidates(value) {
  const code = cleanPsgcCode(value);
  const candidates = [];

  if (!code) {
    return [];
  }

  if (code.length === 10 && code.endsWith('00000000')) {
    candidates.push(code);
    candidates.push(code.slice(0, 2));
  } else if (code.length === 2) {
    candidates.push(code);
    candidates.push(`${code}00000000`);
  } else if (code.length >= 2) {
    candidates.push(code.slice(0, 2));
    candidates.push(`${code.slice(0, 2)}00000000`);
  }

  return uniqueCodes(candidates);
}

export function provinceCodeCandidates(value) {
  const code = cleanPsgcCode(value);
  const candidates = [];
  const tenDigitCode = toTenDigitPsgcCode(code, 'province') || deriveProvinceId(code);

  if (!code) {
    return [];
  }

  candidates.push(code);

  if (tenDigitCode) {
    if (code.length === 10) {
      candidates.push(tenDigitCode);
    }
    candidates.push(`${tenDigitCode.slice(0, 2)}${tenDigitCode.slice(3, 5)}`);
    candidates.push(tenDigitCode.slice(0, 5));
    candidates.push(tenDigitCode);
  }

  return uniqueCodes(candidates);
}

export function cityCodeCandidates(value) {
  const code = cleanPsgcCode(value);
  const candidates = [];
  const tenDigitCode = toTenDigitPsgcCode(code, 'city') || deriveCityId(code);

  if (!code) {
    return [];
  }

  candidates.push(code);

  if (tenDigitCode) {
    if (code.length === 10) {
      candidates.push(tenDigitCode);
    }
    candidates.push(`${tenDigitCode.slice(0, 2)}${tenDigitCode.slice(3, 5)}${tenDigitCode.slice(5, 7)}`);
    candidates.push(tenDigitCode.slice(0, 7));
    candidates.push(tenDigitCode);
  }

  return uniqueCodes(candidates);
}

export function barangayCodeCandidates(value) {
  const code = cleanPsgcCode(value);
  const candidates = [];
  const tenDigitCode = toTenDigitPsgcCode(code, 'barangay');

  if (!code) {
    return [];
  }

  candidates.push(code);

  if (tenDigitCode) {
    if (code.length === 10) {
      candidates.push(tenDigitCode);
    }
    candidates.push(`${tenDigitCode.slice(0, 2)}${tenDigitCode.slice(3, 5)}${tenDigitCode.slice(5, 7)}${tenDigitCode.slice(7, 10)}`);
    candidates.push(tenDigitCode);
  }

  if (code.length === 10) {
    candidates.push(`${code.slice(0, 2)}${code.slice(3, 5)}${code.slice(5, 7)}${code.slice(7, 10)}`);
  }

  return uniqueCodes(candidates);
}

export function parentCodeCandidates(level, value) {
  if (level === 'region') {
    return regionCodeCandidates(value);
  }

  if (level === 'province') {
    return provinceCodeCandidates(value);
  }

  if (level === 'city') {
    return cityCodeCandidates(value);
  }

  if (level === 'barangay') {
    return barangayCodeCandidates(value);
  }

  return uniqueCodes([value]);
}

export function cityFolderCandidates(value) {
  const code = cleanPsgcCode(value);
  const candidates = [];
  const parentCityId = deriveCityId(code);

  if (code.length === 9) {
    candidates.push(code.slice(0, 6));
    if (parentCityId) {
      candidates.push(...cityCodeCandidates(parentCityId));
    }
    candidates.push(...cityCodeCandidates(code));
  } else if (code.length === 10 && !code.endsWith('000') && parentCityId && parentCityId !== code) {
    candidates.push(...cityCodeCandidates(parentCityId));
    candidates.push(...cityCodeCandidates(code));
  } else {
    candidates.push(...cityCodeCandidates(code));
    if (parentCityId && parentCityId !== code) {
      candidates.push(...cityCodeCandidates(parentCityId));
    }
  }

  return uniqueCodes(candidates);
}

export function sameRegion(value, regionId) {
  const candidates = regionCodeCandidates(value);
  const target = regionCodeCandidates(regionId);
  return candidates.some((candidate) => target.includes(candidate));
}

export function sameProvince(value, provinceId) {
  const candidates = provinceCodeCandidates(value);
  const target = provinceCodeCandidates(provinceId);
  return candidates.some((candidate) => target.includes(candidate));
}

export function sameCity(value, cityId) {
  const candidates = cityCodeCandidates(value);
  const target = cityCodeCandidates(cityId);
  return candidates.some((candidate) => target.includes(candidate));
}
