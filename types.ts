
export enum NodeStatus {
  ACTIVE = 'ACTIVE',
  STANDBY = 'STANDBY',
  LOCKED = 'LOCKED'
}

export interface Node {
  id: string;
  name: string;
  location: string;
  status: NodeStatus;
  lead: string;
}
