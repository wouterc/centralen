import { OpgaveStatus, OpgavePriority } from './types';

export const STATUS_LABELS: Record<string, string> = {
    [OpgaveStatus.BACKLOG]: 'Indbakke',
    [OpgaveStatus.ON_HOLD]: 'On Hold',
    [OpgaveStatus.TODO]: 'Klar til start',
    [OpgaveStatus.IN_PROGRESS]: 'Igang',
    [OpgaveStatus.TEST]: 'Test',
    [OpgaveStatus.DONE]: 'Færdig',
};

export const PRIORITY_LABELS: Record<string, string> = {
    [OpgavePriority.LOW]: 'Lav',
    [OpgavePriority.MEDIUM]: 'Middel',
    [OpgavePriority.HIGH]: 'Høj',
    [OpgavePriority.URGENT]: 'Haster',
};
