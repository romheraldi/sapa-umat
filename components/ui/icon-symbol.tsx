// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation & Home
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',

  // Tab bar icons
  'calendar': 'event',
  'megaphone.fill': 'campaign',
  'newspaper.fill': 'article',
  'person.3.fill': 'group',
  'person.crop.circle.fill': 'account-circle',

  // People & Account
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'person.badge.plus': 'person-add',
  'person.badge.key.fill': 'manage-accounts',
  'person.2': 'people',
  'person.2.fill': 'people',

  // Location & Map
  'mappin': 'place',
  'mappin.fill': 'place',
  'mappin.circle': 'location-on',
  'mappin.circle.fill': 'location-on',

  // Communication
  'phone.fill': 'phone',
  'envelope': 'email',
  'envelope.fill': 'email',

  // Time & Clock
  'clock': 'schedule',
  'clock.fill': 'schedule',

  // Search & UI
  'magnifyingglass': 'search',
  'xmark.circle.fill': 'cancel',
  'xmark': 'close',
  'plus': 'add',

  // Info & Alerts
  'info.circle': 'info',
  'info.circle.fill': 'info',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'bell.badge.fill': 'notifications-active',
  'checkmark.seal.fill': 'verified',

  // Auth & Security
  'lock': 'lock',
  'lock.fill': 'lock',
  'lock.shield.fill': 'security',
  'lock.shield': 'security',
  'lock.open': 'lock-open',
  'lock.shield.fill.badge.checkmark': 'verified-user',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'rectangle.portrait.and.arrow.right': 'logout',

  // Documents
  'doc.fill': 'description',
  'doc.text.fill': 'article',
  'doc.badge.plus': 'note-add',
  'arrow.up.doc.fill': 'upload-file',
  'text.alignleft': 'notes',
  'trash': 'delete',

  // Finance & Building
  'banknote.fill': 'payments',
  'building.columns.fill': 'account-balance',
  'creditcard.fill': 'credit-card',
  'list.clipboard.fill': 'assignment',
  'folder.fill': 'folder',

  // Misc
  'number': 'tag',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
