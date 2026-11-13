export type AdminSidebarSectionId =
  | 'analytics_core'
  | 'commerce_orders'
  | 'catalog_inventory'
  | 'storefront_promotions'
  | 'customer_marketing'
  | 'system_settings';

export interface AdminSidebarSectionLayout {
  id: AdminSidebarSectionId;
  title: string;
  itemIds: string[];
}

export interface AdminSidebarConfig {
  sections: AdminSidebarSectionLayout[];
  updatedAt?: number;
}

export const ALL_ADMIN_SIDEBAR_TAB_IDS: readonly string[] = [
  'overview',
  'orders',
  'courier',
  'verifications',
  'payment-methods',
  'products',
  'categories',
  'authors',
  'publishers',
  'banners',
  'special-offer',
  'coupons',
  'reels',
  'reviews',
  'live-chat',
  'subscribers',
  'capi',
  'settings',
  'staff',
  'profile',
];

export const DEFAULT_ADMIN_SIDEBAR_SECTIONS: AdminSidebarSectionLayout[] = [
  {
    id: 'analytics_core',
    title: 'ANALYTICS & OVERVIEW',
    itemIds: ['overview'],
  },
  {
    id: 'commerce_orders',
    title: 'ORDERS & PAYMENTS',
    itemIds: ['orders', 'courier', 'verifications', 'payment-methods'],
  },
  {
    id: 'catalog_inventory',
    title: 'CATALOG & INVENTORY',
    itemIds: ['products', 'categories', 'authors', 'publishers'],
  },
  {
    id: 'storefront_promotions',
    title: 'STOREFRONT & PROMOTIONS',
    itemIds: ['banners', 'special-offer', 'coupons', 'reels', 'reviews'],
  },
  {
    id: 'customer_marketing',
    title: 'CUSTOMER & MARKETING',
    itemIds: ['live-chat', 'subscribers', 'capi'],
  },
  {
    id: 'system_settings',
    title: 'SYSTEM & ACCESS',
    itemIds: ['settings', 'staff', 'profile'],
  },
];

export const DEFAULT_ADMIN_SIDEBAR_CONFIG: AdminSidebarConfig = {
  sections: DEFAULT_ADMIN_SIDEBAR_SECTIONS.map(sec => ({
    ...sec,
    itemIds: [...sec.itemIds],
  })),
};

export function formatSerialIndex(num: number): string {
  const safe = Math.max(1, Math.floor(num));
  return safe < 10 ? `0${safe}` : `${safe}`;
}

export function normalizeAdminSidebarConfig(
  raw?: Partial<AdminSidebarConfig> | null
): AdminSidebarConfig {
  if (!raw || !Array.isArray(raw.sections) || raw.sections.length === 0) {
    return {
      sections: DEFAULT_ADMIN_SIDEBAR_SECTIONS.map(sec => ({
        ...sec,
        itemIds: [...sec.itemIds],
      })),
    };
  }

  const validTabSet = new Set<string>(ALL_ADMIN_SIDEBAR_TAB_IDS);
  const validSectionMap = new Map<AdminSidebarSectionId, AdminSidebarSectionLayout>(
    DEFAULT_ADMIN_SIDEBAR_SECTIONS.map(sec => [sec.id, sec])
  );

  const seenTabs = new Set<string>();
  const seenSections = new Set<AdminSidebarSectionId>();
  const normalizedSections: AdminSidebarSectionLayout[] = [];

  for (const rawSec of raw.sections) {
    if (!rawSec || typeof rawSec.id !== 'string') continue;
    const secId = rawSec.id as AdminSidebarSectionId;
    const defaultSec = validSectionMap.get(secId);
    if (!defaultSec || seenSections.has(secId)) continue;

    seenSections.add(secId);
    const cleanItems: string[] = [];
    if (Array.isArray(rawSec.itemIds)) {
      for (const itemId of rawSec.itemIds) {
        if (typeof itemId === 'string' && validTabSet.has(itemId) && !seenTabs.has(itemId)) {
          seenTabs.add(itemId);
          cleanItems.push(itemId);
        }
      }
    }

    normalizedSections.push({
      id: secId,
      title: typeof rawSec.title === 'string' && rawSec.title.trim() ? rawSec.title.trim() : defaultSec.title,
      itemIds: cleanItems,
    });
  }

  // Append any missing default sections
  for (const defaultSec of DEFAULT_ADMIN_SIDEBAR_SECTIONS) {
    if (!seenSections.has(defaultSec.id)) {
      seenSections.add(defaultSec.id);
      normalizedSections.push({
        id: defaultSec.id,
        title: defaultSec.title,
        itemIds: [],
      });
    }
  }

  // Ensure every valid tab ID is present in its default section if it wasn't placed anywhere
  for (const defaultSec of DEFAULT_ADMIN_SIDEBAR_SECTIONS) {
    const targetSec = normalizedSections.find(s => s.id === defaultSec.id);
    if (!targetSec) continue;
    for (const itemId of defaultSec.itemIds) {
      if (!seenTabs.has(itemId)) {
        seenTabs.add(itemId);
        targetSec.itemIds.push(itemId);
      }
    }
  }

  return {
    sections: normalizedSections,
    ...(typeof raw.updatedAt === 'number' ? { updatedAt: raw.updatedAt } : {}),
  };
}

