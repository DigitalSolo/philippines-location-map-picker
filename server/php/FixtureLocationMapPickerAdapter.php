<?php
declare(strict_types=1);

/**
 * Small JSON-fixture API adapter for PLMP development and package tests.
 *
 * This is not a production datastore. It lets the package exercise the same
 * browser API provider contract without requiring a MariaDB export or host app.
 */
final class FixtureLocationMapPickerAdapter
{
    private string $fixtureRoot;

    public function __construct(string $fixtureRoot)
    {
        $root = rtrim(str_replace('\\', '/', $fixtureRoot), '/');
        if ($root === '' || !is_dir($root)) {
            throw new RuntimeException('Fixture root does not exist: ' . $fixtureRoot);
        }
        $this->fixtureRoot = $root;
    }

    public static function endpointFromRequest(): string
    {
        $endpoint = trim((string)($_GET['endpoint'] ?? ''), "/ \t\n\r\0\x0B");
        if ($endpoint !== '') {
            return $endpoint;
        }

        $pathInfo = trim((string)($_SERVER['PATH_INFO'] ?? ''), "/ \t\n\r\0\x0B");
        if ($pathInfo !== '') {
            return $pathInfo;
        }

        $requestUri = (string)($_SERVER['REQUEST_URI'] ?? '');
        $scriptName = (string)($_SERVER['SCRIPT_NAME'] ?? '');
        $requestPath = (string)parse_url($requestUri, PHP_URL_PATH);

        if ($scriptName !== '' && strpos($requestPath, $scriptName) === 0) {
            return trim(substr($requestPath, strlen($scriptName)), "/ \t\n\r\0\x0B");
        }

        return '';
    }

