// Type definitions
interface UnitConversion {
  to: string;
  factor: number;
}

interface Combination {
  from: string;
  to: string;
  unit: string;
  defaultQty: number;
}

interface BusinessUnits {
  [key: string]: UnitConversion | Combination[];
  combinations: Combination[];
}

// Unit conversion mappings for different business types
export const UnitConversionMap: Record<string, BusinessUnits> = {
  grocery: {
    // Weight units
    'KG': { to: 'gram', factor: 1000 },
    'gram': { to: 'KG', factor: 0.001 },
    'piece': { to: 'kg', factor: 0.1 },
    'bunch': { to: 'kg', factor: 0.3 },
    'dozen': { to: 'piece', factor: 12 },

    // Volume units
    'L': { to: 'ml', factor: 1000 },
    'ml': { to: 'L', factor: 0.001 },
    'small': { to: 'ml', factor: 250 },
    'medium': { to: 'ml', factor: 500 },
    'large': { to: 'ml', factor: 1000 },

    // Size units
    'cm': { to: 'm', factor: 0.01 },
    'm': { to: 'cm', factor: 100 },
    'inch': { to: 'cm', factor: 2.54 },
    'ft': { to: 'm', factor: 0.3048 },

    // Price and quantity combinations
    combinations: [
      { from: 'KG', to: 'gram', unit: 'gram', defaultQty: 100 },
      { from: 'L', to: 'ml', unit: 'ml', defaultQty: 100 },
      { from: 'piece', to: 'kg', unit: 'kg', defaultQty: 0.1 },
      { from: 'cm', to: 'm', unit: 'm', defaultQty: 0.01 },
    ]
  },

  restaurant: {
    // For restaurants - mostly pieces, but still need conversions
    'piece': { to: 'kg', factor: 0.1 },
    'serving': { to: 'piece', factor: 1 },
    'plate': { to: 'serving', factor: 1 },
    'bowl': { to: 'serving', factor: 2 },
    'cup': { to: 'ml', factor: 250 },
    'spoon': { to: 'ml', factor: 15 },
    'fork': { to: 'piece', factor: 1 },

    // Price and quantity combinations
    combinations: [
      { from: 'plate', to: 'serving', unit: 'serving', defaultQty: 1 },
      { from: 'cup', to: 'ml', unit: 'ml', defaultQty: 250 },
    ]
  },

  hotel: {
    // Hotels - measurements for room services, facilities
    'room': { to: 'booking', factor: 1 },
    'night': { to: 'hour', factor: 24 },
    'person': { to: 'group', factor: 1 },
    'breakfast': { to: 'meal', factor: 1 },
    'facility': { to: 'unit', factor: 1 },

    // Price and quantity combinations
    combinations: [
      { from: 'room', to: 'booking', unit: 'booking', defaultQty: 1 },
      { from: 'night', to: 'stay', unit: 'stay', defaultQty: 1 },
    ]
  },

  hall: {
    // Event venues - measurements for events
    'event': { to: 'booking', factor: 1 },
    'table': { to: 'seat', factor: 8 },
    'chair': { to: 'seat', factor: 1 },
    'decoration': { to: 'setup', factor: 1 },
    'catering': { to: 'serving', factor: 1 },

    // Price and quantity combinations
    combinations: [
      { from: 'event', to: 'booking', unit: 'booking', defaultQty: 1 },
      { from: 'table', to: 'guest', unit: 'guest', defaultQty: 8 },
    ]
  },

  service: {
    // Services - time, distance, quantity
    'hour': { to: 'min', factor: 60 },
    'day': { to: 'hour', factor: 24 },
    'visit': { to: 'appointment', factor: 1 },
    'job': { to: 'task', factor: 1 },
    'distance': { to: 'km', factor: 1 },

    // Price and quantity combinations
    combinations: [
      { from: 'hour', to: 'minute', unit: 'minute', defaultQty: 60 },
      { from: 'visit', to: 'job', unit: 'job', defaultQty: 1 },
    ]
  },

  beauty: {
    // Beauty and wellness - time, quantity, duration
    'service': { to: 'appointment', factor: 1 },
    'duration': { to: 'min', factor: 1 },
    'session': { to: 'appointment', factor: 1 },
    'package': { to: 'service', factor: 1 },
    'treatment': { to: 'session', factor: 1 },

    // Price and quantity combinations
    combinations: [
      { from: 'service', to: 'appointment', unit: 'appointment', defaultQty: 1 },
      { from: 'duration', to: 'minutes', unit: 'minutes', defaultQty: 60 },
    ]
  },

  delivery: {
    // Delivery and transport - distance, time, packages
    'package': { to: 'weight', factor: 1 },
    'parcel': { to: 'weight', factor: 1 },
    'trip': { to: 'journey', factor: 1 },
    'route': { to: 'path', factor: 1 },
    'distance': { to: 'mile', factor: 0.621 },

    // Price and quantity combinations
    combinations: [
      { from: 'package', to: 'parcel', unit: 'parcel', defaultQty: 1 },
      { from: 'trip', to: 'ride', unit: 'ride', defaultQty: 1 },
    ]
  },
};

