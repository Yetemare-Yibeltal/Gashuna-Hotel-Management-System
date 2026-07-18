import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IAIFeedback extends Document {
  conversation: Types.ObjectId;
  sessionId: string;
  guest?: Types.ObjectId;
  user?: Types.ObjectId;
  rating: number;
  helpful: boolean;
  comment?: string;
  messageIndex?: number;
  feedbackType: 'chat' | 'voice' | 'prediction' | 'recommendation';
  createdAt: Date;
  updatedAt: Date;
}

const aiFeedbackSchema = new Schema<IAIFeedback>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    helpful: {
      type: Boolean,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    messageIndex: {
      type: Number,
      min: 0,
    },
    feedbackType: {
      type: String,
      enum: ['chat', 'voice', 'prediction', 'recommendation'],
      default: 'chat',
    },
  },
  { timestamps: true }
);

aiFeedbackSchema.index({ conversation: 1 });
aiFeedbackSchema.index({ feedbackType: 1 });
aiFeedbackSchema.index({ rating: 1 });

const AIFeedback: Model<IAIFeedback> = model<IAIFeedback>(
  'AIFeedback',
  aiFeedbackSchema
);

export default AIFeedback;
