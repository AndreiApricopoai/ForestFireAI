/**
 * Calculates the overall risk level for a frame based on the detected objects.
 *
 * Risk scale:
 *   none     — no fire or smoke detected
 *   low      — faint smoke or low-confidence fire
 *   medium   — moderate smoke or moderate fire
 *   high     — strong smoke or significant fire
 *   critical — very high-confidence fire detection
 *
 * Thresholds:
 *   critical  fire >= 0.85
 *   high      fire >= 0.60  OR  smoke >= 0.70
 *   medium    fire >= 0.35  OR  smoke >= 0.45
 *   low       any fire/smoke detected below medium thresholds
 *   none      no detections
 */
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
