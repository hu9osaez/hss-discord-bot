import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'discord.js';
import {
  AudioPlayer,
  VoiceConnection,
  createAudioPlayer,
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} from '@discordjs/voice';
import { Readable } from 'node:stream';
import prism from 'prism-media';

@Injectable()
export class VoiceService implements OnModuleInit {
  private connection: VoiceConnection | undefined; // Make connection optional as it may not always exist
  private player: AudioPlayer;
  private readonly logger = new Logger(VoiceService.name);
  private readonly targetUserId: string | undefined;
  private readonly targetChannelId: string | undefined;

  constructor(
    private readonly client: Client,
    readonly configService: ConfigService,
  ) {
    // Initialize AudioPlayer with specific behaviors
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop, // Stop audio if no one is listening
      },
    });
    // Get target user and channel IDs from environment configuration
    this.targetUserId = configService.get<string>('DISCORD_USER_ID');
    this.targetChannelId = configService.get<string>(
      'DISCORD_VOICE_CHANNEL_ID',
    );

    if (!this.targetChannelId) {
      this.logger.warn(
        'DISCORD_VOICE_CHANNEL_ID is not set. Automatic voice connection will not function.',
      );
    }
    if (!this.targetUserId) {
      this.logger.log(
        'DISCORD_USER_ID is not set. Bot will connect to channel when anyone joins.',
      );
    }
  }

  onModuleInit() {
    if (!this.targetChannelId) {
      this.logger.warn(
        'DISCORD_VOICE_CHANNEL_ID is not configured. Skipping voice state listener setup.',
      );
      return;
    }

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      const userJustJoinedTargetChannel =
        newState.channelId === this.targetChannelId && !oldState.channelId;
      const userLeftTargetChannel =
        oldState.channelId === this.targetChannelId && !newState.channelId;
      const botMovedToTargetChannel =
        newState.channelId === this.targetChannelId &&
        newState.member?.id === this.client.user?.id;
      const botLeftTargetChannel =
        oldState.channelId === this.targetChannelId &&
        newState.member?.id === this.client.user?.id;

      // Check if the event is relevant: user joining target channel, or bot joining/leaving.
      if (userJustJoinedTargetChannel) {
        this.logger.log(
          `User ${newState.member?.user.tag} joined target channel ${this.targetChannelId}.`,
        );

        // Optional: Check if it's the specific target user
        if (this.targetUserId && newState.member?.id !== this.targetUserId) {
          this.logger.debug(
            `Skipping auto-join: User ${newState.member?.id} is not the target user ${this.targetUserId}.`,
          );
          return;
        }

        // Avoid rejoining if already connected to the same channel
        if (this.connection) {
          this.logger.debug(
            `Bot is already connected to channel ${this.targetChannelId}. No need to rejoin.`,
          );
          return;
        }

        // Attempt to join the voice channel
        try {
          this.logger.log(
            `Attempting to join voice channel: ${newState.channelId} in guild: ${newState.guild.id}`,
          );
          this.connection = joinVoiceChannel({
            channelId: newState.channelId!,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator as any, // Type assertion may be needed for broader compatibility
          });

          await entersState(
            this.connection,
            VoiceConnectionStatus.Ready,
            30_000,
          ); // 30 second timeout
          this.logger.log(
            `Bot successfully connected to voice channel ${newState.channelId} in guild ${newState.guild.id}.`,
          );

          // Subscribe the player to the connection. The player will play audio when a resource is added.
          this.connection.subscribe(this.player);
          this.logger.debug('Audio player subscribed to voice connection.');
        } catch (error) {
          this.logger.error(
            `Failed to join voice channel ${newState.channelId} or enter Ready state: ${error}`,
          );
          this.connection?.destroy(); // Clean up the connection if it failed
          this.connection = undefined;
        }
      } else if (userLeftTargetChannel) {
        // User left the target channel
        this.logger.log(
          `User ${newState.member?.user.tag} (or someone) left target channel ${this.targetChannelId}. Checking if bot should disconnect.`,
        );
        // Logic to disconnect bot if it should leave when user leaves
        // For now, we assume bot stays connected until explicitly told to leave or user leaves as a trigger.
        // If the bot should disconnect when the user leaves:
        if (this.connection) {
          this.logger.log(
            'User left target channel. Destroying voice connection.',
          );
          this.connection.destroy();
          this.connection = undefined;
        }
      } else if (botMovedToTargetChannel) {
        // The bot itself might have changed its voice state (e.g., mute/unmute toggled by Discord UI)
        // This might be useful for ensuring the bot is unmuted if needed for playback in the future.
        this.logger.debug(
          `Bot's own voice state updated in channel ${newState.channelId}. Current connection status relevant?`,
        );
        // Could potentially re-ensure connection is ready or re-subscribe if needed.
      } else if (botLeftTargetChannel) {
        // The bot was disconnected from the channel by Discord or another process
        this.logger.warn(
          `Bot was disconnected from voice channel ${oldState.channelId}. Resetting connection state.`,
        );
        this.connection = undefined;
        // Consider attempting to rejoin if this was unintentional and targetChannelId is still valid
      }
    });
  }

  // Method to get the current voice connection
  public getConnection(): VoiceConnection | undefined {
    return this.connection;
  }

  // Method to get the audio player instance
  public getPlayer(): AudioPlayer {
    return this.player;
  }

  // Method to explicitly disconnect the bot from the voice channel
  public disconnect(): void {
    if (this.connection) {
      this.logger.log('Explicitly disconnecting from voice channel.');
      this.connection.destroy();
      this.connection = undefined;
    } else {
      this.logger.log('Not currently connected to any voice channel.');
    }
  }

  // Method to play audio from a stream (for ElevenLabs integration)
  public async playAudioStream(stream: Readable): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to any voice channel');
    }

    try {
      // Convert MP3 stream to Opus format for Discord
      const opusStream = this.convertMp3ToOpus(stream);

      // Create audio resource from Opus stream
      const resource = createAudioResource(opusStream, {
        inputType: StreamType.OggOpus,
        inlineVolume: true
      });

      // Play the audio
      this.player.play(resource);

      // Wait for playback to start
      await entersState(this.player, AudioPlayerStatus.Playing, 5_000);

      this.logger.log('Audio playback started successfully');
    } catch (error) {
      this.logger.error(`Failed to play audio stream: ${error}`);
      throw error;
    }
  }

  // Method to convert MP3 stream to Opus format for Discord
  private convertMp3ToOpus(mp3Stream: Readable): Readable {
    const ffmpeg = new prism.FFmpeg({
      args: [
        '-i', 'pipe:0',           // Input from stdin
        '-f', 'opus',             // Output format
        '-acodec', 'libopus',     // Audio codec
        '-ar', '48000',           // Sample rate
        '-ac', '2',               // Channels
        '-b:a', '128k',           // Bitrate
        'pipe:1'                  // Output to stdout
      ]
    });

    // Pipe MP3 stream through FFmpeg to convert to Opus
    return mp3Stream.pipe(ffmpeg);
  }

  // Method to check if bot is currently connected to voice
  public isConnected(): boolean {
    return this.connection !== undefined;
  }

  // Method to get current connection status
  public getConnectionStatus(): string {
    if (!this.connection) {
      return 'disconnected';
    }
    return this.connection.state.status;
  }
}
