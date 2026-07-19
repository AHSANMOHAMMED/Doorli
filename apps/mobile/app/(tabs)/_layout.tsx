import { Redirect } from 'expo-router';

/** Legacy stub tabs → real customer app */
export default function LegacyTabsRedirect() {
  return <Redirect href="/(customer)" />;
}
