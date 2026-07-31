export function setSocketServer(_server: unknown): void {}

export function getSocketServer(): any {
  return null;
}

export function emitOrderEvent(
  event: string,
  rooms: string[],
  _payload: unknown,
): void {
  // TODO: Send via HTTP to Notifications Service or Redis PubSub
  console.log('[MOCK] emitOrderEvent', event, rooms);
}

export function emitDriverEvent(
  event: string,
  rooms: string[],
  _payload: unknown,
): void {
  // TODO: Send via HTTP to Notifications Service or Redis PubSub
  console.log('[MOCK] emitDriverEvent', event, rooms);
}

export function registerSocketAuth(_ioServer: unknown): void {}
