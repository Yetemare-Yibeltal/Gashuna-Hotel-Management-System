import { Schema, model, Document, Model, Types } from 'mongoose';

export type ConversationChannel = 'web_chat' | 'voice' | 'admin_chat';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationLanguage = 'en' | 'am' | 'mixed';

export interface IMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  audioUrl?: string;
  tokensUsed?: number;
}

export interface IConversation extends Document {
  sessionId: string;
  guest?: Types.ObjectId;
  user?: Types.ObjectId;
  channel: ConversationChannel;
  language: ConversationLanguage;
  messages: IMessage[];
  totalTokensUsed: number;
  isActive: boolean;
  endedAt?: Date;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    audioUrl: String,
    tokensUsed: Number,
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    channel: {
      type: String,
      enum: ['web_chat', 'voice', 'admin_chat'],
      default: 'web_chat',
    },
    language: {
      type: String,
      enum: ['en', 'am', 'mixed'],
      default: 'en',
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    endedAt: Date,
    summary: String,
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
  },
  { timestamps: true }
);

conversationSchema.index({ sessionId: 1 });
conversationSchema.index({ guest: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

const AIConversation: Model<IConversation> = model<IConversation>(
  'AIConversation',
  conversationSchema
);

export default AIConversation;
