/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelType, Client, Message, VoiceState } from 'discord.js';
import { VoiceService } from './voice.service';
import { ElevenLabsService } from './elevenlabs.service';

@Injectable()
export class ConversationService implements OnModuleInit {
  private readonly logger = new Logger(ConversationService.name);
  private readonly targetUserId: string | undefined;
  private readonly targetChannelId: string | undefined;
  private conversationActive = false;

  constructor(
    private readonly client: Client,
    private readonly configService: ConfigService,
    private readonly voiceService: VoiceService,
    private readonly elevenLabsService: ElevenLabsService,
  ) {
    this.targetUserId = this.configService.get<string>('DISCORD_USER_ID');
    this.targetChannelId = this.configService.get<string>(
      'DISCORD_VOICE_CHANNEL_ID',
    );
  }

  onModuleInit() {
    if (!this.targetChannelId) {
      this.logger.warn(
        'DISCORD_VOICE_CHANNEL_ID not configured. Conversation service disabled.',
      );
      return;
    }

    // Listen for voice state updates to start conversation
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      this.handleVoiceStateUpdate(oldState, newState);
    });

    // Listen for text messages to trigger conversation
    this.client.on('messageCreate', async (message: Message) => {
      await this.handleMessageCreate(message);
    });

    this.logger.log('Conversation service initialized');
  }

  /**
   * Handle voice state updates to detect when target user joins voice channel
   */
  private handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): void {
    const userJustJoinedTargetChannel =
      newState.channelId === this.targetChannelId && !oldState.channelId;

    if (userJustJoinedTargetChannel) {
      const userId = newState.member?.id;

      // Check if it's the target user (if configured)
      if (this.targetUserId && userId !== this.targetUserId) {
        this.logger.debug(
          `Skipping conversation: User ${userId} is not target user ${this.targetUserId}`,
        );
        return;
      }

      this.logger.log(
        `Target user ${userId} joined voice channel. Starting conversation...`,
      );

      // Wait a moment for the bot to connect to voice
      setTimeout(async () => {
        await this.startConversation();
      }, 2000);
    }
  }

  /**
   * Handle text messages to trigger conversation commands
   */
  private async handleMessageCreate(message: Message): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if message is in the target voice channel's text channel
    if (message.channel.type !== ChannelType.GuildText) return; // Only text channels

    // Check for conversation commands
    if (message.content.toLowerCase() === '!start') {
      this.logger.log(
        `User ${message.author.tag} requested conversation start`,
      );
      await this.startConversation();
    } else if (message.content.toLowerCase() === '!stop') {
      this.logger.log(`User ${message.author.tag} requested conversation stop`);
      this.stopConversation();
    }
  }

  /**
   * Start a conversation with the user
   */
  async startConversation(): Promise<void> {
    if (this.conversationActive) {
      this.logger.debug('Conversation already active');
      return;
    }

    if (!this.voiceService.isConnected()) {
      this.logger.warn(
        'Bot not connected to voice channel. Cannot start conversation.',
      );
      return;
    }

    if (!this.elevenLabsService.isConfigured()) {
      this.logger.warn('ElevenLabs not configured. Cannot start conversation.');
      return;
    }

    this.conversationActive = true;
    this.logger.log('Starting conversation...');

    try {
      // Generate greeting message
      const greeting =
        '¡Hola! Me he conectado al canal de voz. ¿En qué puedo ayudarte hoy?';

      // Generate speech and play it
      const audioStream = await this.elevenLabsService.generateSpeech(greeting);
      await this.voiceService.playAudioStream(audioStream);

      this.logger.log('Greeting played successfully');
    } catch (error) {
      this.logger.error(`Failed to start conversation: ${error}`);
      this.conversationActive = false;
    }
  }

  /**
   * Stop the conversation
   */
  stopConversation(): void {
    this.conversationActive = false;
    this.logger.log('Conversation stopped');
  }

  /**
   * Send a message through voice
   */
  async speak(text: string): Promise<void> {
    if (!this.conversationActive) {
      this.logger.warn('Conversation not active. Cannot speak.');
      return;
    }

    if (!this.voiceService.isConnected()) {
      this.logger.warn('Bot not connected to voice channel. Cannot speak.');
      return;
    }

    try {
      this.logger.log(`Speaking: "${text}"`);

      // Generate speech and play it
      const audioStream = await this.elevenLabsService.generateSpeech(text);
      await this.voiceService.playAudioStream(audioStream);

      this.logger.log('Speech played successfully');
    } catch (error) {
      this.logger.error(`Failed to speak: ${error}`);
      throw error;
    }
  }

  /**
   * Check if conversation is active
   */
  isConversationActive(): boolean {
    return this.conversationActive;
  }
}