    public static function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public static function sendJson(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function sendError(string $code, string $message, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function handle(string $endpoint, array $input): mixed
    {
        return match ($endpoint) {
            'regions' => $this->regions(),
            'provinces' => $this->provinces($this->text($input, 'region_id')),
            'cities' => $this->cities($this->text($input, 'province_id'), $this->text($input, 'region_id')),
            'barangays' => $this->barangays($this->text($input, 'city_id')),
            'location' => $this->location($input),
            'bounds' => $this->bounds($this->text($input, 'level'), $this->text($input, 'id')),
            'centroid' => $this->centroid($this->text($input, 'level'), $this->text($input, 'id')),
            'polygon' => $this->polygon($this->text($input, 'level'), $this->text($input, 'id')),
            'reverse' => $this->reverse($input),
            'health' => $this->health(),
            'coverage' => $this->coverage(),
            default => throw new InvalidArgumentException('Unknown location map picker fixture endpoint.'),
        };
    }

    public function health(): array
    {
        $manifest = $this->json('fixture-manifest.json', []);
        return [
            'ok' => true,
            'fixture' => $manifest['name'] ?? basename($this->fixtureRoot),
            'production_boundaries' => $manifest['production_boundaries'] ?? false,
            'barangays' => count($this->barangays((string)($manifest['city_id'] ?? ''))),
        ];
    }


    public function coverage(): array
    {
        $manifest = $this->json('fixture-manifest.json', []);
        $cityId = (string)($manifest['city_id'] ?? '');
        $barangays = $this->barangays($cityId);
        $bounds = $this->json('geo/bounds/barangays.json', []);
        $centroids = $this->json('geo/centroids/barangays.json', []);
        $polygonDir = $this->fixtureRoot . '/geo/polygons/barangays/' . $cityId;
        $polygonCount = is_dir($polygonDir) ? count(glob($polygonDir . '/*.json') ?: []) : 0;

        return [
            'ok' => true,
            'fixture' => $manifest['name'] ?? basename($this->fixtureRoot),
            'city_id' => $cityId,
            'active_barangays' => count($barangays),
            'barangay_bounds' => is_array($bounds) ? count($bounds) : 0,
            'barangay_centroids' => is_array($centroids) ? count($centroids) : 0,
            'barangay_polygons' => $polygonCount,
            'production_boundaries' => $manifest['production_boundaries'] ?? false,
        ];
    }

    public function regions(): array
    {
        return $this->json('psgc/regions.json', []);
    }

    public function provinces(string $regionId): array
    {
        if ($regionId === '') {
            return [];
        }
        return $this->json('psgc/provinces/' . $this->safeId($regionId) . '.json', []);
    }

    public function cities(string $provinceId, string $regionId): array
    {
        if ($provinceId !== '') {
            return $this->json('psgc/cities/' . $this->safeId($provinceId) . '.json', []);
        }
        if ($regionId !== '') {
            return $this->json('psgc/cities/' . $this->safeId($regionId) . '.json', []);
        }
        return [];
    }

    public function barangays(string $cityId): array
    {
        if ($cityId === '') {
            return [];
        }
        return $this->json('psgc/barangays/' . $this->safeId($cityId) . '.json', []);
    }

    public function location(array $input): ?array
    {
        $barangayId = $this->text($input, 'barangay_id');
        $cityId = $this->text($input, 'city_id');
        $provinceId = $this->text($input, 'province_id');
        $regionId = $this->text($input, 'region_id');

        if ($barangayId !== '' && $cityId === '') {
            $cityId = substr($barangayId, 0, 7);
        }
        if ($cityId !== '' && $provinceId === '') {
            $provinceId = substr($cityId, 0, 5);
        }
        if (($provinceId !== '' || $cityId !== '' || $barangayId !== '') && $regionId === '') {
            $regionId = substr($provinceId !== '' ? $provinceId : ($cityId !== '' ? $cityId : $barangayId), 0, 2);
        }

        $region = $this->findById($this->regions(), $regionId);
        $province = $this->findById($regionId !== '' ? $this->provinces($regionId) : [], $provinceId);
        $city = $this->findById($provinceId !== '' ? $this->cities($provinceId, '') : $this->cities('', $regionId), $cityId);
        $barangay = $this->findById($cityId !== '' ? $this->barangays($cityId) : [], $barangayId);

        if (!$region && !$province && !$city && !$barangay) {
            return null;
        }

        return [
            'region_id' => (string)($region['id'] ?? $regionId),
            'region_name' => (string)($region['name'] ?? ''),
            'province_id' => (string)($province['id'] ?? $provinceId),
            'province_name' => (string)($province['name'] ?? ''),
            'city_id' => (string)($city['id'] ?? $cityId),
            'city_name' => (string)($city['name'] ?? ''),
            'barangay_id' => (string)($barangay['id'] ?? $barangayId),
            'barangay_name' => (string)($barangay['name'] ?? ''),
        ];
    }

    public function bounds(string $level, string $id): ?array
    {
        $file = match ($level) {
            'region' => 'regions',
            'province' => 'provinces',
            'city', 'city_municipality' => 'cities',
            'barangay' => 'barangays',
            default => '',
        };

        if ($file === '' || $id === '') {
            return null;
        }

        $data = $this->json('geo/bounds/' . $file . '.json', []);
        return $data[$id] ?? null;
    }

    public function centroid(string $level, string $id): ?array
    {
        if ($id === '') {
            return null;
        }

        if ($level === 'barangay') {
            $data = $this->json('geo/centroids/barangays.json', []);
            if (isset($data[$id])) {
                return $data[$id];
            }
        }

        $bounds = $this->bounds($level, $id);
        if (!$bounds) {
            return null;
        }

        return [
            'lat' => ((float)$bounds['south'] + (float)$bounds['north']) / 2,
            'lng' => ((float)$bounds['west'] + (float)$bounds['east']) / 2,
        ];
    }

    public function polygon(string $level, string $id): array
    {
        if ($level !== 'barangay' || $id === '') {
            return [];
        }

        $cityId = substr($id, 0, 7);
        return $this->json('geo/polygons/barangays/' . $cityId . '/' . $this->safeId($id) . '.json', []);
    }

    public function reverse(array $input): ?array
    {
        $lat = $this->number($input, 'lat');
        $lng = $this->number($input, 'lng');
        $cityId = $this->text($input, 'city_id');

        if ($lat === null || $lng === null) {
            return null;
        }

        $cityIds = [];
        if ($cityId !== '') {
            $cityIds[] = $cityId;
        } else {
            foreach ($this->json('geo/bounds/cities.json', []) as $candidateCityId => $bounds) {
                if ($this->boundsContains($bounds, $lat, $lng)) {
                    $cityIds[] = (string)$candidateCityId;
                }
            }
        }

        foreach ($cityIds as $candidateCityId) {
            foreach ($this->barangays($candidateCityId) as $barangay) {
                $barangayId = (string)($barangay['id'] ?? '');
                if ($barangayId === '') {
                    continue;
                }

                $bounds = $this->bounds('barangay', $barangayId);
                if (!$this->boundsContains($bounds, $lat, $lng)) {
                    continue;
                }

                $polygon = $this->polygon('barangay', $barangayId);
                if (count($polygon) >= 3 && !$this->pointInPolygon($lat, $lng, $polygon)) {
                    continue;
                }

                $location = $this->location([
                    'city_id' => $candidateCityId,
                    'barangay_id' => $barangayId,
                ]);

                if (!$location) {
                    continue;
                }

                return $location + [
                    'match_quality' => count($polygon) >= 3 ? 'fixture-polygon' : 'fixture-bounds',
                    'match_distance_km' => 0,
                    'resolved_source' => 'fixture-json',
                ];
            }
        }

        return null;
    }

    private function text(array $input, string $key): string
    {
        if (array_key_exists($key, $_GET)) {
            return trim((string)$_GET[$key]);
        }
        if (array_key_exists($key, $input)) {
            return trim((string)$input[$key]);
        }
        return '';
    }

    private function number(array $input, string $key): ?float
    {
        $value = $this->text($input, $key);
        return is_numeric($value) ? (float)$value : null;
    }

    private function safeId(string $value): string
    {
        return preg_replace('/[^0-9A-Za-z_-]/', '', $value) ?? '';
    }

    private function json(string $relativePath, mixed $fallback): mixed
    {
        $relativePath = ltrim(str_replace('\\', '/', $relativePath), '/');
        if (str_contains($relativePath, '..')) {
            return $fallback;
        }

        $path = $this->fixtureRoot . '/' . $relativePath;
        if (!is_file($path)) {
            return $fallback;
        }

        $decoded = json_decode((string)file_get_contents($path), true);
        return $decoded === null ? $fallback : $decoded;
    }

    private function findById(array $rows, string $id): ?array
    {
        foreach ($rows as $row) {
            if ((string)($row['id'] ?? $row['code'] ?? '') === $id) {
                return $row;
            }
        }
        return null;
    }

    private function boundsContains(mixed $bounds, float $lat, float $lng): bool
    {
        return is_array($bounds)
            && $lat >= (float)($bounds['south'] ?? 0)
            && $lat <= (float)($bounds['north'] ?? 0)
            && $lng >= (float)($bounds['west'] ?? 0)
            && $lng <= (float)($bounds['east'] ?? 0);
    }

    private function pointInPolygon(float $lat, float $lng, array $polygon): bool
    {
        $inside = false;
        $count = count($polygon);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $pi = $polygon[$i];
            $pj = $polygon[$j];
            $yi = (float)($pi['lat'] ?? 0);
            $xi = (float)($pi['lng'] ?? 0);
            $yj = (float)($pj['lat'] ?? 0);
            $xj = (float)($pj['lng'] ?? 0);

            $intersects = (($yi > $lat) !== ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1.0) + $xi);

            if ($intersects) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}
