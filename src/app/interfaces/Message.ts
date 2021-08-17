import { TimeCreated } from './TimeCreated';
export interface Message {
  id?: string;
  timeCreated?: TimeCreated;
  body: string;
  branchId?: string;
  attachments?: string[];
  type?: string;
  state?: number;
  reply?: {
    type?: string;
    body?: string;
    id?: string;
  };
  from?: string;
  to?: string;
}
