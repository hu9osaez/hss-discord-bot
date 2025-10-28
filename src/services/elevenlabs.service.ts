import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Readable } from 'node:stream';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly client: ElevenLabsClient;
  private readonly voiceId: string;
  private readonly modelId: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'ELEVENLABS_API_KEY is not configured. ElevenLabs functionality will not work.',
      );
      return;
    }

    this.client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    this.voiceId =
      this.configService.get<string>('ELEVENLABS_VOICE_ID') ||
      'JBFqnCBsd6RMkjVDRZzb'; // Default voice
    this.modelId =
      this.configService.get<string>('ELEVENLABS_MODEL_ID') ||
      'eleven_turbo_v2_5'; // Fast model for conversation

    this.logger.log('ElevenLabs service initialized successfully');
  }

  /**
   * Generate speech audio from text using ElevenLabs TTS
   * @param text The text to convert to speech
   * @returns Readable stream of MP3 audio
   */
  async generateSpeech(text: string): Promise<Readable> {
    if (!this.client) {
      throw new Error(
        'ElevenLabs client not initialized - check ELEVENLABS_API_KEY',
      );
    }

    try {
      this.logger.log(
        `Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      );

      // Generate speech stream from ElevenLabs
      const response = await this.client.textToSpeech.stream(this.voiceId, {
        text: text,
        modelId: this.modelId,
        optimizeStreamingLatency: 3, // Optimize for low latency
        outputFormat: 'mp3_44100_128', // MP3 format for compatibility
      });

      // Convert the response to a Readable stream
      const stream = new Readable({
        read() {},
      });

      // Handle the stream data
      const reader = response.getReader();

      const pushData = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            stream.push(null); // End the stream
            return;
          }
          stream.push(Buffer.from(value));
          await pushData(); // Continue reading
        } catch (error) {
          this.logger.error(`Error reading ElevenLabs stream: ${error}`);
          stream.destroy(error as Error);
        }
      };

      await pushData();

      this.logger.debug('ElevenLabs speech generation completed');
      return stream;
    } catch (error) {
      this.logger.error(`Failed to generate speech with ElevenLabs: ${error}`);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized');
    }

    try {
      const voices = await this.client.voices.search();
      return voices;
    } catch (error) {
      this.logger.error(`Failed to fetch voices from ElevenLabs: ${error}`);
      throw error;
    }
  }

  /**
   * Check if ElevenLabs service is properly configured
   */
  isConfigured(): boolean {
    return this.client !== undefined;
  }
}
