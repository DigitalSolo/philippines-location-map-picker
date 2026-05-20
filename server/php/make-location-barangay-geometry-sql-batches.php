<?php
declare(strict_types=1);

/**
 * Generate SQL batch files for location_barangay_geometries.
 *
 * This does not create tables automatically and does not import directly.
 * It fetches the full source layer in pages and writes small SQL files that
 * can be reviewed and imported through HeidiSQL/phpMyAdmin/CLI.
 *
 * Default source:
 * GeoRisk/PSA Barangay Boundary ArcGIS Feature Layer
 *
 * Recommended first run:
 * php server/php/make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --dry-run --max-pages=1
 *
 * Full run:
 * php server/php/make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --features-per-batch=250
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

    $packageRoot = realpath(__DIR__ . '/../..');
    $defaultOutputDir = ($packageRoot !== false ? $packageRoot : getcwd()) . DIRECTORY_SEPARATOR . 'db' . DIRECTORY_SEPARATOR . 'geometry-batches';

    $outputDir = (string)($options['output-dir'] ?? $defaultOutputDir);
    $sourceUrl = (string)($options['source-url'] ?? DEFAULT_SOURCE_URL);
    $where = (string)($options['where'] ?? '1=1');

    $pageSize = max(1, min((int)($options['page-size'] ?? 1000), 20000));
    $featuresPerBatch = max(1, min((int)($options['features-per-batch'] ?? 250), 5000));
    $sleepMs = max(0, (int)($options['sleep-ms'] ?? 150));
    $startOffset = max(0, (int)($options['start-offset'] ?? 0));
    $maxPages = isset($options['max-pages']) ? max(1, (int)$options['max-pages']) : null;
    $dryRun = isset($options['dry-run']);
    $includeMissingParent = isset($options['include-missing-parent']);

    $knownBarangayIds = [];
    $pdo = null;

    $database = option_value($options, 'database', ['DB_DATABASE', 'DB_NAME', 'MYSQL_DATABASE'], '');

    if ($database !== '') {
        $host = option_value($options, 'host', ['DB_HOST', 'MYSQL_HOST'], '127.0.0.1');
        $port = option_value($options, 'port', ['DB_PORT', 'MYSQL_PORT'], '3306');
        $user = option_value($options, 'user', ['DB_USER', 'DB_USERNAME', 'MYSQL_USER'], 'root');
        $password = option_value($options, 'password', ['DB_PASS','DB_PASSWORD', 'MYSQL_PASSWORD'], '');
        $charset = option_value($options, 'charset', ['DB_CHARSET'], 'utf8mb4');

        $pdo = connect_pdo($host, $port, $database, $user, $password, $charset);
        $knownBarangayIds = load_existing_barangay_ids($pdo);

        echo 'Loaded parent barangay ids: ' . count($knownBarangayIds) . PHP_EOL;
    } else {
        echo "No database supplied. Parent-row filtering is disabled. Generated SQL may fail if parent barangay ids are missing.\n";
    }

    if (!$dryRun) {
        ensure_clean_output_dir($outputDir);
    }

    $totalCount = fetch_arcgis_count($sourceUrl, $where);
    echo 'Source feature count: ' . $totalCount . PHP_EOL;

    $manifest = [
        'generated_at' => date('c'),
        'source_url' => $sourceUrl,
        'source_name' => DEFAULT_SOURCE_NAME,
        'where' => $where,
        'source_feature_count' => $totalCount,
        'page_size' => $pageSize,
        'features_per_batch' => $featuresPerBatch,
        'start_offset' => $startOffset,
        'dry_run' => $dryRun,
        'database_filter_enabled' => $database !== '',
        'include_missing_parent' => $includeMissingParent,
        'files' => [],
        'counts' => [
            'features_seen' => 0,
            'rows_written' => 0,
            'skipped_missing_parent' => 0,
            'skipped_no_psgc' => 0,
            'skipped_no_geometry' => 0,
            'skipped_bad_geometry' => 0,
        ],
    ];

    $missingParentRows = [];
    $batchNo = 0;
    $batchRowCount = 0;
    $batchFile = null;
    $batchPath = '';

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
        $pageWritten = 0;

        foreach ($features as $feature) {
            $manifest['counts']['features_seen']++;

            $properties = is_array($feature['properties'] ?? null) ? $feature['properties'] : [];
            $geometry = $feature['geometry'] ?? null;

            if (!is_array($geometry)) {
                $manifest['counts']['skipped_no_geometry']++;
                continue;
            }

            $barangayId = extract_psgc_10d($properties);

            if ($barangayId === '') {
                $manifest['counts']['skipped_no_psgc']++;
                continue;
            }

            if (count($knownBarangayIds) > 0 && !isset($knownBarangayIds[$barangayId])) {
                $missingParentRows[] = [
                    'barangay_id' => $barangayId,
                    'objectid' => field_string($properties, ['objectid', 'OBJECTID']),
                    'brgy_name' => field_string($properties, ['brgy_name', 'BRGY_NAME']),
                    'city_name' => field_string($properties, ['city_name', 'CITY_NAME']),
                    'prov_name' => field_string($properties, ['prov_name', 'PROV_NAME']),
                    'reg_name' => field_string($properties, ['reg_name', 'REG_NAME']),
                ];

                if (!$includeMissingParent) {
                    $manifest['counts']['skipped_missing_parent']++;
                    continue;
                }
            }

            try {
                $wkt = geojson_geometry_to_multipolygon_wkt($geometry);
                $bbox = geojson_geometry_bbox($geometry);
            } catch (Throwable $e) {
                $manifest['counts']['skipped_bad_geometry']++;
                continue;
            }

            $centroidLng = ($bbox['min_lng'] + $bbox['max_lng']) / 2;
            $centroidLat = ($bbox['min_lat'] + $bbox['max_lat']) / 2;

            if (!$dryRun) {
                if ($batchFile === null || $batchRowCount >= $featuresPerBatch) {
                    if ($batchFile !== null) {
                        close_batch_file($batchFile);
                        $manifest['files'][] = [
                            'file' => basename($batchPath),
                            'rows' => $batchRowCount,
                        ];
                    }

                    $batchNo++;
                    $batchRowCount = 0;
                    $batchPath = $outputDir . DIRECTORY_SEPARATOR . sprintf('location_barangay_geometries_%04d.sql', $batchNo);
                    $batchFile = fopen($batchPath, 'wb');

                    if ($batchFile === false) {
                        throw new RuntimeException('Unable to create batch file: ' . $batchPath);
                    }

                    write_batch_header($batchFile, $batchNo, $sourceUrl, $where);
                }

                fwrite($batchFile, build_insert_sql(
                    $barangayId,
                    $wkt,
                    $centroidLng,
                    $centroidLat,
                    $bbox,
                    DEFAULT_SOURCE_NAME,
                    make_source_ref($properties)
                ));
            }

            $manifest['counts']['rows_written']++;
            $batchRowCount++;
            $pageWritten++;
        }

        echo sprintf(
            "Page %d offset %d: fetched=%d wrote=%d total_written=%d skipped_missing_parent=%d skipped_no_psgc=%d skipped_no_geometry=%d skipped_bad_geometry=%d\n",
            $page,
            $offset,
            count($features),
            $pageWritten,
            $manifest['counts']['rows_written'],
            $manifest['counts']['skipped_missing_parent'],
            $manifest['counts']['skipped_no_psgc'],
            $manifest['counts']['skipped_no_geometry'],
            $manifest['counts']['skipped_bad_geometry']
        );

        $offset += $pageSize;

        if (count($features) < $pageSize) {
            break;
        }

        if ($sleepMs > 0) {
            usleep($sleepMs * 1000);
        }
    }

    if (!$dryRun && $batchFile !== null) {
        close_batch_file($batchFile);
        $manifest['files'][] = [
            'file' => basename($batchPath),
            'rows' => $batchRowCount,
        ];
    }

    if (!$dryRun) {
        write_manifest($outputDir, $manifest);
        write_missing_parent_csv($outputDir, $missingParentRows);
        write_import_all_sql($outputDir, $manifest['files']);
    }

    echo "\nBatch generation complete.\n";
    echo 'features_seen=' . $manifest['counts']['features_seen'] . PHP_EOL;
    echo 'rows_written=' . $manifest['counts']['rows_written'] . PHP_EOL;
    echo 'skipped_missing_parent=' . $manifest['counts']['skipped_missing_parent'] . PHP_EOL;
    echo 'skipped_no_psgc=' . $manifest['counts']['skipped_no_psgc'] . PHP_EOL;
    echo 'skipped_no_geometry=' . $manifest['counts']['skipped_no_geometry'] . PHP_EOL;
    echo 'skipped_bad_geometry=' . $manifest['counts']['skipped_bad_geometry'] . PHP_EOL;

    if (!$dryRun) {
        echo 'output_dir=' . $outputDir . PHP_EOL;
    }
}

function print_help(): void
{
    echo <<<TXT
Generate SQL batches for location_barangay_geometries.

Common:
  --env=PATH                     Optional .env file.
  --database=NAME                Optional DB name. Enables filtering to existing location_barangays.id values.
  --host=HOST                    Default: 127.0.0.1
  --port=PORT                    Default: 3306
  --user=USER                    Default: root
  --password=PASSWORD            Default: empty
  --page-size=N                  ArcGIS fetch page size. Default: 1000. Maximum: 20000.
  --features-per-batch=N         Rows per generated SQL file. Default: 250.
  --output-dir=PATH              Default: package db/geometry-batches.
  --dry-run                      Fetch and validate only; write no SQL files.
  --max-pages=N                  Stop after N fetch pages.
  --start-offset=N               Resume at source offset.
  --sleep-ms=N                   Default: 150.
  --include-missing-parent       Include rows even when location_barangays parent id is missing.
  --where=SQL                    ArcGIS where clause. Default: 1=1.
  --source-url=URL               Override source query endpoint.

Recommended:
  php server/php/make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --dry-run --max-pages=1
  php server/php/make-location-barangay-geometry-sql-batches.php --env=C:\www\ab\.env --database=anitas --features-per-batch=250

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

function load_existing_barangay_ids(PDO $pdo): array
{
    $ids = [];
    $stmt = $pdo->query("SELECT id FROM location_barangays");

    foreach ($stmt as $row) {
        $id = (string)$row['id'];

        if ($id !== '') {
            $ids[$id] = true;
        }
    }

    return $ids;
}

function ensure_clean_output_dir(string $outputDir): void
{
    if (!is_dir($outputDir) && !mkdir($outputDir, 0775, true)) {
        throw new RuntimeException('Unable to create output directory: ' . $outputDir);
    }

    $patterns = [
        'location_barangay_geometries_*.sql',
        'location_barangay_geometries_manifest.json',
        'location_barangay_geometries_missing_parent.csv',
        'import_all_location_barangay_geometries.sql',
    ];

    foreach ($patterns as $pattern) {
        foreach (glob($outputDir . DIRECTORY_SEPARATOR . $pattern) ?: [] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
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
                'User-Agent: philippines-location-map-picker-batch-generator/1.0',
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
            'header' => "Accept: application/geo+json, application/json\r\nUser-Agent: philippines-location-map-picker-batch-generator/1.0\r\n",
        ],
    ]);

    $body = file_get_contents($url, false, $context);

    if ($body === false) {
        throw new RuntimeException('HTTP request failed and cURL is not available.');
    }

    return (string)$body;
}

function extract_psgc_10d(array $properties): string
{
    $candidateKeys = ['psgc_10d', 'PSGC_10D', 'brgy_code', 'BRGY_CODE'];

    foreach ($candidateKeys as $key) {
        if (!isset($properties[$key])) {
            continue;
        }

        $digits = preg_replace('/\D+/', '', (string)$properties[$key]);

        if (!is_string($digits) || $digits === '') {
            continue;
        }

        if (strlen($digits) === 10) {
            return $digits;
        }
    }

    return '';
}

function make_source_ref(array $properties): string
{
    $objectId = field_string($properties, ['objectid', 'OBJECTID']);
    $psgc = extract_psgc_10d($properties);
    $name = field_string($properties, ['brgy_name', 'BRGY_NAME']);
    $city = field_string($properties, ['city_name', 'CITY_NAME']);
    $province = field_string($properties, ['prov_name', 'PROV_NAME']);

    $parts = [];

    if ($objectId !== '') {
        $parts[] = 'objectid:' . $objectId;
    }

    if ($psgc !== '') {
        $parts[] = 'psgc_10d:' . $psgc;
    }

    if ($name !== '') {
        $parts[] = 'barangay:' . substr($name, 0, 70);
    }

    if ($city !== '') {
        $parts[] = 'city:' . substr($city, 0, 70);
    }

    if ($province !== '') {
        $parts[] = 'province:' . substr($province, 0, 70);
    }

    return implode(' ', $parts);
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

function build_insert_sql(
    string $barangayId,
    string $boundaryWkt,
    float $centroidLng,
    float $centroidLat,
    array $bbox,
    string $source,
    string $sourceRef
): string {
    $pointWkt = 'POINT(' . format_decimal($centroidLng, 8) . ' ' . format_decimal($centroidLat, 8) . ')';

    return "INSERT INTO location_barangay_geometries (\n"
        . "    barangay_id, boundary, boundary_simplified, centroid,\n"
        . "    min_lat, max_lat, min_lng, max_lng, source, source_ref\n"
        . ") VALUES (\n"
        . "    " . sql_quote($barangayId) . ",\n"
        . "    ST_GeomFromText(" . sql_quote($boundaryWkt) . "),\n"
        . "    NULL,\n"
        . "    ST_GeomFromText(" . sql_quote($pointWkt) . "),\n"
        . "    " . sql_number($bbox['min_lat'], 7) . ",\n"
        . "    " . sql_number($bbox['max_lat'], 7) . ",\n"
        . "    " . sql_number($bbox['min_lng'], 7) . ",\n"
        . "    " . sql_number($bbox['max_lng'], 7) . ",\n"
        . "    " . sql_quote($source) . ",\n"
        . "    " . sql_quote($sourceRef) . "\n"
        . ") ON DUPLICATE KEY UPDATE\n"
        . "    boundary = VALUES(boundary),\n"
        . "    boundary_simplified = VALUES(boundary_simplified),\n"
        . "    centroid = VALUES(centroid),\n"
        . "    min_lat = VALUES(min_lat),\n"
        . "    max_lat = VALUES(max_lat),\n"
        . "    min_lng = VALUES(min_lng),\n"
        . "    max_lng = VALUES(max_lng),\n"
        . "    source = VALUES(source),\n"
        . "    source_ref = VALUES(source_ref),\n"
        . "    updated_at = CURRENT_TIMESTAMP;\n\n";
}

function write_batch_header($handle, int $batchNo, string $sourceUrl, string $where): void
{
    fwrite($handle, "-- location_barangay_geometries batch " . $batchNo . "\n");
    fwrite($handle, "-- Generated: " . date('c') . "\n");
    fwrite($handle, "-- Source: " . $sourceUrl . "\n");
    fwrite($handle, "-- Where: " . $where . "\n\n");
    fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
    fwrite($handle, "START TRANSACTION;\n\n");
}

function close_batch_file($handle): void
{
    fwrite($handle, "COMMIT;\n");
    fclose($handle);
}

function write_manifest(string $outputDir, array $manifest): void
{
    $path = $outputDir . DIRECTORY_SEPARATOR . 'location_barangay_geometries_manifest.json';
    file_put_contents($path, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function write_missing_parent_csv(string $outputDir, array $rows): void
{
    $path = $outputDir . DIRECTORY_SEPARATOR . 'location_barangay_geometries_missing_parent.csv';
    $handle = fopen($path, 'wb');

    if ($handle === false) {
        throw new RuntimeException('Unable to create missing parent CSV.');
    }

    fputcsv($handle, ['barangay_id', 'objectid', 'brgy_name', 'city_name', 'prov_name', 'reg_name']);

    foreach ($rows as $row) {
        fputcsv($handle, [
            $row['barangay_id'],
            $row['objectid'],
            $row['brgy_name'],
            $row['city_name'],
            $row['prov_name'],
            $row['reg_name'],
        ]);
    }

    fclose($handle);
}

function write_import_all_sql(string $outputDir, array $files): void
{
    $path = $outputDir . DIRECTORY_SEPARATOR . 'import_all_location_barangay_geometries.sql';
    $lines = [
        '-- Import helper generated for MySQL/MariaDB CLI.',
        '-- HeidiSQL users can open and run the individual batch files instead.',
        '-- The SOURCE command is handled by the mysql client, not by the MariaDB server.',
        '',
    ];

    foreach ($files as $file) {
        $batch = str_replace('\\', '/', (string)$file['file']);
        $lines[] = 'SOURCE ' . $batch . ';';
    }

    file_put_contents($path, implode("\n", $lines) . "\n");
}

function sql_quote(string $value): string
{
    return "'" . str_replace("'", "''", $value) . "'";
}

function sql_number(float $number, int $scale): string
{
    return format_decimal($number, $scale);
}

function format_decimal(float $number, int $scale): string
{
    return rtrim(rtrim(sprintf('%.' . $scale . 'F', $number), '0'), '.');
}
