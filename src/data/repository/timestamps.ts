export const creationTimestamps = () => {
  const now = Date.now();
  return { createdAt: now, updatedAt: now, deletedAt: null };
};
