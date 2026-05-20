<?php
declare(strict_types=1);

/**
 * Reusable PHP/MariaDB database adapter for Philippines Location Map Picker.
 *
 * Default table contract:
 * - location_regions(id, name, active)
 * - location_provinces(id, name, active, regions_id)
 * - location_city(id, name, active, provinces_id)
 * - location_barangays(id, name, city_id, active)
 * - location_barangay_geometries(barangay_id, boundary, boundary_simplified, centroid, min_lat, max_lat, min_lng, max_lng, source, source_ref)
 *
 * The browser package never connects to MariaDB directly. Host projects expose
 * this adapter through a small JSON route and set apiUrl in mountApiLocationMapPickerField().
 */
final class LocationMapPickerDatabaseAdapter
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
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
            'schema' => $this->schema(),
            'diagnostics' => $this->diagnostics(),
            'missing-geometry' => $this->missingGeometry($input),
            'reverse-probe' => $this->reverseProbe($input),
            'search' => $this->search($input),
            default => throw new InvalidArgumentException('Unknown location map picker endpoint.'),
        };
    }

    public function health(): array
    {
        return [
            'ok' => true,
            'tables' => [
                'location_regions' => $this->tableCount('location_regions'),
                'location_provinces' => $this->tableCount('location_provinces'),
                'location_city' => $this->tableCount('location_city'),
                'location_barangays' => $this->tableCount('location_barangays'),
                'location_barangay_geometries' => $this->tableCount('location_barangay_geometries'),
            ],
        ];
    }


    public function coverage(): array
    {
        $activeBarangays = $this->scalarInt('
            SELECT COUNT(*)
            FROM location_barangays b
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
        ');

        $geometryRows = $this->tableCount('location_barangay_geometries');
        $activeWithoutGeometry = $this->scalarInt('
            SELECT COUNT(*)
            FROM location_barangays b
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND g.barangay_id IS NULL
        ');

        $activeWithGeometry = max(0, $activeBarangays - $activeWithoutGeometry);

        return [
            'ok' => true,
            'active_barangays' => $activeBarangays,
            'geometry_rows' => $geometryRows,
            'active_barangays_with_geometry' => $activeWithGeometry,
            'active_barangays_without_geometry' => $activeWithoutGeometry,
            'coverage_percent' => $activeBarangays > 0 ? round(($activeWithGeometry / $activeBarangays) * 100, 4) : 0,
            'inactive_barangays_with_geometry' => $this->scalarInt('
                SELECT COUNT(*)
                FROM location_barangays b
                JOIN location_barangay_geometries g ON g.barangay_id = b.id
                WHERE b.active = 0
            '),
        ];
    }

    public function diagnostics(): array
    {
        return [
            'ok' => true,
            'health' => $this->health(),
            'coverage' => $this->coverage(),
            'schema' => $this->schema(),
        ];
    }

    public function schema(): array
    {
        $tables = [
            'location_regions' => ['id', 'name', 'active'],
            'location_provinces' => ['id', 'name', 'active', 'regions_id'],
            'location_city' => ['id', 'name', 'active', 'provinces_id'],
            'location_barangays' => ['id', 'name', 'city_id', 'active'],
            'location_barangay_geometries' => [
                'barangay_id',
                'boundary',
                'boundary_simplified',
                'centroid',
                'min_lat',
                'max_lat',
                'min_lng',
                'max_lng',
                'source',
                'source_ref',
            ],
        ];

        $result = [
            'ok' => true,
            'tables' => [],
            'foreign_key_compatible' => false,
            'spatial_index_found' => false,
        ];

        foreach ($tables as $table => $requiredColumns) {
            $columns = $this->tableColumns($table);
            $missing = [];

            foreach ($requiredColumns as $column) {
                if (!isset($columns[$column])) {
                    $missing[] = $column;
                }
            }

            $result['tables'][$table] = [
                'exists' => count($columns) > 0,
                'missing_columns' => $missing,
                'columns' => $columns,
            ];

            if (count($missing) > 0 || count($columns) === 0) {
                $result['ok'] = false;
            }
        }

        $parent = $result['tables']['location_barangays']['columns']['id'] ?? null;
        $child = $result['tables']['location_barangay_geometries']['columns']['barangay_id'] ?? null;
        if (is_array($parent) && is_array($child)) {
            $result['foreign_key_compatible'] = $parent['column_type'] === $child['column_type']
                && $parent['character_set_name'] === $child['character_set_name']
                && $parent['collation_name'] === $child['collation_name'];
        }

        $result['spatial_index_found'] = $this->spatialIndexFound('location_barangay_geometries', 'boundary');
        if (!$result['foreign_key_compatible'] || !$result['spatial_index_found']) {
            $result['ok'] = false;
        }

        return $result;
    }

    public function missingGeometry(array $input): array
    {
        $limit = $this->boundedInt($input, 'limit', 250, 1, 1000);
        $offset = $this->boundedInt($input, 'offset', 0, 0, 1000000);

        $total = $this->scalarInt('
            SELECT COUNT(*)
            FROM location_barangays b
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND g.barangay_id IS NULL
        ');

        $rows = $this->rows('
            SELECT
                r.id AS region_id,
                r.name AS region_name,
                p.id AS province_id,
                p.name AS province_name,
                c.id AS city_id,
                c.name AS city_name,
                b.id AS barangay_id,
                b.name AS barangay_name
            FROM location_barangays b
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND g.barangay_id IS NULL
            ORDER BY r.name, p.name, c.name, b.name
            LIMIT ' . $limit . ' OFFSET ' . $offset . '
        ');

        return [
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'rows' => $rows,
        ];
    }

    public function search(array $input): array
    {
        $query = trim((string)($input['q'] ?? $_GET['q'] ?? ''));
        $limit = $this->boundedInt($input, 'limit', 25, 1, 100);

        if ($query === '') {
            return [];
        }

        $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';

        return $this->rows('
            SELECT
                r.id AS region_id,
                r.name AS region_name,
                p.id AS province_id,
                p.name AS province_name,
                c.id AS city_id,
                c.name AS city_name,
                b.id AS barangay_id,
                b.name AS barangay_name,
                CASE WHEN g.barangay_id IS NULL THEN 0 ELSE 1 END AS has_geometry
            FROM location_barangays b
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            LEFT JOIN location_barangay_geometries g ON g.barangay_id = b.id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND (b.id = :exact_id OR b.name LIKE :like OR c.name LIKE :like OR p.name LIKE :like)
            ORDER BY
              CASE WHEN b.id = :exact_id THEN 0 ELSE 1 END,
              p.name,
              c.name,
              b.name
            LIMIT ' . $limit . '
        ', [
            ':exact_id' => $query,
            ':like' => $like,
        ]);
    }

    public function reverseProbe(array $input): array
    {
        $lat = $this->number($input, 'lat');
        $lng = $this->number($input, 'lng');

        if ($lat === null || $lng === null) {
            return [
                'matched' => false,
                'reason' => 'lat_lng_required',
                'candidates' => [],
            ];
        }

        $match = $this->reverse($input);
        $params = [
            ':lat' => $lat,
            ':lng' => $lng,
        ];

        $citySql = '';
        $cityId = $this->text($input, 'city_id');
        if ($cityId !== '') {
            $citySql = ' AND b.city_id = :city_id ';
            $params[':city_id'] = $cityId;
        }

        $candidates = $this->rows('
            SELECT
                r.id AS region_id,
                p.id AS province_id,
                c.id AS city_id,
                b.id AS barangay_id,
                b.name AS barangay_name,
                g.min_lat,
                g.max_lat,
                g.min_lng,
                g.max_lng,
                g.source,
                g.source_ref
            FROM location_barangay_geometries g
            JOIN location_barangays b ON b.id = g.barangay_id
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND g.min_lat <= :lat
              AND g.max_lat >= :lat
              AND g.min_lng <= :lng
              AND g.max_lng >= :lng
              ' . $citySql . '
            ORDER BY b.name
            LIMIT 25
        ', $params);

        return [
            'matched' => is_array($match),
            'match' => $match,
            'reason' => is_array($match) ? 'boundary_match' : (count($candidates) > 0 ? 'bbox_candidates_without_contains_match' : 'no_bbox_candidates'),
            'candidate_count' => count($candidates),
            'candidates' => $candidates,
        ];
    }

    public function regions(): array
    {
        return $this->rows('
            SELECT id, id AS code, name, \'region\' AS type
            FROM location_regions
            WHERE active = 1
            ORDER BY name, id
        ');
    }

    public function provinces(string $regionId): array
    {
        if ($regionId === '') {
            return [];
        }

        return $this->rows('
            SELECT id, id AS code, name, \'province\' AS type
            FROM location_provinces
            WHERE active = 1
              AND regions_id = :region_id
            ORDER BY name, id
        ', [':region_id' => $regionId]);
    }

    public function cities(string $provinceId, string $regionId): array
    {
        if ($provinceId !== '') {
            return $this->rows('
                SELECT id, id AS code, name, \'city_municipality\' AS type
                FROM location_city
                WHERE active = 1
                  AND provinces_id = :province_id
                ORDER BY name, id
            ', [':province_id' => $provinceId]);
        }

        if ($regionId === '') {
            return [];
        }

        return $this->rows('
            SELECT c.id, c.id AS code, c.name, \'city_municipality\' AS type
            FROM location_city c
            JOIN location_provinces p ON p.id = c.provinces_id
            WHERE c.active = 1
              AND p.active = 1
              AND p.regions_id = :region_id
            ORDER BY c.name, c.id
        ', [':region_id' => $regionId]);
    }

    public function barangays(string $cityId): array
    {
        if ($cityId === '') {
            return [];
        }

        return $this->rows('
            SELECT id, id AS code, name, \'barangay\' AS type
            FROM location_barangays
            WHERE active = 1
              AND city_id = :city_id
            ORDER BY name, id
        ', [':city_id' => $cityId]);
    }

    public function location(array $input): ?array
    {
        $barangayId = $this->text($input, 'barangay_id');
        if ($barangayId !== '') {
            return $this->one('
                SELECT
                    r.id AS region_id,
                    r.name AS region_name,
                    p.id AS province_id,
                    p.name AS province_name,
                    c.id AS city_id,
                    c.name AS city_name,
                    b.id AS barangay_id,
                    b.name AS barangay_name
                FROM location_barangays b
                JOIN location_city c ON c.id = b.city_id
                JOIN location_provinces p ON p.id = c.provinces_id
                JOIN location_regions r ON r.id = p.regions_id
                WHERE b.id = :barangay_id
                  AND b.active = 1
                  AND c.active = 1
                  AND p.active = 1
                  AND r.active = 1
                LIMIT 1
            ', [':barangay_id' => $barangayId]);
        }

        $cityId = $this->text($input, 'city_id');
        if ($cityId !== '') {
            return $this->one('
                SELECT
                    r.id AS region_id,
                    r.name AS region_name,
                    p.id AS province_id,
                    p.name AS province_name,
                    c.id AS city_id,
                    c.name AS city_name,
                    \'\' AS barangay_id,
                    \'\' AS barangay_name
                FROM location_city c
                JOIN location_provinces p ON p.id = c.provinces_id
                JOIN location_regions r ON r.id = p.regions_id
                WHERE c.id = :city_id
                  AND c.active = 1
                  AND p.active = 1
                  AND r.active = 1
                LIMIT 1
            ', [':city_id' => $cityId]);
        }

        $provinceId = $this->text($input, 'province_id');
        if ($provinceId !== '') {
            return $this->one('
                SELECT
                    r.id AS region_id,
                    r.name AS region_name,
                    p.id AS province_id,
                    p.name AS province_name,
                    \'\' AS city_id,
                    \'\' AS city_name,
                    \'\' AS barangay_id,
                    \'\' AS barangay_name
                FROM location_provinces p
                JOIN location_regions r ON r.id = p.regions_id
                WHERE p.id = :province_id
                  AND p.active = 1
                  AND r.active = 1
                LIMIT 1
            ', [':province_id' => $provinceId]);
        }

        $regionId = $this->text($input, 'region_id');
        if ($regionId !== '') {
            return $this->one('
                SELECT
                    r.id AS region_id,
                    r.name AS region_name,
                    \'\' AS province_id,
                    \'\' AS province_name,
                    \'\' AS city_id,
                    \'\' AS city_name,
                    \'\' AS barangay_id,
                    \'\' AS barangay_name
                FROM location_regions r
                WHERE r.id = :region_id
                  AND r.active = 1
                LIMIT 1
            ', [':region_id' => $regionId]);
        }

        return null;
    }

    public function bounds(string $level, string $id): ?array
    {
        if ($level === '' || $id === '') {
            return null;
        }

        $where = $this->geometryScopeWhere($level);
        if ($where === null) {
            return null;
        }

        return $this->one('
            SELECT
                MIN(g.min_lat) AS south,
                MIN(g.min_lng) AS west,
                MAX(g.max_lat) AS north,
                MAX(g.max_lng) AS east
            FROM location_barangay_geometries g
            JOIN location_barangays b ON b.id = g.barangay_id
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND ' . $where . '
        ', [':id' => $id]);
    }

    public function centroid(string $level, string $id): ?array
    {
        $bounds = $this->bounds($level, $id);
        if (!$bounds || $bounds['south'] === null || $bounds['west'] === null || $bounds['north'] === null || $bounds['east'] === null) {
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

        $row = $this->one('
            SELECT ST_AsGeoJSON(COALESCE(boundary_simplified, boundary)) AS geojson
            FROM location_barangay_geometries
            WHERE barangay_id = :barangay_id
            LIMIT 1
        ', [':barangay_id' => $id]);

        return $this->geojsonOuterRingToPoints((string)($row['geojson'] ?? ''));
    }

    public function reverse(array $input): ?array
    {
        $lat = $this->number($input, 'lat');
        $lng = $this->number($input, 'lng');

        if ($lat === null || $lng === null) {
            return null;
        }

        $params = [
            ':lat' => $lat,
            ':lng' => $lng,
            ':point_wkt' => 'POINT(' . $this->formatDecimal($lng, 8) . ' ' . $this->formatDecimal($lat, 8) . ')',
        ];

        $citySql = '';
        $cityId = $this->text($input, 'city_id');
        if ($cityId !== '') {
            $citySql = ' AND b.city_id = :city_id ';
            $params[':city_id'] = $cityId;
        }

        return $this->one('
            SELECT
                r.id AS region_id,
                r.name AS region_name,
                p.id AS province_id,
                p.name AS province_name,
                c.id AS city_id,
                c.name AS city_name,
                b.id AS barangay_id,
                b.name AS barangay_name,
                \'database-boundary\' AS match_quality,
                0 AS match_distance_km,
                g.source AS resolved_source
            FROM location_barangay_geometries g
            JOIN location_barangays b ON b.id = g.barangay_id
            JOIN location_city c ON c.id = b.city_id
            JOIN location_provinces p ON p.id = c.provinces_id
            JOIN location_regions r ON r.id = p.regions_id
            WHERE b.active = 1
              AND c.active = 1
              AND p.active = 1
              AND r.active = 1
              AND g.min_lat <= :lat
              AND g.max_lat >= :lat
              AND g.min_lng <= :lng
              AND g.max_lng >= :lng
              ' . $citySql . '
              AND ST_Contains(g.boundary, ST_GeomFromText(:point_wkt))
            ORDER BY
              CASE WHEN b.city_id = :city_id_order THEN 0 ELSE 1 END,
              b.name
            LIMIT 1
        ', $params + [':city_id_order' => $cityId]);
    }

    private function geometryScopeWhere(string $level): ?string
    {
        return match ($level) {
            'region' => 'r.id = :id',
            'province' => 'p.id = :id',
            'city', 'city_municipality' => 'c.id = :id',
            'barangay' => 'b.id = :id',
            default => null,
        };
    }

    private function tableColumns(string $table): array
    {
        $stmt = $this->pdo->prepare('
            SELECT
                COLUMN_NAME,
                COLUMN_TYPE,
                DATA_TYPE,
                IS_NULLABLE,
                CHARACTER_SET_NAME,
                COLLATION_NAME,
                COLUMN_KEY
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
            ORDER BY ORDINAL_POSITION
        ');
        $stmt->execute([':table' => $table]);

        $columns = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $columns[(string)$row['COLUMN_NAME']] = [
                'column_type' => (string)$row['COLUMN_TYPE'],
                'data_type' => (string)$row['DATA_TYPE'],
                'is_nullable' => (string)$row['IS_NULLABLE'],
                'character_set_name' => $row['CHARACTER_SET_NAME'] === null ? null : (string)$row['CHARACTER_SET_NAME'],
                'collation_name' => $row['COLLATION_NAME'] === null ? null : (string)$row['COLLATION_NAME'],
                'column_key' => (string)$row['COLUMN_KEY'],
            ];
        }

        return $columns;
    }

    private function spatialIndexFound(string $table, string $column): bool
    {
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*)
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
              AND COLUMN_NAME = :column
              AND INDEX_TYPE = \'SPATIAL\'
        ');
        $stmt->execute([
            ':table' => $table,
            ':column' => $column,
        ]);

        return (int)$stmt->fetchColumn() > 0;
    }

    private function boundedInt(array $input, string $key, int $default, int $min, int $max): int
    {
        $value = $this->text($input, $key);
        if ($value === '' || !ctype_digit($value)) {
            return $default;
        }

        return max($min, min($max, (int)$value));
    }

    private function tableCount(string $table): int
    {
        return (int)$this->pdo->query('SELECT COUNT(*) FROM `' . $table . '`')->fetchColumn();
    }

    private function scalarInt(string $sql, array $params = []): int
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }

    private function rows(string $sql, array $params = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function one(string $sql, array $params = []): ?array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
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

    private function formatDecimal(float $number, int $scale): string
    {
        return rtrim(rtrim(sprintf('%.' . $scale . 'F', $number), '0'), '.');
    }

    private function geojsonOuterRingToPoints(string $geojson): array
    {
        if (trim($geojson) === '') {
            return [];
        }

        $decoded = json_decode($geojson, true);
        if (!is_array($decoded)) {
            return [];
        }

        $type = strtoupper((string)($decoded['type'] ?? ''));
        $coordinates = $decoded['coordinates'] ?? null;
        if (!is_array($coordinates)) {
            return [];
        }

        $ring = [];
        if ($type === 'POLYGON' && isset($coordinates[0]) && is_array($coordinates[0])) {
            $ring = $coordinates[0];
        }
        if ($type === 'MULTIPOLYGON' && isset($coordinates[0][0]) && is_array($coordinates[0][0])) {
            $ring = $coordinates[0][0];
        }

        $points = [];
        foreach ($ring as $pair) {
            if (!is_array($pair) || count($pair) < 2) {
                continue;
            }
            $points[] = [
                'lat' => (float)$pair[1],
                'lng' => (float)$pair[0],
            ];
        }

        return $points;
    }
}
