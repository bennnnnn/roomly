/** Send Expo push notifications (https://docs.expo.dev/push-notifications/sending-notifications/). */

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed: ${response.status} ${text}`);
  }
}
