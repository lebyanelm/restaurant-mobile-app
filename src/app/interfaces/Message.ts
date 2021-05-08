import { TimeCreated } from './TimeCreated';
export interface Message {
    id?: string;
    timeCreated?: TimeCreated;
    body: string;
    branchId?: string;
    attachments?: string[];
    type?: string;
    state?: number;
    from?: string;
    to?: string;
}
