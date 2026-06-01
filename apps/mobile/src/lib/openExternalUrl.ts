import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { logger } from './logger';

/** Opens http(s) in an in-app browser; mailto/tel via the system handler. */
export async function openExternalUrl(url: string): Promise<void> {
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      logger.warn('openExternalUrl: cannot open', { url });
      return;
    }
    await Linking.openURL(url);
    return;
  }

  await WebBrowser.openBrowserAsync(url);
}
