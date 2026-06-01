export function calculateRiskLevel(
  detections: Array<{ class: string; confidence: number }>,
): string {
  if (!detections || detections.length === 0) {
    return 'none';
  }

  let maxFireConfidence = 0;
  let maxSmokeConfidence = 0;

  for (const detection of detections) {
    if (detection.class === 'fire') {
      if (detection.confidence > maxFireConfidence) {
        maxFireConfidence = detection.confidence;
      }
    } else if (detection.class === 'smoke') {
      if (detection.confidence > maxSmokeConfidence) {
        maxSmokeConfidence = detection.confidence;
      }
    }
  }

  if (maxFireConfidence >= 0.85) {
    return 'critical';
  }

  if (maxFireConfidence >= 0.6 || maxSmokeConfidence >= 0.7) {
    return 'high';
  }

  if (maxFireConfidence >= 0.35 || maxSmokeConfidence >= 0.45) {
    return 'medium';
  }

  if (maxFireConfidence > 0 || maxSmokeConfidence > 0) {
    return 'low';
  }

  return 'none';
}
