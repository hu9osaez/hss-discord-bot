import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once } from 'necord';
import { Client, Events, Message, TextChannel } from 'discord.js';
import { ofetch } from 'ofetch';

@Injectable()
export class AppListeners {
  private readonly logger = new Logger(AppListeners.name);
  @Once(Events.ClientReady)
  public onReady(@Context() [client]: [Client]): void {
    this.logger.log(`Bot connected as ${client.user?.displayName}`);
  }

  @On(Events.MessageCreate)
  public async onMessageCreate(@Context() [message]: [Message]): Promise<void> {
    if (message.author.bot) return;

    if (message.channel.isTextBased()) {
      if (!message.channel.isDMBased()) {
        const webhookUrl = process.env.WEBHOOK_URL;
        if (webhookUrl) {
          await ofetch(webhookUrl, {
            method: 'POST',
            body: {
              content: message.content || null,
              attachments: message.attachments.map((attachment) => ({
                url: attachment.url,
                proxyURL: attachment.proxyURL,
                size: attachment.size,
                contentType: attachment.contentType,
              })),
              author: {
                id: message.author.id,
                bot: message.author.bot,
                username: message.author.username,
                globalName: message.author.globalName,
                discriminator: message.author.discriminator,
              },
              channel: {
                id: message.channel.id,
                name: (message.channel as TextChannel).name,
              },
              guild: {
                id: message.guild?.id,
                name: message.guild?.name,
              },
              timestamp: message.createdAt,
            },
          });
        }
      }
    }
  }
}
