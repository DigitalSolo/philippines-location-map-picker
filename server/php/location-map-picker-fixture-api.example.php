<?php
declare(strict_types=1);

/**
 * No-database PLMP fixture API.
 *
 * This exercises the same browser API provider contract as the MariaDB adapter,
 * but reads the small package fixture at data/fixtures/daet.
 */

require_once __DIR__ . '/FixtureLocationMapPickerAdapter.php';

$fixtureRoot = dirname(__DIR__, 2) . '/data/fixtures/daet';

try {
    $adapter = new FixtureLocationMapPickerAdapter($fixtureRoot);
    $endpoint = FixtureLocationMapPickerAdapter::endpointFromRequest();
    $input = FixtureLocationMapPickerAdapter::readJsonBody();

    if ($endpoint === '') {
        FixtureLocationMapPickerAdapter::sendError('missing_endpoint', 'Missing location picker endpoint.', 404);
        return;
    }

    FixtureLocationMapPickerAdapter::sendJson($adapter->handle($endpoint, $input));
} catch (InvalidArgumentException $e) {
    FixtureLocationMapPickerAdapter::sendError('unknown_endpoint', $e->getMessage(), 404);
} catch (Throwable $e) {
    FixtureLocationMapPickerAdapter::sendError('fixture_api_failed', 'Location picker fixture API failed.', 500);
}
