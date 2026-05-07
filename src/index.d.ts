
export type ProviderRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  [key: string]: unknown;
};

export type ProviderError = Error & {
  provider_error: true;
  provider: string;
  method: string;
  code: string;
  status: number | null;
  path: string;
  reason: string;
  cause: unknown;
};

export type ProviderNoMatch = {
  matched: false;
  reason: string;
  context: unknown;
};

export type LocationValue = {
  region_id: string;
  region_name: string;
  province_id: string;
  province_name: string;
  city_id: string;
  city_name: string;
  barangay_id: string;
  barangay_name: string;
  label: string;
  display_label: string;
  match_quality?: string;
  match_distance_km?: number;
  resolved?: boolean;
  resolved_source?: string;
};

export type PinValue = {
  lat: number;
  lng: number;
};

export type GeometryFocusResult = {
  level: string;
  id: string;
  bounds: unknown | null;
  centroid: PinValue | null;
  polygon: PinValue[] | null;
};

export type LocationMapPickerValue = {
  location: LocationValue;
  pin: PinValue | null;
  geometry: {
    focus_result: GeometryFocusResult | null;
    reverse_match: {
      match_quality: string;
      match_distance_km: number;
      barangay_id?: string;
      barangay_name?: string;
      city_id?: string;
      city_name?: string;
    } | null;
    reverse_error: string | null;
  };
};

export type LocationMapPickerTouchedState = {
  location: boolean;
  pin: boolean;
  reverse: boolean;
  geoIp: boolean;
  browserLocation: boolean;
  clear: boolean;
};

export type LocationMapPickerDirtyState = {
  dirty: boolean;
  touched: LocationMapPickerTouchedState;
  baseline: LocationMapPickerValue | null;
  value: LocationMapPickerValue;
};

export type LocationMapPickerStatusLevel = 'idle' | 'info' | 'success' | 'warning' | 'error';

export type LocationMapPickerStatusState = {
  level: LocationMapPickerStatusLevel;
  code: string;
  message: string;
};

export type LocationMapPickerErrorPayload = {
  timestamp: string;
  code: string;
  message: string;
  source: string;
  operation: string;
  recoverable: boolean;
  provider: string;
  method: string;
  status: number | null;
  path: string;
  reason: string;
  provider_error: boolean;
  raw_message: string;
};

export type LocationMapPickerDebugEvent = {
  timestamp: string;
  type: string;
  payload: unknown;
  value?: LocationMapPickerValue | null;
};

export type DebugOptions = {
  enabled?: boolean;
  maxEvents?: number;
  includeValue?: boolean;
  echoToConsole?: boolean;
};

export type ThemeOption = 'light' | 'dark' | 'auto';
export type SizeOption = 'compact' | 'comfortable' | 'spacious';
export type DensityOption = 'tight' | 'normal' | 'relaxed';
export type MapPinMode = 'centered' | 'free';
export type CssLengthValue = number | string;
export type DisplayModeOption = 'embedded' | 'modal';
export type SelectedLabelFormatOption =
  | 'region_province_city_barangay'
  | 'province_city_barangay'
  | 'city_barangay'
  | 'barangay_only';

export type UiOptions = {
  displayMode?: DisplayModeOption;
  theme?: ThemeOption;
  size?: SizeOption;
  density?: DensityOption;
  selectedLabelFormat?: SelectedLabelFormatOption;
  className?: string;
  locationClassName?: string;
  mapClassName?: string;
  messageClassName?: string;
  modalClassName?: string;
  triggerLabel?: string;
  emptyLabel?: string;
  title?: string;
  subtitle?: string;
  triggerActionLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  clearLabel?: string;
  searchPlaceholder?: string;
  showCurrentState?: boolean;
  showDebugPanel?: boolean;
};


export type LocationMapPickerMessageKey =
  | 'applyingValue'
  | 'focusBoundaryPolygon'
  | 'focusBounds'
  | 'focusCentroid'
  | 'focusNoGeometry'
  | 'pinPlaced'
  | 'reverseDisabled'
  | 'reversePinRequired'
  | 'reverseBusy'
  | 'reverseFailed'
  | 'setValueFailed'
  | 'invalidConfig'
  | 'providerFailure'
  | 'busyOverlayDefault'
  | 'reverseNoMatch'
  | 'reverseMatch'
  | 'geoIpBusy'
  | 'geoIpLookupFailed'
  | 'geoIpNoResult'
  | 'geoIpCountryMismatch'
  | 'geoIpLowAccuracy'
  | 'geoIpNoAdminMatch'
  | 'geoIpEstimate'
  | 'geoIpMapCentered'
  | 'browserLocationBusy'
  | 'browserLocationUnavailable'
  | 'browserLocationFailed'
  | 'browserLocationPermissionDenied'
  | 'browserLocationUnavailablePosition'
  | 'browserLocationTimeout'
  | 'browserLocationNoCoordinates'
  | 'browserLocationNoAdminMatch'
  | 'browserLocationEstimate'
  | 'browserLocationMapCentered';

