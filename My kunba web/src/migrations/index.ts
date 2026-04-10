import * as migration_20260328_142031 from './20260328_142031';
import * as migration_20260407_180000 from './20260407_180000_add_city_country_to_page_views';
import * as migration_20260410_180000 from './20260410_180000_add_user_role_to_page_views';

export const migrations = [
  {
    up: migration_20260328_142031.up,
    down: migration_20260328_142031.down,
    name: '20260328_142031'
  },
  {
    up: migration_20260407_180000.up,
    down: migration_20260407_180000.down,
    name: '20260407_180000_add_city_country_to_page_views'
  },
  {
    up: migration_20260410_180000.up,
    down: migration_20260410_180000.down,
    name: '20260410_180000_add_user_role_to_page_views'
  },
];
