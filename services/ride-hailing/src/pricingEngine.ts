// Geographic Dynamic Pricing Engine

export const calculateFare = (
  baseFare: number,
  pickupZoneDemand: number,
  dropoffZoneDemand: number,
  distanceKm: number
): { fare: number; returnPremium: number } => {
  // If moving from High Demand (5) to Low Demand (1), driver risks an empty return
  let returnPremium = 0;
  
  if (pickupZoneDemand > dropoffZoneDemand) {
    const demandDelta = pickupZoneDemand - dropoffZoneDemand;
    // Calculate a premium based on distance and demand delta
    returnPremium = (distanceKm * 0.5) * demandDelta; 
  }

  return {
    fare: baseFare + returnPremium,
    returnPremium
  };
};