// Helper function to check if a value is a UnitConversion
function isUnitConversion(value: UnitConversion | Combination[]): value is UnitConversion {
  return typeof value === 'object' && value !== null && 'to' in value && 'factor' in value;
}

// Convert between units for a specific business type
export function convertQuantity(
  value: number,
  fromUnit: string,
  toUnit: string,
  businessType: string
): { convertedValue: number; convertedUnit: string } {
  const businessUnits = UnitConversionMap[businessType];
  if (!businessUnits) {
    return { convertedValue: value, convertedUnit: toUnit };
  }

  const fromConversion = businessUnits[fromUnit];
  const toConversion = businessUnits[toUnit];

  if (!fromConversion || !toConversion) {
    return { convertedValue: value, convertedUnit: toUnit };
  }

  // Direct conversion path
  if (isUnitConversion(fromConversion) && isUnitConversion(toConversion)) {
    if (fromConversion.to === toUnit) {
      return { convertedValue: value * fromConversion.factor, convertedUnit: toUnit };
    }

    // Reverse conversion path
    if (toConversion.to === fromUnit) {
      return { convertedValue: value / toConversion.factor, convertedUnit: toUnit };
    }
  }

  // If units are incompatible, return original
  return { convertedValue: value, convertedUnit: toUnit };
}

// Get standard units and their display names for a business type
export function getStandardUnits(businessType: string): Array<{ unit: string; displayName: string; category: string }> {
  const businessUnits = UnitConversionMap[businessType];
  if (!businessUnits) {
    return [];
  }

  const standardUnits: Array<{ unit: string; displayName: string; category: string }> = [];
  const unitEntries = Object.entries(businessUnits);

  // Categorize units
  unitEntries.forEach(([unit, conversion]) => {
    if (isUnitConversion(conversion)) {
      let category = 'Measurement';
      if (['KG', 'gram', 'piece'].includes(unit)) {
        category = 'Weight';
      } else if (['L', 'ml', 'cup', 'spoon'].includes(unit)) {
        category = 'Volume';
      } else if (['cm', 'm', 'inch', 'ft'].includes(unit)) {
        category = 'Length';
      } else if (['hour', 'min', 'day'].includes(unit)) {
        category = 'Time';
      } else if (['package', 'parcel', 'trip'].includes(unit)) {
        category = 'Delivery';
      } else if (['room', 'event', 'service'].includes(unit)) {
        category = 'Service';
      }

      standardUnits.push({
        unit,
        displayName: getUnitDisplayName(unit),
        category
      });
    }
  });

  return standardUnits;
}

// Get human-readable display name for a unit
function getUnitDisplayName(unit: string): string {
  const displayNames: Record<string, string> = {
    'KG': 'Kilograms',
    'gram': 'Grams',
    'piece': 'Pieces',
    'bunch': 'Bunches',
    'dozen': 'Dozen',
    'L': 'Liters',
    'ml': 'Milliliters',
    'small': 'Small bottles',
    'medium': 'Medium bottles',
    'large': 'Large bottles',
    'cm': 'Centimeters',
    'm': 'Meters',
    'inch': 'Inches',
    'ft': 'Feet',
    'hour': 'Hours',
    'min': 'Minutes',
    'day': 'Days',
    'room': 'Rooms',
    'event': 'Events',
    'service': 'Services',
    'table': 'Tables',
    'chair': 'Chairs',
    'person': 'Persons',
    'trip': 'Trips',
    'distance': 'Distance',
    'booking': 'Bookings',
    'serving': 'Servings',
    'plate': 'Plates',
    'bowl': 'Bowls',
    'cup': 'Cups',
    'spoon': 'Spoons',
    'fork': 'Forks',
    'breakfast': 'Breakfasts',
    'visit': 'Visits',
    'job': 'Jobs',
    'duration': 'Duration',
    'session': 'Sessions',
    'treatment': 'Treatments',
    'journey': 'Journeys',
    'path': 'Paths',
    'mile': 'Miles',
    'appointment': 'Appointments',
    'setup': 'Setups',
    'guest': 'Guests',
    'meal': 'Meals',
    'facility': 'Facilities',
    'catering': 'Catering',
  };

  return displayNames[unit] || unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
}

