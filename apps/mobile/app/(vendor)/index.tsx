import { Redirect } from 'expo-router';

/** Default vendor landing → mobile cashier hub */
export default function VendorIndex() {
  return <Redirect href={"/(vendor)/hub" as any} />;
}
