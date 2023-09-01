export type ShelfEtag = {
  id: 1;
  shelf_code: '0001';
  shelf_name: 'Sushi Corner';
  serial: 'UNO252AM220800014';
  mac: 'A01C8773670C';
  capture: null;
  session: null;
  power_remaining: 3600000;
  screen_adv_data: '3213eab3';
  screen_update_at: '2023-07-28T16:25:46+09:00';
  urlsafe_template_data: 'test';
  auto_reassign_enabled: true;
  locale: null;
  version: 179;
  battery_percentage: 100;
  screen_updated_to_latest: false;
  last_scanned_at: '2023-07-28T16:25:57+09:00';
  last_scanned_rssi: null;
  gateway: 1;
  shelf: 1;
  model: 1;
  owner: 1;
  store: 1;
  store_name: 'Sushi Corner';
  gateway_serial: string;
  sid: string;
  adv_data: {
    sid: string;
    fw: number;
  };
};

export type Shelf = {
  id: 8;
  store_name: 'STORE001';
  code: '0001';
  name: 'SHELF001';
  store: 3;
  owner: 3;
  items: [];
};

export type Paginated<Data> = {
  count: 1;
  next: null;
  previous: null;
  results: Data[];
};

export type GetShelvesResponse = Paginated<Shelf>;

export type PatchShelfEtagPayload = Partial<{
  serial: string;
  mac: string;
  gateway: number;
  shelf: number;
  capture: string;
  session: string;
  model: number;
  power_remaining: number;
  owner: number;
  store: number;
  screen_adv_data: string;
  screen_update_at: string;
  urlsafe_template_data: string;
  auto_reassign_enabled: boolean;
  locale: string;
  version: number;
  battery_percentage: number;
  screen_updated_to_latest: boolean;
  last_scanned_at: string;
  last_scanned_rssi: number;
}>;
