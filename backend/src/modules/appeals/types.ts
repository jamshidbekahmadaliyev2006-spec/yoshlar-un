export interface Appeal {
  id: number;
  userName: string;
  phone: string;
  mahalla: string;
  category: string;
  subject: string;
  text: string;
  createdAt: string;
  status: 'new' | 'answered' | 'rejected';
  replyText?: string;
  repliedAt?: string;
  repliedBy?: string;
}

