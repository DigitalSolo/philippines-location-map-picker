<?php
declare(strict_types=1);

/**
 * Backfill location_barangay_geometries from the GeoRisk/PSA Barangay Boundary ArcGIS layer.
 *
 * This is a CLI script. It does not create or change tables.
 *
 * Example:
 * php server/php/backfill-location-barangay-geometries.php --env=C:\www\ab\.env --database=anitas
 *
 * Direct credentials:
 * php server/php/backfill-location-barangay-geometries.php --host=127.0.0.1 --database=anitas --user=root --password=secret
 */

const DEFAULT_SOURCE_URL = 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/4/query';

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
    $password = option_value($options, 'password', ['DB_PASS','DB_PASSWORD', 'MYSQL_PASSWORD'], '');
    $charset = option_value($options, 'charset', ['DB_CHARSET'], 'utf8mb4');

    if ($database === '') {
        throw new RuntimeException('Missing database. Pass --database=anitas or set DB_DATABASE in the env file.');
    }

    $sourceUrl = (string)($options['source-url'] ?? DEFAULT_SOURCE_URL);
    $pageSize = max(1, min((int)($options['page-size'] ?? 1000), 20000));
    $sleepMs = max(0, (int)($options['sleep-ms'] ?? 150));
    $startOffset = max(0, (int)($options['start-offset'] ?? 0));
    $maxPages = isset($options['max-pages']) ? max(1, (int)$options['max-pages']) : null;
    $dryRun = isset($options['dry-run']);

    $pdo = connect_pdo($host, $port, $database, $user, $password, $charset);
    $knownBarangayIds = load_existing_barangay_ids($pdo);

    if (count($knownBarangayIds) === 0) {
        throw new RuntimeException('No rows found in location_barangays. Import canonical PSGC barangays before geometry.');
    }

    $insert = $pdo->prepare("
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
            POINT(:centroid_lng, :centroid_lat),
            :min_lat,
            :max_lat,
            :min_lng,
            :max_lng,
            :source,
            :source_ref
        )
        ON DUPLICATE KEY UPDATE
            boundary = VALUES(boundary),
            boundary_simplified = NULL,
            centroid = VALUES(centroid),
            min_lat = VALUES(min_lat),
            max_lat = VALUES(max_lat),
            min_lng = VALUES(min_lng),
            max_lng = VALUES(max_lng),
            source = VALUES(source),
            source_ref = VALUES(source_ref),
            updated_at = CURRENT_TIMESTAMP
    ");

    $offset = $startOffset;
    $page = 0;
    $seen = 0;
    $inserted = 0;
    $skippedNoGeometry = 0;
    $skippedNoPsgc = 0;
    $skippedMissingParent = 0;
    $skippedBadGeometry = 0;

    while (true) {
        if ($maxPages !== null && $page >= $maxPages) {
            break;
        }

        $payload = fetch_arcgis_geojson_page($sourceUrl, $offset, $pageSize);
        $features = $payload['features'] ?? [];

        if (!is_array($features) || count($features) === 0) {
            break;
        }

        $page++;
        $pageInserted = 0;

        if (!$dryRun) {
            $pdo->beginTransaction();
        }

        foreach ($features as $feature) {
            $seen++;

            $properties = $feature['properties'] ?? [];
            $geometry = $feature['geometry'] ?? null;

            if (!is_array($geometry)) {
                $skippedNoGeometry++;
                continue;
            }

            $barangayId = extract_psgc_10d($properties);

            if ($barangayId === '') {
                $skippedNoPsgc++;
                continue;
            }

            if (!isset($knownBarangayIds[$barangayId])) {
                $skippedMissingParent++;
                continue;
            }

            try {
                $wkt = geojson_geometry_to_multipolygon_wkt($geometry);
                $bbox = geojson_geometry_bbox($geometry);
            } catch (Throwable $e) {
                $skippedBadGeometry++;
                continue;
            }

            $centroidLng = ($bbox['min_lng'] + $bbox['max_lng']) / 2;
            $centroidLat = ($bbox['min_lat'] + $bbox['max_lat']) / 2;

            if (!$dryRun) {
                $insert->execute([
                    ':barangay_id' => $barangayId,
                    ':boundary_wkt' => $wkt,
                    ':centroid_lng' => format_decimal($centroidLng, 8),
                    ':centroid_lat' => format_decimal($centroidLat, 8),
                    ':min_lat' => format_decimal($bbox['min_lat'], 7),
                    ':max_lat' => format_decimal($bbox['max_lat'], 7),
                    ':min_lng' => format_decimal($bbox['min_lng'], 7),
                    ':max_lng' => format_decimal($bbox['max_lng'], 7),
                    ':source' => 'georisk_arcgis_psa_barangay_boundary',
                    ':source_ref' => make_source_ref($properties),
                ]);
            }

            $inserted++;
            $pageInserted++;
        }

        if (!$dryRun) {
            $pdo->commit();
        }

        echo sprintf(
            "Page %d offset %d: fetched=%d saved=%d total_saved=%d skipped_missing_parent=%d skipped_no_psgc=%d skipped_no_geometry=%d skipped_bad_geometry=%d\n",
            $page,
            $offset,
            count($features),
            $pageInserted,
            $inserted,
            $skippedMissingParent,
            $skippedNoPsgc,
            $skippedNoGeometry,
            $skippedBadGeometry
        );

        $offset += $pageSize;

        if (count($features) < $pageSize) {
            break;
        }

        if ($sleepMs > 0) {
            usleep($sleepMs * 1000);
        }
    }

    echo "\nBackfill complete.\n";
    echo "features_seen={$seen}\n";
    echo "saved={$inserted}\n";
    echo "skipped_missing_parent={$skippedMissingParent}\n";
    echo "skipped_no_psgc={$skippedNoPsgc}\n";
    echo "skipped_no_geometry={$skippedNoGeometry}\n";
    echo "skipped_bad_geometry={$skippedBadGeometry}\n";
    echo "dry_run=" . ($dryRun ? 'yes' : 'no') . "\n";
}