export type LocationMapPickerMessages = Partial<Record<LocationMapPickerMessageKey, string>>;

export type HiddenInputTarget = HTMLInputElement | string;

export type HiddenInputOptions = {
  regionId?: HiddenInputTarget;
  regionName?: HiddenInputTarget;
  provinceId?: HiddenInputTarget;
  provinceName?: HiddenInputTarget;
  cityId?: HiddenInputTarget;
  cityName?: HiddenInputTarget;
  barangayId?: HiddenInputTarget;
  barangayName?: HiddenInputTarget;
  label?: HiddenInputTarget;
  pinLat?: HiddenInputTarget;
  pinLng?: HiddenInputTarget;
  valueJson?: HiddenInputTarget;
  locationJson?: HiddenInputTarget;
  pinJson?: HiddenInputTarget;
  geometryJson?: HiddenInputTarget;
  isValid?: HiddenInputTarget;
  validationJson?: HiddenInputTarget;
  isDirty?: HiddenInputTarget;
  dirtyJson?: HiddenInputTarget;
  touchedJson?: HiddenInputTarget;
  statusLevel?: HiddenInputTarget;
  statusCode?: HiddenInputTarget;
  statusMessage?: HiddenInputTarget;
  statusJson?: HiddenInputTarget;
  lastErrorJson?: HiddenInputTarget;
  debugJson?: HiddenInputTarget;
};

