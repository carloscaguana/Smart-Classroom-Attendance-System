// Turns a students totalSeconds into a HH:MM:SS format
  // Returns the total time a student spent in a class
export function formatTotalDuration(totalSeconds = 0) {
    const hour = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hour}h ${minutes}m ${seconds}s`;
  }