import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class NotificationService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly sessionService: SessionService) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    options: { excludeSessionId?: string; data?: Record<string, unknown> },
  ) {
    const sessions = await this.sessionService.getUserSessions(userId);

    const pushTokens = [
      ...new Set(
        sessions
          .filter((s) => s._id.toString() !== options?.excludeSessionId)
          .map((s) => s?.pushToken)
          .filter((t) => Expo.isExpoPushToken(t)),
      ),
    ];

    if (pushTokens.length === 0) return;

    const messages: ExpoPushMessage[] = pushTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: options?.data ?? {},
    }));

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.debug(`Push dispatch tickets: ${JSON.stringify(tickets)}`);
      } catch (error) {
        this.logger.error(
          'Error dispatching Expo push notification chunk',
          error,
        );
      }
    }
  }
}