// Calculate base unit price for different business types
export function calculateBaseUnitPrice(
  price: number,
  unit: string,
  businessType: string
): { basePrice: number; baseUnit: string; pricePerStandardUnit: number } {
  const businessUnits = UnitConversionMap[businessType];
  if (!businessUnits) {
    return { basePrice: price, baseUnit: unit, pricePerStandardUnit: price };
  }

  const unitConfig = businessUnits[unit];
  if (!unitConfig || !isUnitConversion(unitConfig)) {
    return { basePrice: price, baseUnit: unit, pricePerStandardUnit: price };
  }

  // Convert to the base unit for this business type
  const baseUnit = unitConfig.to;
  const factor = unitConfig.factor;

  const basePrice = price * factor;
  const pricePerStandardUnit = calculateStandardUnitPrice(basePrice, baseUnit, businessType);

  return {
    basePrice,
    baseUnit,
    pricePerStandardUnit
  };
}

// Calculate price per standard unit
function calculateStandardUnitPrice(
  basePrice: number,
  baseUnit: string,
  businessType: string
): number {
  // Define standard units for each business type
  const standardUnits: Record<string, Record<string, number>> = {
    grocery: {
      'KG': 1,
      'gram': 1000,
      'piece': 10,
      'bunch': 3.33,
      'dozen': 120,
      'L': 1,
      'ml': 1000,
      'small': 250,
      'medium': 500,
      'large': 1000,
    },
    restaurant: {
      'piece': 1,
      'serving': 1,
      'plate': 1,
      'bowl': 2,
      'cup': 250,
      'spoon': 15,
    },
    hotel: {
      'room': 1,
      'night': 24,
      'person': 1,
      'breakfast': 1,
    },
    hall: {
      'event': 1,
      'table': 8,
      'chair': 1,
      'guest': 1,
    },
    service: {
      'hour': 60,
      'min': 1,
      'day': 1440,
      'job': 1,
    },
    beauty: {
      'service': 1,
      'duration': 60,
      'session': 1,
    },
    delivery: {
      'package': 1,
      'parcel': 1,
      'trip': 1,
    },
  };

  const standardFactor = standardUnits[businessType]?.[baseUnit] || 1;
  return basePrice / standardFactor;
}

// Validate if a combination of quantity and unit is valid for a business type
export function validateQuantityAndUnit(
  quantity: number,
  unit: string,
  businessType: string
): { isValid: boolean; error?: string } {
  const businessUnits = UnitConversionMap[businessType];
  if (!businessUnits) {
    return { isValid: true };
  }

  const unitConfig = businessUnits[unit];
  if (!unitConfig) {
    return { isValid: false, error: `Unit '${unit}' is not supported for business type '${businessType}'` };
  }

  // Check minimum and maximum quantity limits
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }

  // Business-specific validation rules
  if (businessType === 'grocery') {
    if (quantity > 10000) {
      return { isValid: false, error: 'Grocery quantity cannot exceed 10kg' };
    }
  }

  if (businessType === 'restaurant') {
    if (quantity > 1000) {
      return { isValid: false, error: 'Restaurant quantity cannot exceed 1000 pieces' };
    }
  }

  if (businessType === 'hotel') {
    if (quantity > 100) {
      return { isValid: false, error: 'Hotel booking cannot exceed 100 nights' };
    }
  }

  if (businessType === 'hall') {
    if (quantity > 10) {
      return { isValid: false, error: 'Hall booking cannot exceed 10 events' };
    }
  }

  return { isValid: true };
}

// Get quantity suggestions for a business type and unit
export function getQuantitySuggestions(
  businessType: string,
  unit: string
): Array<{ value: number; label: string }> {
  const suggestions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 500, label: '500' },
    { value: 1000, label: '1000' },
  ];

  // Business-specific suggestions
  if (businessType === 'grocery' && unit === 'gram') {
    return [
      { value: 100, label: '100g' },
      { value: 250, label: '250g' },
      { value: 500, label: '500g' },
      { value: 1000, label: '1kg' },
      { value: 2000, label: '2kg' },
      { value: 5000, label: '5kg' },
    ];
  }

  if (businessType === 'grocery' && unit === 'L') {
    return [
      { value: 100, label: '100ml' },
      { value: 250, label: '250ml' },
      { value: 500, label: '500ml' },
      { value: 1, label: '1L' },
      { value: 2, label: '2L' },
    ];
  }

  if (businessType === 'restaurant' && unit === 'plate') {
    return [
      { value: 1, label: '1 Plate' },
      { value: 2, label: '2 Plates' },
      { value: 5, label: '5 Plates' },
      { value: 10, label: '10 Plates' },
      { value: 20, label: '20 Plates' },
      { value: 50, label: '50 Plates' },
    ];
  }

  if (businessType === 'hotel' && unit === 'night') {
    return [
      { value: 1, label: '1 Night' },
      { value: 2, label: '2 Nights' },
      { value: 3, label: '3 Nights' },
      { value: 5, label: '5 Nights' },
      { value: 7, label: '7 Nights' },
      { value: 14, label: '14 Nights' },
    ];
  }

  return suggestions;
}