export type LocationPickerOptions = {
  mount: Element;
  provider: Provider;
  requiredLevel?: RequiredLocationLevel;
  messageRequiredRegion?: string;
  messageRequiredProvince?: string;
  messageRequiredCity?: string;
  messageRequiredBarangay?: string;
  hiddenInputs?: HiddenInputOptions;
  summaryLabel?: string;
  placeholder?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  modalEyebrow?: string;
  actionLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  clearLabel?: string;
  searchPlaceholder?: string;
  triggerIcon?: string;
  selectedLabelFormat?: SelectedLabelFormatOption;
  theme?: ThemeOption;
  size?: SizeOption;
  density?: DensityOption;
  className?: string;
  modalClassName?: string;
  defaultRegionId?: string;
  defaultProvinceId?: string;
  defaultCityId?: string;
  defaultBarangayId?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export type MapPickerOptions = {
  mount: Element;
  provider?: Provider;
  enabled?: boolean;
  tileUrlTemplate?: string;
  tileAttribution?: string;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  defaultCenter?: PinValue;
  defaultPin?: PinValue | null;
  selectedZoom?: number;
  cityZoom?: number;
  provinceZoom?: number;
  regionZoom?: number;
  theme?: ThemeOption;
  size?: SizeOption;
  density?: DensityOption;
  className?: string;
  statusText?: string;
  showStatus?: boolean;
  clickToPlacePin?: boolean;
  pinDraggable?: boolean;
  mouseWheelZoomCentered?: boolean;
  showBoundary?: boolean;
  fitBoundaryOnSelection?: boolean;
  boundaryPadding?: number;
  mapHeight?: CssLengthValue;
  height?: CssLengthValue;
  mapMinHeight?: CssLengthValue;
  minHeight?: CssLengthValue;
  mapMaxHeight?: CssLengthValue;
  maxHeight?: CssLengthValue;
  mapWidth?: CssLengthValue;
  width?: CssLengthValue;
  mapMinWidth?: CssLengthValue;
  minWidth?: CssLengthValue;
  mapMaxWidth?: CssLengthValue;
  maxWidth?: CssLengthValue;
  mapAspectRatio?: number | string;
  aspectRatio?: number | string;
  centerOnPin?: boolean;
  pinMode?: MapPinMode;
  lockPinToCenter?: boolean;
  firstPinVisibleWidthKm?: number;
  firstPinZoom?: number | null;
  zoomOnFirstPin?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

export type ReverseOptions = {
  enabled?: boolean;
  failOnNoMatch?: boolean;
};

export type RequiredLocationLevel = 'region' | 'province' | 'city' | 'barangay';

export type LocationPickerValidationResult = {
  valid: boolean;
  required_location_level: RequiredLocationLevel;
  missing: string[];
  messages: string[];
  location: LocationValue;
};

export type LocationMapPickerValidationResult = {
  valid: boolean;
  required_location_level: RequiredLocationLevel;
  require_pin: boolean;
  missing: string[];
  messages: string[];
  location: LocationValue;
  pin: PinValue | null;
};

export type ValidationOptions = {
  requiredLocationLevel?: RequiredLocationLevel;
  requirePin?: boolean;
  messageRequiredRegion?: string;
  messageRequiredProvince?: string;
  messageRequiredCity?: string;
  messageRequiredBarangay?: string;
  messageRequiredPin?: string;
};

export type GeoIpAccuracyLevel = 'country' | 'region' | 'province' | 'city' | 'unknown';
export type GeoIpBackfillLevel = 'country' | 'region' | 'province' | 'city' | 'barangay';

export type GeoIpResult = {
  country_code: string;
  region_name: string;
  province_name: string;
  city_name: string;
  barangay_name: string;
  lat: number | null;
  lng: number | null;
  accuracy_level: GeoIpAccuracyLevel;
  raw?: unknown;
};

export type GeoIpResolvedPayload = {
  result: GeoIpResult;
  location: LocationValue | null;
  value: LocationMapPickerValue;
};

export type GeoIpNoMatchPayload = {
  result: GeoIpResult;
  reason: string;
};

export type GeoIpOptions = {
  enabled?: boolean;
  endpoint?: string;
  lookup?: () => Promise<unknown> | unknown;
  fetchOptions?: RequestInit;
  runOnInit?: boolean;
  runOnlyWhenEmpty?: boolean;
  updateMap?: boolean;
  setPin?: boolean;
  mapZoom?: number;
  backfill?: {
    enabled?: boolean;
    maxLevel?: GeoIpBackfillLevel;
    allowCity?: boolean;
    allowBarangay?: boolean;
    reverseGeocode?: boolean;
  };
  confidence?: {
    requireCountry?: string;
    minimumAccuracyLevel?: GeoIpAccuracyLevel;
  };
};


export type BrowserLocationResult = {
  lat: number | null;
  lng: number | null;
  accuracy_meters: number | null;
  altitude: number | null;
  altitude_accuracy_meters: number | null;
  heading: number | null;
  speed_meters_per_second: number | null;
  timestamp: number;
  raw?: unknown;
};

export type BrowserLocationResolvedPayload = {
  result: BrowserLocationResult;
  location: LocationValue | null;
  value: LocationMapPickerValue;
};

export type BrowserLocationNoMatchPayload = {
  result: BrowserLocationResult;
  reason: string;
};

export type BrowserLocationOptions = {
  enabled?: boolean;
  runOnInit?: boolean;
  runOnlyWhenEmpty?: boolean;
  updateMap?: boolean;
  setPin?: boolean;
  mapZoom?: number;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  backfill?: {
    enabled?: boolean;
    maxLevel?: GeoIpBackfillLevel;
    reverseGeocode?: boolean;
  };
};

export type LocationMapPickerOptions = {
  mount: Element;
  provider: Provider;
  ui?: UiOptions;
  hiddenInputs?: HiddenInputOptions;
  location?: Partial<LocationPickerOptions>;
  map?: Partial<MapPickerOptions>;
  reverse?: ReverseOptions;
  validation?: ValidationOptions;
  geoIp?: GeoIpOptions;
  browserLocation?: BrowserLocationOptions;
  messages?: LocationMapPickerMessages;
  debug?: DebugOptions;
  initialValue?: LocationMapPickerInitialValue;
  value?: LocationMapPickerInitialValue;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (payload: LocationMapPickerValue) => void;
  onLocationChange?: (payload: LocationValue) => void;
  onPinChange?: (payload: PinValue | null) => void;
  onReverseMatch?: (payload: LocationMapPickerValue['geometry']['reverse_match']) => void;
  onReverseNoMatch?: (payload: { pin: PinValue | null; location: LocationValue }) => void;
  onGeoIpResolved?: (payload: GeoIpResolvedPayload) => void;
  onGeoIpNoMatch?: (payload: GeoIpNoMatchPayload) => void;
  onGeoIpError?: (payload: LocationMapPickerErrorPayload) => void;
  onBrowserLocationResolved?: (payload: BrowserLocationResolvedPayload) => void;
  onBrowserLocationNoMatch?: (payload: BrowserLocationNoMatchPayload) => void;
  onBrowserLocationError?: (payload: LocationMapPickerErrorPayload) => void;
  onBusyChange?: (payload: { busy: boolean; reason: string }) => void;
  onDirtyChange?: (payload: LocationMapPickerDirtyState) => void;
  onStatusChange?: (payload: LocationMapPickerStatusState) => void;
  onOpen?: (payload: { open: true }) => void;
  onClose?: (payload: { open: false }) => void;
  onOpenChange?: (payload: { open: boolean }) => void;
  onDebug?: (payload: LocationMapPickerDebugEvent) => void;
  onError?: (payload: LocationMapPickerErrorPayload) => void;
};




export type LocationMapPickerInitialValue = {
  location?: Partial<LocationValue>;
  pin?: PinValue | null;
};

export type LocationMapPickerSubmitPayload = {
  barangay_id: string;
  pin_lat: string;
  pin_lng: string;
  location_picker_value_json: string;
  location_picker_validation_json: string;
};



export type LocationMapPickerSubmitResult = {
  valid: boolean;
  blocked: boolean;
  code: 'picker_valid' | 'picker_invalid' | 'picker_busy' | 'picker_disabled' | 'picker_readonly';
  message: string;
  messages: string[];
  missing: string[];
  validation: LocationMapPickerValidationResult;
  payload: LocationMapPickerSubmitPayload;
};

export type LocationMapPickerSubmitResultOptions = {
  messageInvalid?: string;
  messageBusy?: string;
  messageDisabled?: string;
  messageReadOnly?: string;
  setStatus?: boolean;
};


export type LocationMapPickerSubmitFieldNames = Partial<{
  barangay_id: string;
  pin_lat: string;
  pin_lng: string;
  location_picker_value_json: string;
  location_picker_validation_json: string;
}>;


export type LocationMapPickerHostConfigOptions = {
  baseUrl: string;
  fieldNames?: LocationMapPickerSubmitFieldNames;
  ui?: Partial<UiOptions>;
  location?: Partial<LocationPickerOptions>;
  validation?: Partial<ValidationOptions>;
  map?: Partial<MapPickerOptions>;
  reverse?: Partial<ReverseOptions>;
};

export type LocationMapPickerHostConfig = {
  baseUrl: string;
  fieldNames: Required<LocationMapPickerSubmitFieldNames>;
  pickerOptions: Omit<StaticLocationMapPickerOptions, 'mount' | 'baseUrl' | 'providerOptions'>;
  formBinding: {
    fieldNames: Required<LocationMapPickerSubmitFieldNames>;
    preventInvalid: true;
    writePayload: true;
    focusOnBlocked: true;
  };
};

export type LocationMapPickerFormBindingOptions = LocationMapPickerSubmitResultOptions & {
  form: HTMLFormElement | string;
  picker: LocationMapPicker;
  fieldNames?: LocationMapPickerSubmitFieldNames;
  writePayload?: boolean;
  preventInvalid?: boolean;
  stopInvalidPropagation?: boolean;
  focusOnBlocked?: boolean;
  onResult?: (result: LocationMapPickerSubmitResult, event: SubmitEvent | Event | null) => void;
  onBlocked?: (result: LocationMapPickerSubmitResult, event: SubmitEvent | Event | null) => void;
  onValid?: (result: LocationMapPickerSubmitResult, event: SubmitEvent | Event | null) => void;
};

export type LocationMapPickerFormBinding = {
  form: HTMLFormElement;
  picker: LocationMapPicker;
  fieldNames: Required<LocationMapPickerSubmitFieldNames>;
  submit(event?: SubmitEvent | Event | null): LocationMapPickerSubmitResult | null;
  updatePayload(): LocationMapPickerSubmitResult;
  destroy(): void;
};

export type LocationMapPickerFormPayloadWriteResult = {
  form: HTMLFormElement;
  fieldNames: Required<LocationMapPickerSubmitFieldNames>;
  payload: LocationMapPickerSubmitPayload;
};


export type LocationMapPickerFieldControlTarget = Element | string | Element[] | NodeList;

export type LocationMapPickerValueLabelOptions = {
  format?: SelectedLabelFormatOption;
  selectedLabelFormat?: SelectedLabelFormatOption;
  separator?: string;
  emptyLabel?: string;
};

export type LocationMapPickerFieldControlsOptions = LocationMapPickerValueLabelOptions & {
  picker: LocationMapPicker;
  openButton?: LocationMapPickerFieldControlTarget;
  openControl?: LocationMapPickerFieldControlTarget;
  trigger?: LocationMapPickerFieldControlTarget;
  closeButton?: LocationMapPickerFieldControlTarget;
  closeControl?: LocationMapPickerFieldControlTarget;
  clearButton?: LocationMapPickerFieldControlTarget;
  clearControl?: LocationMapPickerFieldControlTarget;
  summary?: Element | string;
  summaryElement?: Element | string;
  status?: Element | string;
  statusElement?: Element | string;
  selectedClassName?: string;
  invalidClassName?: string;
  selectionRequiredLevel?: RequiredLocationLevel;
  requiredLocationLevel?: RequiredLocationLevel;
};

export type LocationMapPickerFieldControlsBinding = {
  picker: LocationMapPicker;
  openButtons: Element[];
  closeButtons: Element[];
  clearButtons: Element[];
  summary: Element | null;
  status: Element | null;
  update(): LocationMapPickerFieldControlsBinding;
  destroy(): void;
};

export type StaticLocationMapPickerFieldOptions = {
  mount: Element | string;
  baseUrl: string;
  pickerOptions?: Omit<StaticLocationMapPickerOptions, 'mount' | 'baseUrl'>;
  form?: HTMLFormElement | string;
  formBinding?: Omit<LocationMapPickerFormBindingOptions, 'form' | 'picker'>;
  controls?: Omit<LocationMapPickerFieldControlsOptions, 'picker'>;
  initialValue?: LocationMapPickerInitialValue;
  resetDirtyOnInitialValue?: boolean;
  trackDirtyOnInitialValue?: boolean;
  openOnMount?: boolean;
};

export type StaticLocationMapPickerFieldController = {
  picker: LocationMapPicker;
  binding: LocationMapPickerFormBinding | null;
  controls: LocationMapPickerFieldControlsBinding | null;
  ready: Promise<StaticLocationMapPickerFieldController>;
  open(): StaticLocationMapPickerFieldController;
  close(): StaticLocationMapPickerFieldController;
  isOpen(): boolean;
  updatePayload(): LocationMapPickerSubmitResult;
  resize(): StaticLocationMapPickerFieldController;
  destroy(): void;
};

export type StaticLocationMapPickerOptions = Omit<LocationMapPickerOptions, 'mount' | 'provider'> & {
  mount: Element | string;
  baseUrl: string;
  providerOptions?: {
    hierarchyBaseUrl?: string;
    geometryBaseUrl?: string;
    reverseMaxNearestKm?: number;
  };
};

export type Provider = {
  getRegions(): Promise<unknown[]>;
  getProvinces(regionId: string, context?: Partial<LocationValue>): Promise<unknown[]>;
  getCities(parentId: string, context?: Partial<LocationValue>): Promise<unknown[]>;
  getBarangays(cityId: string, context?: Partial<LocationValue>): Promise<unknown[]>;
  getLocationByIds(ids: Partial<LocationValue>): Promise<LocationValue>;
  getBounds?(level: string, id: string): Promise<unknown | null>;
  getCentroid?(level: string, id: string): Promise<PinValue | null>;
  getPolygon?(level: string, id: string): Promise<PinValue[] | null>;
  reverseGeocode?(lat: number, lng: number, context?: Partial<LocationValue>): Promise<LocationValue | null>;
};

export class LocationPicker {
  constructor(options: LocationPickerOptions);
  ready: Promise<void>;
  on(eventName: 'change', handler: (payload: LocationValue) => void): this;
  on(eventName: 'open', handler: (payload: { open: true }) => void): this;
  on(eventName: 'close', handler: (payload: { open: false }) => void): this;
  on(eventName: 'openchange', handler: (payload: { open: boolean }) => void): this;
  on(eventName: string, handler: (payload: unknown) => void): this;
  off(eventName: 'change', handler?: (payload: LocationValue) => void): this;
  off(eventName: 'open', handler?: (payload: { open: true }) => void): this;
  off(eventName: 'close', handler?: (payload: { open: false }) => void): this;
  off(eventName: 'openchange', handler?: (payload: { open: boolean }) => void): this;
  off(eventName: string, handler?: (payload: unknown) => void): this;
  setValue(value: Partial<LocationValue>, emitChange?: boolean, options?: { hydrate?: boolean }): Promise<LocationValue>;
  open(): void;
  close(): void;
  clear(emitChange?: boolean, options?: { force?: boolean }): void;
  setDisabled(disabled?: boolean): this;
  setReadOnly(readOnly?: boolean): this;
  setBusy(busy?: boolean, reason?: string): this;
  isBusy(): boolean;
  currentLocation(): LocationValue;
  validate(): LocationPickerValidationResult;
  isValid(): boolean;
  destroy(): void;
}

export class MapPicker {
  constructor(options: MapPickerOptions);
  on(eventName: 'pinchange', handler: (payload: PinValue | null) => void): this;
  on(eventName: string, handler: (payload: unknown) => void): this;
  off(eventName: 'pinchange', handler?: (payload: PinValue | null) => void): this;
  off(eventName: string, handler?: (payload: unknown) => void): this;
  focusLocation(location: Partial<LocationValue>): Promise<GeometryFocusResult>;
  setCenter(center: PinValue, zoom?: number, statusText?: string): void;
  setPin(pin: PinValue, emitChange?: boolean, options?: { centerOnPin?: boolean; force?: boolean }): void;
  clearPin(emitChange?: boolean, options?: { force?: boolean }): void;
  setDisabled(disabled?: boolean): this;
  setReadOnly(readOnly?: boolean): this;
  setBusy(busy?: boolean, reason?: string): this;
  isBusy(): boolean;
  dirtyState(): LocationMapPickerDirtyState;
  isDirty(): boolean;
  resetDirty(emitChange?: boolean): this;
  resize(): this;
  setSize(options: Partial<MapPickerOptions>): this;
  destroy(): void;
}

export class LocationMapPicker {
  constructor(options: LocationMapPickerOptions);
  ready: Promise<void>;
  on(eventName: 'change', handler: (payload: LocationMapPickerValue) => void): this;
  on(eventName: 'locationchange', handler: (payload: LocationValue) => void): this;
  on(eventName: 'pinchange', handler: (payload: PinValue | null) => void): this;
  on(eventName: 'reversematch', handler: (payload: LocationMapPickerValue['geometry']['reverse_match']) => void): this;
  on(eventName: 'reversenomatch', handler: (payload: { pin: PinValue | null; location: LocationValue }) => void): this;
  on(eventName: 'geoipresolved', handler: (payload: GeoIpResolvedPayload) => void): this;
  on(eventName: 'geoipnomatch', handler: (payload: GeoIpNoMatchPayload) => void): this;
  on(eventName: 'geoiperror', handler: (payload: Error) => void): this;
  on(eventName: 'browserlocationresolved', handler: (payload: BrowserLocationResolvedPayload) => void): this;
  on(eventName: 'browserlocationnomatch', handler: (payload: BrowserLocationNoMatchPayload) => void): this;
  on(eventName: 'browserlocationerror', handler: (payload: Error) => void): this;
  on(eventName: 'busychange', handler: (payload: { busy: boolean; reason: string }) => void): this;
  on(eventName: 'dirtychange', handler: (payload: LocationMapPickerDirtyState) => void): this;
  on(eventName: 'statuschange', handler: (payload: LocationMapPickerStatusState) => void): this;
  on(eventName: 'open', handler: (payload: { open: true }) => void): this;
  on(eventName: 'close', handler: (payload: { open: false }) => void): this;
  on(eventName: 'openchange', handler: (payload: { open: boolean }) => void): this;
  on(eventName: 'debug', handler: (payload: LocationMapPickerDebugEvent) => void): this;
  on(eventName: 'error', handler: (payload: LocationMapPickerErrorPayload) => void): this;
  on(eventName: string, handler: (payload: unknown) => void): this;
  off(eventName: 'change', handler?: (payload: LocationMapPickerValue) => void): this;
  off(eventName: 'locationchange', handler?: (payload: LocationValue) => void): this;
  off(eventName: 'pinchange', handler?: (payload: PinValue | null) => void): this;
  off(eventName: 'reversematch', handler?: (payload: LocationMapPickerValue['geometry']['reverse_match']) => void): this;
  off(eventName: 'reversenomatch', handler?: (payload: { pin: PinValue | null; location: LocationValue }) => void): this;
  off(eventName: 'geoipresolved', handler?: (payload: GeoIpResolvedPayload) => void): this;
  off(eventName: 'geoipnomatch', handler?: (payload: GeoIpNoMatchPayload) => void): this;
  off(eventName: 'geoiperror', handler?: (payload: Error) => void): this;
  off(eventName: 'browserlocationresolved', handler?: (payload: BrowserLocationResolvedPayload) => void): this;
  off(eventName: 'browserlocationnomatch', handler?: (payload: BrowserLocationNoMatchPayload) => void): this;
  off(eventName: 'browserlocationerror', handler?: (payload: Error) => void): this;
  off(eventName: 'busychange', handler?: (payload: { busy: boolean; reason: string }) => void): this;
  off(eventName: 'dirtychange', handler?: (payload: LocationMapPickerDirtyState) => void): this;
  off(eventName: 'statuschange', handler?: (payload: LocationMapPickerStatusState) => void): this;
  off(eventName: 'open', handler?: (payload: { open: true }) => void): this;
  off(eventName: 'close', handler?: (payload: { open: false }) => void): this;
  off(eventName: 'openchange', handler?: (payload: { open: boolean }) => void): this;
  off(eventName: 'debug', handler?: (payload: LocationMapPickerDebugEvent) => void): this;
  off(eventName: 'error', handler?: (payload: LocationMapPickerErrorPayload) => void): this;
  off(eventName: string, handler?: (payload: unknown) => void): this;
  open(): this;
  close(): this;
  isOpen(): boolean;
  value(): LocationMapPickerValue;
  validate(): LocationMapPickerValidationResult;
  isValid(): boolean;
  setValue(value: LocationMapPickerInitialValue, emitChange?: boolean, options?: { resetDirty?: boolean; trackDirty?: boolean }): Promise<LocationMapPickerValue>;
  resolveGeoIpHint(emitChange?: boolean): Promise<GeoIpResolvedPayload | null>;
  resolveBrowserLocationHint(emitChange?: boolean, force?: boolean): Promise<BrowserLocationResolvedPayload | null>;
  requestBrowserLocation(emitChange?: boolean): Promise<BrowserLocationResolvedPayload | null>;
  reverseFillFromPin(emitChange?: boolean): Promise<LocationMapPickerValue | null>;
  clear(emitChange?: boolean): void;
  setStatus(level: LocationMapPickerStatusLevel, message: string, code?: string): this;
  setMessage(message: string, level?: LocationMapPickerStatusLevel, code?: string): this;
  clearStatus(): this;
  statusState(): LocationMapPickerStatusState;
  debugState(): LocationMapPickerDebugEvent[];
  clearDebug(): this;
  message(key: LocationMapPickerMessageKey | string, replacements?: Record<string, unknown>, fallback?: string): string;
  setDisabled(disabled?: boolean): this;
  setReadOnly(readOnly?: boolean): this;
  setBusy(busy?: boolean, reason?: string): this;
  isBusy(): boolean;
  dirtyState(): LocationMapPickerDirtyState;
  isDirty(): boolean;
  resetDirty(emitChange?: boolean): this;
  resize(): this;
  setSize(options: Partial<MapPickerOptions>): this;
  destroy(): void;
}

export class StaticJsonProvider { constructor(options?: Record<string, unknown>); }
export class StaticGeometryProvider { constructor(options?: Record<string, unknown>); }
export class CompositeLocationProvider { constructor(options: { hierarchyProvider: Provider; geometryProvider?: Provider }); }
export class PsgcCloudProvider { constructor(options?: Record<string, unknown>); }
export class ArcGisBarangayGeometryProvider { constructor(options?: Record<string, unknown>); }
export class ApiProvider { constructor(options?: Record<string, unknown>); }

export function createStaticLocationProvider(options?: Record<string, unknown>): Provider;
export function createStaticLocationMapPicker(options: StaticLocationMapPickerOptions): LocationMapPicker;
export function createLocationMapPickerSubmitPayload(picker: LocationMapPicker): LocationMapPickerSubmitPayload;
export function createLocationMapPickerSubmitPayloadFromValue(value: LocationMapPickerValue, validation: LocationMapPickerValidationResult): LocationMapPickerSubmitPayload;
export function createLocationMapPickerSubmitResult(picker: LocationMapPicker, options?: LocationMapPickerSubmitResultOptions): LocationMapPickerSubmitResult;
export function blockInvalidLocationMapPickerSubmit(picker: LocationMapPicker, options?: LocationMapPickerSubmitResultOptions): LocationMapPickerSubmitResult;
export function writeLocationMapPickerSubmitPayloadToForm(form: HTMLFormElement | string, payload: LocationMapPickerSubmitPayload, options?: { fieldNames?: LocationMapPickerSubmitFieldNames }): LocationMapPickerFormPayloadWriteResult;
export function bindLocationMapPickerForm(options: LocationMapPickerFormBindingOptions): LocationMapPickerFormBinding;
export function readLocationMapPickerSubmitPayloadFromForm(form: HTMLFormElement | string, options?: { fieldNames?: LocationMapPickerSubmitFieldNames }): LocationMapPickerSubmitPayload;
export function createLocationMapPickerInitialValueFromSubmitPayload(payload: Partial<LocationMapPickerSubmitPayload>, options?: { fieldNames?: LocationMapPickerSubmitFieldNames }): LocationMapPickerInitialValue;
export function createLocationMapPickerInitialValueFromForm(form: HTMLFormElement | string, options?: { fieldNames?: LocationMapPickerSubmitFieldNames }): LocationMapPickerInitialValue;
export function mountStaticLocationMapPickerField(options: StaticLocationMapPickerFieldOptions): StaticLocationMapPickerFieldController;
export function bindLocationMapPickerFieldControls(options: LocationMapPickerFieldControlsOptions): LocationMapPickerFieldControlsBinding;
export function formatLocationMapPickerValueLabel(value: LocationMapPickerValue | LocationValue | Partial<LocationValue>, options?: LocationMapPickerValueLabelOptions): string;
export function selectedLocationMapPickerLevel(value: LocationMapPickerValue | LocationValue | Partial<LocationValue>): RequiredLocationLevel | '';
export function hasLocationMapPickerSelection(value: LocationMapPickerValue | LocationValue | Partial<LocationValue>, options?: { requiredLocationLevel?: RequiredLocationLevel; selectionRequiredLevel?: RequiredLocationLevel }): boolean;
export function createLocationMapPickerHostConfig(options: LocationMapPickerHostConfigOptions): LocationMapPickerHostConfig;
export function defaultLocationMapPickerFieldNames(): Required<LocationMapPickerSubmitFieldNames>;
export function cleanPsgcCode(value: unknown): string;
export function isTenDigitPsgc(value: unknown): boolean;
export function isLegacyNineDigitPsgc(value: unknown): boolean;
export function toTenDigitPsgcCode(value: unknown, level?: string): string;
export function deriveRegionId(value: unknown): string;
export function deriveProvinceId(value: unknown): string;
export function deriveCityId(value: unknown): string;
export function deriveBarangayCityId(value: unknown): string;
export function pointInPolygon(point: PinValue, polygon: PinValue[]): boolean;
export function normalizeBounds(bounds: unknown): unknown | null;
export function boundsCenter(bounds: unknown): PinValue | null;
export function boundsContains(bounds: unknown, lat: number, lng: number): boolean;


export const PROVIDER_CONTRACT_VERSION: string;
export function cleanProviderText(value: unknown): string;
export function cleanProviderNumber(value: unknown, fallback?: number | null): number | null;
export function normalizeProviderArray(value: unknown): unknown[];
export function normalizeProviderRow(row?: Record<string, unknown>, fallbackType?: string): ProviderRow;
export function emptyProviderLocation(): LocationValue;
export function formatProviderLocationLabel(location?: Partial<LocationValue>, format?: SelectedLabelFormatOption | string): string;
export function normalizeLocationValue(value?: Partial<LocationValue> & Record<string, unknown>, options?: { labelFormat?: SelectedLabelFormatOption | string }): LocationValue;
export function normalizePinValue(value?: Partial<PinValue> | null): PinValue | null;
export function normalizeBoundsValue(value?: Record<string, unknown> | null): { south: number; west: number; north: number; east: number } | null;
export function normalizeReverseMatch(value?: Partial<LocationValue> & Record<string, unknown>): LocationValue;
export function createProviderError(error: unknown, details?: Record<string, unknown>): ProviderError;
export function createProviderNoMatch(reason?: string, context?: unknown): ProviderNoMatch;
export function safeProviderCall<T>(providerName: string, methodName: string, callback: () => Promise<T> | T, fallback?: T): Promise<T>;
