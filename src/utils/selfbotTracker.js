const selfbotIds = new Set();

export function registerSelfbotId(userId) {
  selfbotIds.add(userId);
}

export function getSelfbotIds() {
  return Array.from(selfbotIds);
}
