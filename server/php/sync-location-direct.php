<?php
declare(strict_types=1);

/**
 * Directly sync Philippine location hierarchy + barangay geometry into MariaDB.
 *
 * This script writes directly to:
 * - location_regions
 * - location_provinces
 * - location_city
 * - location_barangays
 * - location_barangay_geometries
 *
 * It does not generate SQL batch files.
 * It does not create tables automatically.
 *
 * First run:
 * php server/php/sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas --dry-run --max-pages=1
 *
 * Full run:
 * php server/php/sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas
 */

const DEFAULT_SOURCE_URL = 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4/query';
const DEFAULT_SOURCE_NAME = 'georisk_arcgis_psa_barangay_boundary';

main($argv);

function main(array $argv): void
{
    $options = parse_cli_options($argv);

    if (isset($options['help'])) {
        print_help();
        return;
    }

    if (isset($options['env'])) {
        load_env_file((string)$options['env']);
    }

    $host = option_value($options, 'host', ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
    $port = option_value($options, 'port', ['DB_PORT', 'MYSQL_PORT'], '3306');
    $database = option_value($options, 'database', ['DB_DATABASE', 'DB_NAME', 'MYSQL_DATABASE'], '');
    $user = option_value($options, 'user', ['DB_USER', 'DB_USERNAME', 'MYSQL_USER'], 'root');
    $password = option_value($options, 'password', ['DB_PASS', 'MYSQL_PASSWORD'], '');
    $charset = option_value($options, 'charset', ['DB_CHARSET'], 'utf8mb4');

    if ($database === '') {
        throw new RuntimeException('Missing database. Pass --database=anitas or set DB_DATABASE in the env file.');
    }

    $sourceUrl = (string)($options['source-url'] ?? DEFAULT_SOURCE_URL);
    $where = (string)($options['where'] ?? '1=1');
    $pageSize = max(1, min((int)($options['page-size'] ?? 1000), 20000));
    $sleepMs = max(0, (int)($options['sleep-ms'] ?? 150));
    $startOffset = max(0, (int)($options['start-offset'] ?? 0));
    $maxPages = isset($options['max-pages']) ? max(1, (int)$options['max-pages']) : null;
    $dryRun = isset($options['dry-run']);
    $updateNames = isset($options['update-names']);

    $pdo = connect_pdo($host, $port, $database, $user, $password, $charset);
    assert_required_tables_exist($pdo);

    $existingCounts = get_existing_location_counts($pdo);

    $missingActive = null;
    if (isset($options['missing-active'])) {
        $missingActive = (int)$options['missing-active'] === 1 ? 1 : 0;
    } else {
        $missingActive = (int)$existingCounts['barangays'] === 0 ? 1 : 0;
    }

    echo 'Database: ' . $database . PHP_EOL;
    echo 'Existing rows: regions=' . $existingCounts['regions']
        . ' provinces=' . $existingCounts['provinces']
        . ' cities=' . $existingCounts['cities']
        . ' barangays=' . $existingCounts['barangays']
        . ' geometry=' . $existingCounts['geometries'] . PHP_EOL;
    echo 'Missing location rows inserted with active=' . $missingActive . PHP_EOL;
    echo 'Name updates: ' . ($updateNames ? 'enabled' : 'disabled') . PHP_EOL;
    echo 'Dry run: ' . ($dryRun ? 'yes' : 'no') . PHP_EOL;

    $statements = prepare_statements($pdo, $updateNames);

    $sourceCount = fetch_arcgis_count($sourceUrl, $where);
    echo 'Source feature count: ' . $sourceCount . PHP_EOL;

    $seenRegions = load_existing_ids($pdo, 'location_regions');
    $seenProvinces = load_existing_ids($pdo, 'location_provinces');
    $seenCities = load_existing_ids($pdo, 'location_city');
    $seenBarangays = load_existing_ids($pdo, 'location_barangays');

    $counts = [
        'features_seen' => 0,
        'regions_inserted' => 0,
        'provinces_inserted' => 0,
        'cities_inserted' => 0,
        'barangays_inserted' => 0,
        'geometries_written' => 0,
        'skipped_no_psgc' => 0,
        'skipped_missing_names' => 0,
        'skipped_no_geometry' => 0,
        'skipped_bad_geometry' => 0,
        'skipped_db_error' => 0,
    ];

    $offset = $startOffset;
    $page = 0;

    while (true) {
        if ($maxPages !== null && $page >= $maxPages) {
            break;
        }

        $payload = fetch_arcgis_geojson_page($sourceUrl, $where, $offset, $pageSize);
        $features = $payload['features'] ?? [];

        if (!is_array($features) || count($features) === 0) {
            break;
        }

        $page++;
        $pageCounts = array_fill_keys(array_keys($counts), 0);

        if (!$dryRun) {
            $pdo->beginTransaction();
        }

        foreach ($features as $feature) {
            $counts['features_seen']++;
            $pageCounts['features_seen']++;

            $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
            $geometry = $feature['geometry'] ?? null;

            $ids = extract_location_ids($properties);
            $names = extract_location_names($properties, $ids);

            if ($ids['barangay_id'] === '') {
                $counts['skipped_no_psgc']++;
                $pageCounts['skipped_no_psgc']++;
                continue;
            }

            if ($ids['region_id'] === '' || $ids['province_id'] === '' || $ids['city_id'] === '') {
                $counts['skipped_no_psgc']++;
                $pageCounts['skipped_no_psgc']++;
                continue;
            }

            if ($names['region_name'] === '' || $names['province_name'] === '' || $names['city_name'] === '' || $names['barangay_name'] === '') {
                $counts['skipped_missing_names']++;
                $pageCounts['skipped_missing_names']++;
                continue;
            }

            if (!is_array($geometry)) {
                $counts['skipped_no_geometry']++;
                $pageCounts['skipped_no_geometry']++;
                continue;
            }

            try {
                $wkt = geojson_geometry_to_multipolygon_wkt($geometry);
                $bbox = geojson_geometry_bbox($geometry);
            } catch (Throwable $e) {
                $counts['skipped_bad_geometry']++;
                $pageCounts['skipped_bad_geometry']++;
                continue;
            }

            $centroidLng = ($bbox['min_lng'] + $bbox['max_lng']) / 2;
            $centroidLat = ($bbox['min_lat'] + $bbox['max_lat']) / 2;
            $sourceRef = make_source_ref($properties);

            try {
                if (!$dryRun) {
                    $statements['region']->execute([
                        ':id' => $ids['region_id'],
                        ':name' => $names['region_name'],
                        ':active' => isset($seenRegions[$ids['region_id']]) ? 1 : $missingActive,
                    ]);

                    $statements['province']->execute([
                        ':id' => $ids['province_id'],
                        ':name' => $names['province_name'],
                        ':active' => isset($seenProvinces[$ids['province_id']]) ? 1 : $missingActive,
                        ':regions_id' => $ids['region_id'],
                    ]);

                    $statements['city']->execute([
                        ':id' => $ids['city_id'],
                        ':name' => $names['city_name'],
                        ':active' => isset($seenCities[$ids['city_id']]) ? 1 : $missingActive,
                        ':provinces_id' => $ids['province_id'],
                    ]);

                    $statements['barangay']->execute([
                        ':id' => $ids['barangay_id'],
                        ':name' => $names['barangay_name'],
                        ':city_id' => $ids['city_id'],
                        ':active' => isset($seenBarangays[$ids['barangay_id']]) ? 1 : $missingActive,
                    ]);

                    $statements['geometry']->execute([
                        ':barangay_id' => $ids['barangay_id'],
                        ':boundary_wkt' => $wkt,
                        ':centroid_wkt' => 'POINT(' . format_decimal($centroidLng, 8) . ' ' . format_decimal($centroidLat, 8) . ')',
                        ':min_lat' => format_decimal($bbox['min_lat'], 7),
                        ':max_lat' => format_decimal($bbox['max_lat'], 7),
                        ':min_lng' => format_decimal($bbox['min_lng'], 7),
                        ':max_lng' => format_decimal($bbox['max_lng'], 7),
                        ':source' => DEFAULT_SOURCE_NAME,
                        ':source_ref' => $sourceRef,
                    ]);
                }

                if (!isset($seenRegions[$ids['region_id']])) {
                    $seenRegions[$ids['region_id']] = true;
                    $counts['regions_inserted']++;
                    $pageCounts['regions_inserted']++;
                }

                if (!isset($seenProvinces[$ids['province_id']])) {
                    $seenProvinces[$ids['province_id']] = true;
                    $counts['provinces_inserted']++;
                    $pageCounts['provinces_inserted']++;
                }

                if (!isset($seenCities[$ids['city_id']])) {
                    $seenCities[$ids['city_id']] = true;
                    $counts['cities_inserted']++;
                    $pageCounts['cities_inserted']++;
                }

                if (!isset($seenBarangays[$ids['barangay_id']])) {
                    $seenBarangays[$ids['barangay_id']] = true;
                    $counts['barangays_inserted']++;
                    $pageCounts['barangays_inserted']++;
                }

                $counts['geometries_written']++;
                $pageCounts['geometries_written']++;
            } catch (Throwable $e) {
                $counts['skipped_db_error']++;
                $pageCounts['skipped_db_error']++;

                echo 'DB error for barangay ' . $ids['barangay_id'] . ': ' . $e->getMessage() . PHP_EOL;
            }
        }

        if (!$dryRun) {
            $pdo->commit();
        }

        echo sprintf(
            "Page %d offset %d: fetched=%d geometry=%d new_regions=%d new_provinces=%d new_cities=%d new_barangays=%d skipped_no_psgc=%d skipped_missing_names=%d skipped_no_geometry=%d skipped_bad_geometry=%d skipped_db_error=%d\n",
            $page,
            $offset,
            count($features),
            $pageCounts['geometries_written'],
            $pageCounts['regions_inserted'],
            $pageCounts['provinces_inserted'],
            $pageCounts['cities_inserted'],
            $pageCounts['barangays_inserted'],
            $pageCounts['skipped_no_psgc'],
            $pageCounts['skipped_missing_names'],
            $pageCounts['skipped_no_geometry'],
            $pageCounts['skipped_bad_geometry'],
            $pageCounts['skipped_db_error']
        );

        $offset += $pageSize;

        if (count($features) < $pageSize) {
            break;
        }

        if ($sleepMs > 0) {
            usleep($sleepMs * 1000);
        }
    }

    echo "\nDirect sync complete.\n";
    foreach ($counts as $key => $value) {
        echo $key . '=' . $value . PHP_EOL;
    }
}

function print_help(): void
{
    echo <<<TXT
Directly sync Philippine location hierarchy and barangay geometry into MariaDB.

Required:
  --database=NAME                  Database name unless DB_DATABASE is in --env.

Common:
  --env=PATH                       Optional .env file.
  --host=HOST                      Default: 127.0.0.1
  --port=PORT                      Default: 3306
  --user=USER                      Default: root
  --password=PASSWORD              Default: empty
  --dry-run                        Fetch and validate without writing.
  --max-pages=N                    Stop after N source pages.
  --page-size=N                    Default: 1000, maximum: 20000.
  --start-offset=N                 Resume at source offset.
  --sleep-ms=N                     Default: 150.
  --missing-active=0|1             Active value for rows missing from your current tables.
                                   Default: 0 when location_barangays already has rows,
                                   otherwise 1 for an empty initial seed.
  --update-names                   Update names on existing location rows.
                                   Default is safer: preserve existing names.
  --where=SQL                      ArcGIS where clause. Default: 1=1.
  --source-url=URL                 Override source query endpoint.

Recommended:
  php server/php/sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas --dry-run --max-pages=1
  php server/php/sync-location-direct.php --env=C:\www\anitas-crud\.env --database=anitas

TXT;
}

function parse_cli_options(array $argv): array
{
    $options = [];

    foreach (array_slice($argv, 1) as $arg) {
        if (substr($arg, 0, 2) !== '--') {
            continue;
        }

        $arg = substr($arg, 2);
        $parts = explode('=', $arg, 2);

        if (count($parts) === 1) {
            $options[$parts[0]] = true;
        } else {
            $options[$parts[0]] = $parts[1];
        }
    }

    return $options;
}

function option_value(array $options, string $optionName, array $envNames, string $default): string
{
    if (array_key_exists($optionName, $options)) {
        return (string)$options[$optionName];
    }

    foreach ($envNames as $envName) {
        $value = getenv($envName);

        if ($value !== false && $value !== '') {
            return (string)$value;
        }
    }

    return $default;
}

function load_env_file(string $path): void
{
    if (!is_file($path)) {
        throw new RuntimeException("Env file not found: {$path}");
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        throw new RuntimeException("Unable to read env file: {$path}");
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

        if (
            strlen($value) >= 2 &&
            (
                (substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")
            )
        ) {
            $value = substr($value, 1, -1);
        }

        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

function connect_pdo(string $host, string $port, string $database, string $user, string $password, string $charset): PDO
{
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";

    return new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function assert_required_tables_exist(PDO $pdo): void
{
    $required = [
        'location_regions',
        'location_provinces',
        'location_city',
        'location_barangays',
        'location_barangay_geometries',
    ];

    foreach ($required as $table) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS c
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
        ");
        $stmt->execute([':table' => $table]);
        $count = (int)$stmt->fetchColumn();

        if ($count !== 1) {
            throw new RuntimeException('Required table is missing: ' . $table);
        }
    }
}

function get_existing_location_counts(PDO $pdo): array
{
    return [
        'regions' => table_count($pdo, 'location_regions'),
        'provinces' => table_count($pdo, 'location_provinces'),
        'cities' => table_count($pdo, 'location_city'),
        'barangays' => table_count($pdo, 'location_barangays'),
        'geometries' => table_count($pdo, 'location_barangay_geometries'),
    ];
}

function table_count(PDO $pdo, string $table): int
{
    return (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
}

function load_existing_ids(PDO $pdo, string $table): array
{
    $ids = [];
    $stmt = $pdo->query("SELECT id FROM `{$table}`");

    if ($table === 'location_barangay_geometries') {
        $stmt = $pdo->query("SELECT barangay_id AS id FROM `{$table}`");
    }

    foreach ($stmt as $row) {
        $id = (string)$row['id'];

        if ($id !== '') {
            $ids[$id] = true;
        }
    }

    return $ids;
}

function prepare_statements(PDO $pdo, bool $updateNames): array
{
    $nameUpdateSql = $updateNames ? 'name = VALUES(name),' : '';

    return [
        'region' => $pdo->prepare("
            INSERT INTO location_regions (id, name, active)
            VALUES (:id, :name, :active)
            ON DUPLICATE KEY UPDATE
                {$nameUpdateSql}
                active = active
        "),
        'province' => $pdo->prepare("
            INSERT INTO location_provinces (id, name, active, regions_id)
            VALUES (:id, :name, :active, :regions_id)
            ON DUPLICATE KEY UPDATE
                {$nameUpdateSql}
                regions_id = VALUES(regions_id),
                active = active
        "),
        'city' => $pdo->prepare("
            INSERT INTO location_city (id, name, active, provinces_id)
            VALUES (:id, :name, :active, :provinces_id)
            ON DUPLICATE KEY UPDATE
                {$nameUpdateSql}
                provinces_id = VALUES(provinces_id),
                active = active
        "),
        'barangay' => $pdo->prepare("
            INSERT INTO location_barangays (id, name, city_id, active)
            VALUES (:id, :name, :city_id, :active)
            ON DUPLICATE KEY UPDATE
                {$nameUpdateSql}
                city_id = VALUES(city_id),
                active = active
        "),
        'geometry' => $pdo->prepare("
            INSERT INTO location_barangay_geometries (
                barangay_id,
                boundary,
                boundary_simplified,
                centroid,
                min_lat,
                max_lat,
                min_lng,
                max_lng,
                source,
                source_ref
            ) VALUES (
                :barangay_id,
                ST_GeomFromText(:boundary_wkt),
                NULL,
                ST_GeomFromText(:centroid_wkt),
                :min_lat,
                :max_lat,
                :min_lng,
                :max_lng,
                :source,
                :source_ref
            )
            ON DUPLICATE KEY UPDATE
                boundary = VALUES(boundary),
                boundary_simplified = VALUES(boundary_simplified),
                centroid = VALUES(centroid),
                min_lat = VALUES(min_lat),
                max_lat = VALUES(max_lat),
                min_lng = VALUES(min_lng),
                max_lng = VALUES(max_lng),
                source = VALUES(source),
                source_ref = VALUES(source_ref),
                updated_at = CURRENT_TIMESTAMP
        "),
    ];
}

function fetch_arcgis_count(string $sourceUrl, string $where): int
{
    $query = [
        'f' => 'json',
        'where' => $where,
        'returnCountOnly' => 'true',
    ];

    $payload = fetch_json_url($sourceUrl . '?' . http_build_query($query));

    return (int)($payload['count'] ?? 0);
}

function fetch_arcgis_geojson_page(string $sourceUrl, string $where, int $offset, int $pageSize): array
{
    $query = [
        'f' => 'geojson',
        'where' => $where,
        'outFields' => 'objectid,reg_name,prov_name,city_name,brgy_name,reg_code,prov_code,city_code,brgy_code,psgc_10d',
        'returnGeometry' => 'true',
        'outSR' => '4326',
        'orderByFields' => 'objectid ASC',
        'resultOffset' => (string)$offset,
        'resultRecordCount' => (string)$pageSize,
    ];

    return fetch_json_url($sourceUrl . '?' . http_build_query($query));
}

function fetch_json_url(string $url): array
{
    $json = http_get($url);
    $payload = json_decode($json, true);

    if (!is_array($payload)) {
        throw new RuntimeException('HTTP response was not valid JSON.');
    }

    if (isset($payload['error'])) {
        $message = is_array($payload['error']) ? (string)($payload['error']['message'] ?? 'Unknown error') : 'Unknown error';
        throw new RuntimeException('ArcGIS error: ' . $message);
    }

    return $payload;
}

function http_get(string $url): string
{
    if (function_exists('curl_init')) {
        $handle = curl_init($url);

        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 20,
            CURLOPT_TIMEOUT => 180,
            CURLOPT_HTTPHEADER => [
                'Accept: application/geo+json, application/json',
                'User-Agent: philippines-location-map-picker-direct-sync/1.0',
            ],
        ]);

        $body = curl_exec($handle);

        if ($body === false) {
            $error = curl_error($handle);
            curl_close($handle);
            throw new RuntimeException('HTTP request failed: ' . $error);
        }

        $status = (int)curl_getinfo($handle, CURLINFO_HTTP_CODE);
        curl_close($handle);

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('HTTP request returned status ' . $status);
        }

        return (string)$body;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 180,
            'header' => "Accept: application/geo+json, application/json\r\nUser-Agent: philippines-location-map-picker-direct-sync/1.0\r\n",
        ],
    ]);

    $body = file_get_contents($url, false, $context);

    if ($body === false) {
        throw new RuntimeException('HTTP request failed and cURL is not available.');
    }

    return (string)$body;
}

function extract_location_ids(array $properties): array
{
    $barangayId = normalize_code_from_keys($properties, ['psgc_10d', 'PSGC_10D', 'brgy_code', 'BRGY_CODE'], 10);

    if ($barangayId === '') {
        return [
            'region_id' => '',
            'province_id' => '',
            'city_id' => '',
            'barangay_id' => '',
        ];
    }

    $cityId = normalize_code_from_keys($properties, ['city_code', 'CITY_CODE'], 7);
    if ($cityId === '') {
        $cityId = substr($barangayId, 0, 7);
    }

    $regionId = normalize_code_from_keys($properties, ['reg_code', 'REG_CODE'], 2);
    if ($regionId === '') {
        $regionId = substr($barangayId, 0, 2);
    }

    $provinceId = substr($cityId, 0, 5);

    return [
        'region_id' => $regionId,
        'province_id' => $provinceId,
        'city_id' => $cityId,
        'barangay_id' => $barangayId,
    ];
}

function extract_location_names(array $properties, array $ids): array
{
    $regionName = clean_name(field_string($properties, ['reg_name', 'REG_NAME']));
    $sourceProvinceName = clean_name(field_string($properties, ['prov_name', 'PROV_NAME']));
    $cityName = clean_name(field_string($properties, ['city_name', 'CITY_NAME']));
    $barangayName = clean_name(field_string($properties, ['brgy_name', 'BRGY_NAME']));

    $sourceProvinceId = normalize_code_from_keys($properties, ['prov_code', 'PROV_CODE'], 5);

    if ($sourceProvinceName !== '' && $sourceProvinceId === $ids['province_id']) {
        $provinceName = $sourceProvinceName;
    } else {
        $provinceName = $cityName;
    }

    if ($provinceName === '') {
        $provinceName = $sourceProvinceName;
    }

    return [
        'region_name' => $regionName,
        'province_name' => $provinceName,
        'city_name' => $cityName,
        'barangay_name' => $barangayName,
    ];
}

function normalize_code_from_keys(array $properties, array $keys, int $length): string
{
    foreach ($keys as $key) {
        if (!isset($properties[$key])) {
            continue;
        }

        $digits = preg_replace('/\D+/', '', (string)$properties[$key]);

        if (!is_string($digits) || $digits === '') {
            continue;
        }

        if (strlen($digits) >= $length) {
            return substr($digits, 0, $length);
        }
    }

    return '';
}

function clean_name(string $name): string
{
    $name = trim(preg_replace('/\s+/', ' ', $name) ?? $name);

    if (strlen($name) > 120) {
        $name = substr($name, 0, 120);
    }

    return $name;
}

function field_string(array $properties, array $keys): string
{
    foreach ($keys as $key) {
        if (isset($properties[$key])) {
            return trim((string)$properties[$key]);
        }
    }

    return '';
}

function make_source_ref(array $properties): string
{
    $objectId = field_string($properties, ['objectid', 'OBJECTID']);
    $psgc = normalize_code_from_keys($properties, ['psgc_10d', 'PSGC_10D', 'brgy_code', 'BRGY_CODE'], 10);
    $barangay = clean_name(field_string($properties, ['brgy_name', 'BRGY_NAME']));
    $city = clean_name(field_string($properties, ['city_name', 'CITY_NAME']));
    $province = clean_name(field_string($properties, ['prov_name', 'PROV_NAME']));

    $parts = [];

    if ($objectId !== '') {
        $parts[] = 'objectid:' . $objectId;
    }

    if ($psgc !== '') {
        $parts[] = 'psgc_10d:' . $psgc;
    }

    if ($barangay !== '') {
        $parts[] = 'barangay:' . substr($barangay, 0, 60);
    }

    if ($city !== '') {
        $parts[] = 'city:' . substr($city, 0, 60);
    }

    if ($province !== '') {
        $parts[] = 'province:' . substr($province, 0, 60);
    }

    $ref = implode(' ', $parts);

    if (strlen($ref) > 255) {
        $ref = substr($ref, 0, 255);
    }

    return $ref;
}

function geojson_geometry_to_multipolygon_wkt(array $geometry): string
{
    $type = (string)($geometry['type'] ?? '');
    $coordinates = $geometry['coordinates'] ?? null;

    if (!is_array($coordinates)) {
        throw new RuntimeException('Missing coordinates.');
    }

    if ($type === 'Polygon') {
        return 'MULTIPOLYGON((' . polygon_rings_to_wkt($coordinates) . '))';
    }

    if ($type === 'MultiPolygon') {
        $polygons = [];

        foreach ($coordinates as $polygon) {
            if (!is_array($polygon)) {
                continue;
            }

            $polygons[] = '(' . polygon_rings_to_wkt($polygon) . ')';
        }

        if (count($polygons) === 0) {
            throw new RuntimeException('Empty MultiPolygon.');
        }

        return 'MULTIPOLYGON(' . implode(',', $polygons) . ')';
    }

    throw new RuntimeException('Unsupported geometry type: ' . $type);
}

function polygon_rings_to_wkt(array $rings): string
{
    $wktRings = [];

    foreach ($rings as $ring) {
        if (!is_array($ring) || count($ring) < 3) {
            continue;
        }

        $ring = close_ring($ring);
        $points = [];

        foreach ($ring as $point) {
            if (!is_array($point) || count($point) < 2) {
                continue;
            }

            $lng = (float)$point[0];
            $lat = (float)$point[1];
            $points[] = format_decimal($lng, 8) . ' ' . format_decimal($lat, 8);
        }

        if (count($points) >= 4) {
            $wktRings[] = '(' . implode(',', $points) . ')';
        }
    }

    if (count($wktRings) === 0) {
        throw new RuntimeException('No valid polygon rings.');
    }

    return implode(',', $wktRings);
}

function close_ring(array $ring): array
{
    $first = $ring[0];
    $last = $ring[count($ring) - 1];

    if (!is_array($first) || !is_array($last) || count($first) < 2 || count($last) < 2) {
        return $ring;
    }

    if ((float)$first[0] !== (float)$last[0] || (float)$first[1] !== (float)$last[1]) {
        $ring[] = $first;
    }

    return $ring;
}

function geojson_geometry_bbox(array $geometry): array
{
    $type = (string)($geometry['type'] ?? '');
    $coordinates = $geometry['coordinates'] ?? null;

    if (!is_array($coordinates)) {
        throw new RuntimeException('Missing coordinates.');
    }

    $minLng = null;
    $maxLng = null;
    $minLat = null;
    $maxLat = null;

    if ($type === 'Polygon') {
        bbox_from_polygon($coordinates, $minLng, $maxLng, $minLat, $maxLat);
    } elseif ($type === 'MultiPolygon') {
        foreach ($coordinates as $polygon) {
            if (is_array($polygon)) {
                bbox_from_polygon($polygon, $minLng, $maxLng, $minLat, $maxLat);
            }
        }
    } else {
        throw new RuntimeException('Unsupported geometry type: ' . $type);
    }

    if ($minLng === null || $maxLng === null || $minLat === null || $maxLat === null) {
        throw new RuntimeException('Unable to compute bounding box.');
    }

    return [
        'min_lng' => $minLng,
        'max_lng' => $maxLng,
        'min_lat' => $minLat,
        'max_lat' => $maxLat,
    ];
}

function bbox_from_polygon(array $polygon, ?float &$minLng, ?float &$maxLng, ?float &$minLat, ?float &$maxLat): void
{
    foreach ($polygon as $ring) {
        if (!is_array($ring)) {
            continue;
        }

        foreach ($ring as $point) {
            if (!is_array($point) || count($point) < 2) {
                continue;
            }

            $lng = (float)$point[0];
            $lat = (float)$point[1];

            $minLng = $minLng === null ? $lng : min($minLng, $lng);
            $maxLng = $maxLng === null ? $lng : max($maxLng, $lng);
            $minLat = $minLat === null ? $lat : min($minLat, $lat);
            $maxLat = $maxLat === null ? $lat : max($maxLat, $lat);
        }
    }
}

function format_decimal(float $number, int $scale): string
{
    return rtrim(rtrim(sprintf('%.' . $scale . 'F', $number), '0'), '.');
}
