export interface SavedDeliveryAddress {
  name: string;
  phone: string;
  optionalPhone?: string;
  email?: string;
  district: string;
  city: string;
  address: string;
  customerNote?: string;
}

export function formatAddressPreview(address: Partial<SavedDeliveryAddress> | null | undefined): string {
  if (!address) return '';
  const parts = [
    address.name?.trim(),
    address.city?.trim(),
    address.district?.trim()
  ].filter(Boolean);
  return parts.join(', ');
}

export function sanitizeSavedAddress(raw: any): SavedDeliveryAddress | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const address = typeof raw.address === 'string' ? raw.address.trim() : '';
  if (!name && !phone && !address) return null;

  return {
    name,
    phone,
    optionalPhone: typeof raw.optionalPhone === 'string' ? raw.optionalPhone.trim() : '',
    email: typeof raw.email === 'string' ? raw.email.trim() : '',
    district: typeof raw.district === 'string' && raw.district.trim() ? raw.district.trim() : 'Dhaka',
    city: typeof raw.city === 'string' ? raw.city.trim() : '',
    address,
    customerNote: typeof raw.customerNote === 'string' ? raw.customerNote.trim() : ''
  };
}
