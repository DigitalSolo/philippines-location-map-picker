<?php
declare(strict_types=1);

/**
 * Export small static JSON fixtures from the host location database.
 *
 * This avoids shipping a 550 MB SQL dump with PLMP while still making the
 * component easy to test without a live database.
 *
 * Example, Daet only with polygons:
 * php server/php/export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --city-id=0516030 --include-polygons=1
 *
 * Example, hierarchy-only fixture for all active rows:
 * php server/php/export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --include-all-hierarchy=1 --include-polygons=0
 */

main($argv);

function main(array $argv): void
{
    $options = parse_options($argv);

    if (isset($options['help'])) {
        print_help();
        return;
    }

    if (isset($options['env'])) {
        load_env_file((string)$options['env']);
    }

    $database = option_value($options, 'database', ['DB_DATABASE', 'DB_NAME', 'MYSQL_DATABASE'], '');
    if ($database === '') {
        throw new RuntimeException('Missing database. Pass --database=NAME or set DB_DATABASE in --env.');
    }

    $host = option_value($options, 'host', ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
    $port = option_value($options, 'port', ['DB_PORT', 'MYSQL_PORT'], '3306');
    $user = option_value($options, 'user', ['DB_USER', 'DB_USERNAME', 'MYSQL_USER'], 'root');
    $password = option_value($options, 'password', ['DB_PASSWORD', 'MYSQL_PASSWORD'], '');
    $charset = option_value($options, 'charset', ['DB_CHARSET'], 'utf8mb4');

    $packageRoot = realpath(__DIR__ . '/../..');
    $defaultOutputDir = ($packageRoot !== false ? $packageRoot : getcwd()) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'fixtures';
    $outputDir = (string)($options['output-dir'] ?? $defaultOutputDir);
    $includeAllHierarchy = bool_option($options, 'include-all-hierarchy', true);
    $includePolygons = bool_option($options, 'include-polygons', false);
    $geometryScope = strtolower((string)($options['geometry-scope'] ?? 'selected'));

    $pdo = connect_pdo($host, $port, $database, $user, $password, $charset);
    ensure_dir($outputDir);

    $selectedCityIds = selected_city_ids($pdo, $options, $includeAllHierarchy);
    $hierarchyScope = hierarchy_scope($selectedCityIds, $includeAllHierarchy);

    export_regions($pdo, $outputDir, $hierarchyScope);
    export_provinces($pdo, $outputDir, $hierarchyScope);
    export_cities($pdo, $outputDir, $hierarchyScope);
    export_barangays($pdo, $outputDir, $hierarchyScope);
    export_bounds_and_centroids($pdo, $outputDir, $selectedCityIds, $geometryScope);

    if ($includePolygons) {
        export_polygons($pdo, $outputDir, $selectedCityIds, $geometryScope);
    }

    write_manifest($outputDir, [
        'generated_at' => date('c'),
        'database' => $database,
        'include_all_hierarchy' => $includeAllHierarchy,
        'include_polygons' => $includePolygons,
        'geometry_scope' => $geometryScope,
        'selected_city_ids' => array_values($selectedCityIds),
        'paths' => [
            'regions' => 'psgc/regions.json',
            'provinces' => 'psgc/provinces/{region_id}.json',
            'cities' => 'psgc/cities/{province_id}.json',
            'barangays' => 'psgc/barangays/{city_id}.json',
            'bounds' => 'geo/bounds/*.json',
            'centroids' => 'geo/centroids/*.json',
            'polygons' => $includePolygons ? 'geo/polygons/barangays/{city_id}/{barangay_id}.json' : null,
        ],
    ]);

    echo 'Static fixture export complete.' . PHP_EOL;
    echo 'output_dir=' . $outputDir . PHP_EOL;
    echo 'selected_city_ids=' . implode(',', $selectedCityIds) . PHP_EOL;
}

function print_help(): void
{
    echo <<<TXT
Export PLMP static JSON fixtures from MariaDB.

Required:
  --database=NAME                  Database name unless DB_DATABASE is set in --env.

Common:
  --env=PATH                       Optional .env file.
  --output-dir=PATH                Default: data/fixtures under the package root.
  --city-id=0516030                One or more comma-separated city IDs.
  --province-id=05160              Export selected province's cities as geometry scope.
  --region-id=05                   Export selected region's cities as geometry scope.
  --include-all-hierarchy=1|0      Default: 1. Export all dropdown hierarchy.
  --include-polygons=1|0           Default: 0. Polygon files can become large.
  --geometry-scope=selected|all    Default: selected. Use all only when you really want nationwide geometry JSON.

Examples:
  php server/php/export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --city-id=0516030 --include-polygons=1
  php server/php/export-location-map-picker-static-fixtures.php --env=C:\www\anitas-crud\.env --database=anitas --include-all-hierarchy=1 --include-polygons=0

TXT;
}

function parse_options(array $argv): array
{
    $options = [];
    foreach (array_slice($argv, 1) as $arg) {
        if (substr($arg, 0, 2) !== '--') {
            continue;
        }
        $parts = explode('=', substr($arg, 2), 2);
        $options[$parts[0]] = count($parts) === 1 ? true : $parts[1];
    }
    return $options;
}

function option_value(array $options, string $option, array $envKeys, string $default): string
{
    if (array_key_exists($option, $options)) {
        return (string)$options[$option];
    }
    foreach ($envKeys as $envKey) {
        $value = getenv($envKey);
        if ($value !== false && $value !== '') {
            return (string)$value;
        }
    }
    return $default;
}

function bool_option(array $options, string $name, bool $default): bool
{
    if (!array_key_exists($name, $options)) {
        return $default;
    }
    $value = strtolower(trim((string)$options[$name]));
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function load_env_file(string $path): void
{
    if (!is_file($path)) {
        throw new RuntimeException('Env file not found: ' . $path);
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        throw new RuntimeException('Unable to read env file: ' . $path);
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || substr($line, 0, 1) === '#') {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $name = trim($parts[0]);
        $value = trim($parts[1]);
        if (strlen($value) >= 2 && ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') || (substr($value, 0, 1) === "'" && substr($value, -1) === "'"))) {
            $value = substr($value, 1, -1);
        }
        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

function connect_pdo(string $host, string $port, string $database, string $user, string $password, string $charset): PDO
{
    return new PDO("mysql:host={$host};port={$port};dbname={$database};charset={$charset}", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function ensure_dir(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0775, true)) {
        throw new RuntimeException('Unable to create directory: ' . $path);
    }
}

function write_json(string $path, mixed $data): void
{
    ensure_dir(dirname($path));
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function rows(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function one_column(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_values(array_filter(array_map('strval', $stmt->fetchAll(PDO::FETCH_COLUMN))));
}

function csv_ids(string $value): array
{
    return array_values(array_filter(array_map(static fn($part) => trim($part), explode(',', $value))));
}

function selected_city_ids(PDO $pdo, array $options, bool $includeAllHierarchy): array
{
    $ids = [];

    if (isset($options['city-id'])) {
        $ids = array_merge($ids, csv_ids((string)$options['city-id']));
    }

    if (isset($options['province-id'])) {
        foreach (csv_ids((string)$options['province-id']) as $provinceId) {
            $ids = array_merge($ids, one_column($pdo, '
                SELECT id
                FROM location_city
                WHERE active = 1
                  AND provinces_id = :province_id
                ORDER BY id
            ', [':province_id' => $provinceId]));
        }
    }

    if (isset($options['region-id'])) {
        foreach (csv_ids((string)$options['region-id']) as $regionId) {
            $ids = array_merge($ids, one_column($pdo, '
                SELECT c.id
                FROM location_city c
                JOIN location_provinces p ON p.id = c.provinces_id
                WHERE c.active = 1
                  AND p.active = 1
                  AND p.regions_id = :region_id
                ORDER BY c.id
            ', [':region_id' => $regionId]));
        }
    }

    if (count($ids) === 0 && !$includeAllHierarchy) {
        throw new RuntimeException('No city scope selected. Pass --city-id, --province-id, --region-id, or use --include-all-hierarchy=1.');
    }

    return array_values(array_unique($ids));
}

function hierarchy_scope(array $selectedCityIds, bool $includeAllHierarchy): array
{
    return [
        'include_all' => $includeAllHierarchy,
        'city_ids' => $selectedCityIds,
    ];
}

function export_regions(PDO $pdo, string $outputDir, array $scope): void
{
    $params = [];
    $where = 'r.active = 1';
    if (!$scope['include_all']) {
        $where .= ' AND c.id IN (' . placeholders('city', count($scope['city_ids']), $params, $scope['city_ids']) . ')';
        $sql = "
            SELECT DISTINCT r.id, r.id AS code, r.name, 'region' AS type
            FROM location_regions r
            JOIN location_provinces p ON p.regions_id = r.id
            JOIN location_city c ON c.provinces_id = p.id
            WHERE {$where}
            ORDER BY r.name, r.id
        ";
    } else {
        $sql = "
            SELECT r.id, r.id AS code, r.name, 'region' AS type
            FROM location_regions r
            WHERE {$where}
            ORDER BY r.name, r.id
        ";
    }
    write_json($outputDir . '/psgc/regions.json', rows($pdo, $sql, $params));
}

function export_provinces(PDO $pdo, string $outputDir, array $scope): void
{
    $regionIds = one_column($pdo, 'SELECT id FROM location_regions WHERE active = 1 ORDER BY id');
    foreach ($regionIds as $regionId) {
        $params = [':region_id' => $regionId];
        $where = 'p.active = 1 AND p.regions_id = :region_id';
        if (!$scope['include_all']) {
            $where .= ' AND EXISTS (SELECT 1 FROM location_city c WHERE c.provinces_id = p.id AND c.id IN (' . placeholders('city', count($scope['city_ids']), $params, $scope['city_ids']) . '))';
        }
        $data = rows($pdo, "
            SELECT p.id, p.id AS code, p.name, 'province' AS type
            FROM location_provinces p
            WHERE {$where}
            ORDER BY p.name, p.id
        ", $params);
        if (count($data) > 0) {
            write_json($outputDir . '/psgc/provinces/' . $regionId . '.json', $data);
        }
    }
}

function export_cities(PDO $pdo, string $outputDir, array $scope): void
{
    $provinceIds = one_column($pdo, 'SELECT id FROM location_provinces WHERE active = 1 ORDER BY id');
    foreach ($provinceIds as $provinceId) {
        $params = [':province_id' => $provinceId];
        $where = 'c.active = 1 AND c.provinces_id = :province_id';
        if (!$scope['include_all']) {
            $where .= ' AND c.id IN (' . placeholders('city', count($scope['city_ids']), $params, $scope['city_ids']) . ')';
        }
        $data = rows($pdo, "
            SELECT c.id, c.id AS code, c.name, 'city_municipality' AS type
            FROM location_city c
            WHERE {$where}
            ORDER BY c.name, c.id
        ", $params);
        if (count($data) > 0) {
            write_json($outputDir . '/psgc/cities/' . $provinceId . '.json', $data);
        }
    }

    $regionIds = one_column($pdo, 'SELECT id FROM location_regions WHERE active = 1 ORDER BY id');
    foreach ($regionIds as $regionId) {
        $params = [':region_id' => $regionId];
        $where = 'c.active = 1 AND p.active = 1 AND p.regions_id = :region_id';
        if (!$scope['include_all']) {
            $where .= ' AND c.id IN (' . placeholders('city', count($scope['city_ids']), $params, $scope['city_ids']) . ')';
        }
        $data = rows($pdo, "
            SELECT c.id, c.id AS code, c.name, 'city_municipality' AS type
            FROM location_city c
            JOIN location_provinces p ON p.id = c.provinces_id
            WHERE {$where}
            ORDER BY c.name, c.id
        ", $params);
        if (count($data) > 0) {
            write_json($outputDir . '/psgc/cities/' . $regionId . '.json', $data);
        }
    }
}

function export_barangays(PDO $pdo, string $outputDir, array $scope): void
{
    $cityIds = $scope['include_all']
        ? one_column($pdo, 'SELECT id FROM location_city WHERE active = 1 ORDER BY id')
        : $scope['city_ids'];

    foreach ($cityIds as $cityId) {
        $data = rows($pdo, "
            SELECT b.id, b.id AS code, b.name, 'barangay' AS type
            FROM location_barangays b
            WHERE b.active = 1
              AND b.city_id = :city_id
            ORDER BY b.name, b.id
        ", [':city_id' => $cityId]);
        if (count($data) > 0) {
            write_json($outputDir . '/psgc/barangays/' . $cityId . '.json', $data);
        }
    }
}

function export_bounds_and_centroids(PDO $pdo, string $outputDir, array $selectedCityIds, string $geometryScope): void
{
    $params = [];
    $where = 'b.active = 1 AND c.active = 1';
    if ($geometryScope !== 'all') {
        if (count($selectedCityIds) === 0) {
            return;
        }
        $where .= ' AND b.city_id IN (' . placeholders('city', count($selectedCityIds), $params, $selectedCityIds) . ')';
    }

    $barangayBounds = [];
    $barangayCentroids = [];
    foreach (rows($pdo, "
        SELECT
            b.id AS barangay_id,
            g.min_lat,
            g.max_lat,
            g.min_lng,
            g.max_lng,
            ST_Y(g.centroid) AS centroid_lat,
            ST_X(g.centroid) AS centroid_lng
        FROM location_barangay_geometries g
        JOIN location_barangays b ON b.id = g.barangay_id
        JOIN location_city c ON c.id = b.city_id
        WHERE {$where}
        ORDER BY b.id
    ", $params) as $row) {
        $barangayId = (string)$row['barangay_id'];
        $barangayBounds[$barangayId] = [
            'south' => (float)$row['min_lat'],
            'west' => (float)$row['min_lng'],
            'north' => (float)$row['max_lat'],
            'east' => (float)$row['max_lng'],
        ];
        if ($row['centroid_lat'] !== null && $row['centroid_lng'] !== null) {
            $barangayCentroids[$barangayId] = [
                'lat' => (float)$row['centroid_lat'],
                'lng' => (float)$row['centroid_lng'],
            ];
        }
    }

    $cityBounds = [];
    foreach (rows($pdo, "
        SELECT
            c.id AS city_id,
            MIN(g.min_lat) AS south,
            MIN(g.min_lng) AS west,
            MAX(g.max_lat) AS north,
            MAX(g.max_lng) AS east
        FROM location_barangay_geometries g
        JOIN location_barangays b ON b.id = g.barangay_id
        JOIN location_city c ON c.id = b.city_id
        WHERE {$where}
        GROUP BY c.id
        ORDER BY c.id
    ", $params) as $row) {
        $cityBounds[(string)$row['city_id']] = [
            'south' => (float)$row['south'],
            'west' => (float)$row['west'],
            'north' => (float)$row['north'],
            'east' => (float)$row['east'],
        ];
    }

    write_json($outputDir . '/geo/bounds/barangays.json', $barangayBounds);
    write_json($outputDir . '/geo/bounds/cities.json', $cityBounds);
    write_json($outputDir . '/geo/centroids/barangays.json', $barangayCentroids);
}

function export_polygons(PDO $pdo, string $outputDir, array $selectedCityIds, string $geometryScope): void
{
    $params = [];
    $where = 'b.active = 1 AND c.active = 1';
    if ($geometryScope !== 'all') {
        if (count($selectedCityIds) === 0) {
            return;
        }
        $where .= ' AND b.city_id IN (' . placeholders('city', count($selectedCityIds), $params, $selectedCityIds) . ')';
    }

    foreach (rows($pdo, "
        SELECT
            b.id AS barangay_id,
            b.city_id,
            ST_AsGeoJSON(COALESCE(g.boundary_simplified, g.boundary)) AS geojson
        FROM location_barangay_geometries g
        JOIN location_barangays b ON b.id = g.barangay_id
        JOIN location_city c ON c.id = b.city_id
        WHERE {$where}
        ORDER BY b.city_id, b.id
    ", $params) as $row) {
        $points = geojson_outer_ring_to_points((string)$row['geojson']);
        if (count($points) >= 3) {
            write_json($outputDir . '/geo/polygons/barangays/' . $row['city_id'] . '/' . $row['barangay_id'] . '.json', $points);
        }
    }
}

function placeholders(string $prefix, int $count, array &$params, array $values): string
{
    $tokens = [];
    for ($i = 0; $i < $count; $i++) {
        $token = ':' . $prefix . '_' . $i;
        $tokens[] = $token;
        $params[$token] = $values[$i];
    }
    return implode(',', $tokens);
}

function geojson_outer_ring_to_points(string $geojson): array
{
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

function write_manifest(string $outputDir, array $manifest): void
{
    write_json($outputDir . '/fixture-manifest.json', $manifest);
}
