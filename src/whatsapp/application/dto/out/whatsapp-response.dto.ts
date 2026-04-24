export class WhatsappResponseDto {
  status: string;
  timestamp: string;

  constructor(status: string = 'success') {
    this.status = status;
    this.timestamp = new Date().toISOString();
  }
}
