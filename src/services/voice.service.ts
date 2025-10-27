import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'discord.js';
import {
  AudioPlayer,
  VoiceConnection,
  createAudioPlayer,
} from '@discordjs/voice';

@Injectable()
export class VoiceService implements OnModuleInit {
  private connection: VoiceConnection;
  private player: AudioPlayer;

  constructor(
    private readonly client: Client,
    readonly configService: ConfigService,
  ) {
    this.player = createAudioPlayer();
  }

  onModuleInit() {
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      const channelId = this.configService.get<string>(
        'DISCORD_VOICE_CHANNEL_ID',
      )!;
      console.log(
        '🚀 ~ VoiceService ~ onModuleInit ~ env channelId:',
        channelId,
      );
      console.log('🚀 ~ VoiceService ~ onModuleInit ~ oldState:', oldState);
      console.log('🚀 ~ VoiceService ~ onModuleInit ~ newState:', newState);
      console.log(
        '🚀 ~ VoiceService ~ onModuleInit ~ newState.channelId === channelId:',
        newState.channelId === channelId,
      );
      if (
        newState.channelId === channelId &&
        (!oldState.channelId || oldState.channelId !== channelId)
      ) {
        console.log('Voice state updated');
      }
    });
  }
}