function print_help(): void
{
    echo <<<TXT
Backfill location_barangay_geometries.

Required:
  --database=NAME             Database name, unless DB_DATABASE is present in --env.

Common:
  --env=PATH                  Optional .env file.
  --host=HOST                 Default: 127.0.0.1
  --port=PORT                 Default: 3306
  --user=USER                 Default: root
  --password=PASSWORD         Default: empty
  --page-size=N               Default: 1000, maximum 20000
  --sleep-ms=N                Default: 150
  --dry-run                   Fetch and validate only; do not insert.
  --max-pages=N               Stop after N pages, useful for testing.
  --start-offset=N            Resume at ArcGIS result offset.
  --source-url=URL            Override ArcGIS query endpoint.

Examples:
  php server/php/backfill-location-barangay-geometries.php --env=C:\www\ab\.env --database=anitas
  php server/php/backfill-location-barangay-geometries.php --database=anitas --user=root --password=secret --dry-run --max-pages=1

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

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $parts = explode('=', $line, 2);

        if (count($parts) !== 2) {
            continue;
        }

        $name = trim($parts[0]);
        $value = trim($parts[1]);

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
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

function fetch_arcgis_geojson_page(string $sourceUrl, int $offset, int $pageSize): array
{
    $query = [
        'f' => 'geojson',
        'where' => '1=1',
        'outFields' => 'objectid,reg_code,prov_code,city_code,brgy_code,psgc_10d,brgy_name',
        'returnGeometry' => 'true',
        'outSR' => '4326',
        'orderByFields' => 'objectid ASC',
        'resultOffset' => (string)$offset,
        'resultRecordCount' => (string)$pageSize,
    ];

    $url = $sourceUrl . '?' . http_build_query($query);

    $json = http_get($url);

    $payload = json_decode($json, true);

    if (!is_array($payload)) {
        throw new RuntimeException('ArcGIS response was not valid JSON.');
    }

    if (isset($payload['error'])) {
        $message = $payload['error']['message'] ?? 'Unknown ArcGIS error';
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
            CURLOPT_TIMEOUT => 120,
            CURLOPT_HTTPHEADER => [
                'Accept: application/geo+json, application/json',
                'User-Agent: philippines-location-map-picker-backfill/1.0',
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
            throw new RuntimeException("HTTP request returned status {$status}");
        }

        return (string)$body;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 120,
            'header' => "Accept: application/geo+json, application/json\r\nUser-Agent: philippines-location-map-picker-backfill/1.0\r\n",
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

        if ($digits === null || $digits === '') {
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
    $objectId = (string)($properties['objectid'] ?? $properties['OBJECTID'] ?? '');
    $psgc = extract_psgc_10d($properties);
    $name = trim((string)($properties['brgy_name'] ?? $properties['BRGY_NAME'] ?? ''));

    $parts = [];

    if ($objectId !== '') {
        $parts[] = 'objectid:' . $objectId;
    }

    if ($psgc !== '') {
        $parts[] = 'psgc_10d:' . $psgc;
    }

    if ($name !== '') {
        $parts[] = 'name:' . mb_substr($name, 0, 80);
    }

    return implode(' ', $parts);
}

function geojson_geometry_to_multipolygon_wkt(array $geometry): string
{
    $type = $geometry['type'] ?? '';
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

    throw new RuntimeException('Unsupported geometry type: ' . (string)$type);
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
    $type = $geometry['type'] ?? '';
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
        throw new RuntimeException('Unsupported geometry type: ' . (string)$type);
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
