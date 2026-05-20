import { createLocationMapPickerPrefixedFieldNames, normalizeLocationMapPickerSubmitFieldNames } from '../src/host/createLocationMapPickerFieldNames.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const reportPath = process.argv.includes('--report')
  ? process.argv[process.argv.indexOf('--report') + 1]
  : 'data/field-binding-report.json';

const underscore = createLocationMapPickerPrefixedFieldNames('delivery_location');
const bracket = createLocationMapPickerPrefixedFieldNames('delivery_location', { fieldNameStyle: 'bracket' });
const explicit = normalizeLocationMapPickerSubmitFieldNames({
  fieldPrefix: 'delivery_location',
  fieldNames: { barangay_id: 'customer_barangay_id' }
});

const assertions = [
  underscore.barangay_id === 'delivery_location_barangay_id',
  underscore.pin_lat === 'delivery_location_pin_lat',
  bracket.barangay_id === 'delivery_location[barangay_id]',
  bracket.location_picker_validation_json === 'delivery_location[location_picker_validation_json]',
  explicit.barangay_id === 'customer_barangay_id',
  explicit.pin_lng === 'delivery_location_pin_lng'
];

const ok = assertions.every(Boolean);
const report = {
  ok,
  generated_at: new Date().toISOString(),
  underscore,
  bracket,
  explicit
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`Field binding contract OK: ${reportPath}`);
