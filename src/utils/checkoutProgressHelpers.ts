import { validateBangladeshPhone } from './reviewHelpers';

export interface CheckoutProgressInput {
  name: string;
  phone: string;
  district: string;
  city: string;
  address: string;
}

export interface CheckoutProgressResult {
  percentage: number;
  completedFields: number;
  totalFields: number;
  isComplete: boolean;
  statusLabel: string;
}

/**
 * Computes checkout form completion percentage from actual required delivery fields.
 * Weights:
 * - Full Name (>= 2 chars): 20%
 * - Mobile Number (valid 11-digit BD number): 25%
 * - District selected: 10%
 * - Thana / Area (>= 2 chars): 20%
 * - Street Address (>= 5 chars): 25%
 */
export function computeCheckoutCompletion(
  input: CheckoutProgressInput
): CheckoutProgressResult {
  const hasName = input.name.trim().length >= 2;
  const hasPhone = validateBangladeshPhone(input.phone, false).valid;
  const hasDistrict = input.district.trim().length > 0;
  const hasCity = input.city.trim().length >= 2;
  const hasAddress = input.address.trim().length >= 5;

  let percentage = 0;
  let completedFields = 0;

  if (hasName) {
    percentage += 20;
    completedFields += 1;
  }
  if (hasPhone) {
    percentage += 25;
    completedFields += 1;
  }
  if (hasDistrict) {
    percentage += 10;
    completedFields += 1;
  }
  if (hasCity) {
    percentage += 20;
    completedFields += 1;
  }
  if (hasAddress) {
    percentage += 25;
    completedFields += 1;
  }

  const totalFields = 5;
  const isComplete = completedFields === totalFields;

  let statusLabel = 'Ready to confirm order';
  if (!hasName) {
    statusLabel = 'Next: Enter full name';
  } else if (!hasPhone) {
    statusLabel = 'Next: Enter mobile number';
  } else if (!hasDistrict) {
    statusLabel = 'Next: Select district';
  } else if (!hasCity) {
    statusLabel = 'Next: Enter thana or area';
  } else if (!hasAddress) {
    statusLabel = 'Next: Enter street address';
  }

  return {
    percentage: Math.min(100, percentage),
    completedFields,
    totalFields,
    isComplete,
    statusLabel,
  };
}
