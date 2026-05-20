<?php
declare(strict_types=1);

/**
 * Database-backed PLMP JSON API example.
 *
 * Copy this file into your host project and replace the PDO bootstrap section.
 * Route it as /api/location-map-picker/{endpoint} or pass ?endpoint=regions.
 */

require_once __DIR__ . '/LocationMapPickerDatabaseAdapter.php';

// Replace this block with your application's existing PDO/bootstrap.
$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=your_database;charset=utf8mb4',
    'your_user',
    'your_password',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

try {
    $adapter = new LocationMapPickerDatabaseAdapter($pdo);
    $endpoint = LocationMapPickerDatabaseAdapter::endpointFromRequest();
    $input = LocationMapPickerDatabaseAdapter::readJsonBody();

    if ($endpoint === '') {
        LocationMapPickerDatabaseAdapter::sendError('missing_endpoint', 'Missing location picker endpoint.', 404);
        return;
    }

    LocationMapPickerDatabaseAdapter::sendJson($adapter->handle($endpoint, $input));
} catch (InvalidArgumentException $e) {
    LocationMapPickerDatabaseAdapter::sendError('unknown_endpoint', $e->getMessage(), 404);
} catch (Throwable $e) {
    LocationMapPickerDatabaseAdapter::sendError('location_picker_api_failed', 'Location picker API failed.', 500);
}
