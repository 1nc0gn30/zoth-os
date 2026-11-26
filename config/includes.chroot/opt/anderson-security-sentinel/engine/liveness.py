import cv2
import numpy as np
from collections import deque

class LivenessAnalyzer:
    """
    Lightweight, real-time CPU liveness & anti-spoofing analyzer.
    Analyzes:
      1. Micro-tremor / landmark displacement variance over rolling frames
      2. Facial skin texture & edge gradient variance (Laplacian)
      3. Head pose & bilateral eye-to-nose symmetry
    """
    def __init__(self, history_len=8):
        self.history_len = history_len
        self.face_history = deque(maxlen=history_len)

    def analyze(self, frame, box, landmarks):
        """
        Evaluate facial liveness.
        Args:
            frame: raw camera frame (BGR)
            box: [x, y, w, h]
            landmarks: list of 5 tuples [(x, y), ...]
        Returns:
            liveness_score (0.0 to 1.0), is_organic (bool), details (dict)
        """
        x, y, w, h = box
        fh, fw, _ = frame.shape

        # 1. Texture Variance (detect flat printed photos or blurry screens)
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(fw, x + w), min(fh, y + h)

        texture_score = 0.5
        texture_var = 0.0
        if x2 > x1 and y2 > y1:
            crop = frame[y1:y2, x1:x2]
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            texture_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            # Natural human webcam face crops usually have texture variance between 60 and 800
            if 50.0 <= texture_var <= 1200.0:
                texture_score = 0.95
            elif texture_var < 35.0:
                # Flat blurry print or washed out screen
                texture_score = 0.35
            else:
                # Excessive high-frequency noise or sharp raster moiré
                texture_score = 0.65

        # 2. Facial Landmark Symmetry (Yaw & Pitch)
        # landmarks: [right_eye, left_eye, nose_tip, right_mouth, left_mouth]
        re, le, nt, rm, lm = landmarks
        d_re_nt = np.hypot(re[0] - nt[0], re[1] - nt[1])
        d_le_nt = np.hypot(le[0] - nt[0], le[1] - nt[1])
        yaw_ratio = float(min(d_re_nt, d_le_nt) / (max(d_re_nt, d_le_nt) + 1e-5))
        symmetry_score = min(1.0, max(0.4, yaw_ratio + 0.2))

        # 3. Micro-Movement Variance over Rolling Frames
        # Normalize landmarks relative to bounding box
        norm_landmarks = [
            ((pt[0] - x) / max(1, w), (pt[1] - y) / max(1, h))
            for pt in landmarks
        ]
        self.face_history.append(norm_landmarks)

        motion_score = 0.85
        motion_var = 0.0
        if len(self.face_history) >= 4:
            # Calculate standard deviation of landmarks over time
            arr = np.array(self.face_history) # shape (T, 5, 2)
            variances = np.var(arr, axis=0) # shape (5, 2)
            motion_var = float(np.mean(variances))

            # A completely static photo has zero micro-variation (< 1e-6)
            if motion_var < 5e-7:
                motion_score = 0.20 # Suspected static printed photo
            elif 5e-7 <= motion_var <= 0.005:
                motion_score = 0.98 # Natural human physiological micro-motion
            else:
                motion_score = 0.75 # High head movement

        # Weighted Composite Liveness Score
        composite = 0.40 * texture_score + 0.40 * motion_score + 0.20 * symmetry_score
        liveness_score = round(float(np.clip(composite, 0.05, 0.99)), 2)
        is_organic = liveness_score >= 0.65

        details = {
            "liveness_pct": int(liveness_score * 100),
            "is_organic": is_organic,
            "texture_var": round(texture_var, 1),
            "motion_var": round(motion_var * 1000, 4),
            "yaw_symmetry": round(yaw_ratio, 2)
        }

        return liveness_score, is_organic, details