export function moveSidebarSection(
  config: AdminSidebarConfig,
  sectionId: AdminSidebarSectionId | string,
  direction: 'up' | 'down'
): AdminSidebarConfig {
  const normalized = normalizeAdminSidebarConfig(config);
  const idx = normalized.sections.findIndex(s => s.id === sectionId);
  if (idx === -1) return normalized;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= normalized.sections.length) {
    return normalized;
  }

  const nextSections = normalized.sections.map(s => ({ ...s, itemIds: [...s.itemIds] }));
  const temp = nextSections[idx];
  nextSections[idx] = nextSections[targetIdx];
  nextSections[targetIdx] = temp;

  return {
    sections: nextSections,
    updatedAt: Date.now(),
  };
}

export function moveSidebarItem(
  config: AdminSidebarConfig,
  itemId: string,
  direction: 'up' | 'down'
): AdminSidebarConfig {
  const normalized = normalizeAdminSidebarConfig(config);
  const nextSections = normalized.sections.map(s => ({ ...s, itemIds: [...s.itemIds] }));

  const secIdx = nextSections.findIndex(s => s.itemIds.includes(itemId));
  if (secIdx === -1) return normalized;

  const currentSec = nextSections[secIdx];
  const itemIdx = currentSec.itemIds.indexOf(itemId);

  if (direction === 'up') {
    if (itemIdx > 0) {
      // Swap within the same section
      const temp = currentSec.itemIds[itemIdx - 1];
      currentSec.itemIds[itemIdx - 1] = currentSec.itemIds[itemIdx];
      currentSec.itemIds[itemIdx] = temp;
      return { sections: nextSections, updatedAt: Date.now() };
    }
    // Move to the end of the previous section if available
    if (secIdx > 0) {
      currentSec.itemIds.splice(itemIdx, 1);
      nextSections[secIdx - 1].itemIds.push(itemId);
      return { sections: nextSections, updatedAt: Date.now() };
    }
    return normalized;
  } else {
    if (itemIdx < currentSec.itemIds.length - 1) {
      // Swap within the same section
      const temp = currentSec.itemIds[itemIdx + 1];
      currentSec.itemIds[itemIdx + 1] = currentSec.itemIds[itemIdx];
      currentSec.itemIds[itemIdx] = temp;
      return { sections: nextSections, updatedAt: Date.now() };
    }
    // Move to the beginning of the next section if available
    if (secIdx < nextSections.length - 1) {
      currentSec.itemIds.splice(itemIdx, 1);
      nextSections[secIdx + 1].itemIds.unshift(itemId);
      return { sections: nextSections, updatedAt: Date.now() };
    }
    return normalized;
  }
}

export function reorderSidebarItemByDrop(
  config: AdminSidebarConfig,
  draggedItemId: string,
  targetItemId: string
): AdminSidebarConfig {
  if (!draggedItemId || !targetItemId || draggedItemId === targetItemId) {
    return normalizeAdminSidebarConfig(config);
  }
  const normalized = normalizeAdminSidebarConfig(config);
  const nextSections = normalized.sections.map(s => ({ ...s, itemIds: [...s.itemIds] }));

  const sourceSecIdx = nextSections.findIndex(s => s.itemIds.includes(draggedItemId));
  const targetSecIdx = nextSections.findIndex(s => s.itemIds.includes(targetItemId));
  if (sourceSecIdx === -1 || targetSecIdx === -1) return normalized;

  const sourceSec = nextSections[sourceSecIdx];
  const sourceItemIdx = sourceSec.itemIds.indexOf(draggedItemId);
  sourceSec.itemIds.splice(sourceItemIdx, 1);

  const targetSec = nextSections[targetSecIdx];
  const targetItemIdx = targetSec.itemIds.indexOf(targetItemId);
  targetSec.itemIds.splice(targetItemIdx, 0, draggedItemId);

  return {
    sections: nextSections,
    updatedAt: Date.now(),
  };
}

export function getFlatOrderedItemIds(config: AdminSidebarConfig): string[] {
  const normalized = normalizeAdminSidebarConfig(config);
  const flat: string[] = [];
  for (const sec of normalized.sections) {
    for (const id of sec.itemIds) {
      flat.push(id);
    }
  }
  return flat;
}

export function isCustomSidebarConfig(config?: Partial<AdminSidebarConfig> | null): boolean {
  const normalized = normalizeAdminSidebarConfig(config);
  if (normalized.sections.length !== DEFAULT_ADMIN_SIDEBAR_SECTIONS.length) return true;

  for (let i = 0; i < DEFAULT_ADMIN_SIDEBAR_SECTIONS.length; i++) {
    const defSec = DEFAULT_ADMIN_SIDEBAR_SECTIONS[i];
    const curSec = normalized.sections[i];
    if (curSec.id !== defSec.id) return true;
    if (curSec.itemIds.length !== defSec.itemIds.length) return true;
    for (let j = 0; j < defSec.itemIds.length; j++) {
      if (curSec.itemIds[j] !== defSec.itemIds[j]) return true;
    }
  }
  return false;
}
