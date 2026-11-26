import os
import cv2
import threading
import numpy as np
from pathlib import Path

from .config import YUNET_MODEL_PATH, SFACE_MODEL_PATH, ENROLLED_FACES_PATH
from .liveness import LivenessAnalyzer

class FaceSecurityEngine:
    def __init__(self, score_threshold=0.6, nms_threshold=0.3):
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.input_size = (640, 480)
        self.lock = threading.Lock()
        self.liveness = LivenessAnalyzer()

        self._ensure_models_exist()

        self.detector = cv2.FaceDetectorYN.create(
            model=YUNET_MODEL_PATH,
            config="",
            input_size=self.input_size,
            score_threshold=self.score_threshold,
            nms_threshold=self.nms_threshold,
            top_k=5000
        )
        self.recognizer = cv2.FaceRecognizerSF.create(
            model=SFACE_MODEL_PATH,
            config=""
        )

        self.enrolled_embeddings = [] # list of numpy arrays (1, 128)
        self.load_enrolled_faces()

    def _ensure_models_exist(self):
        import urllib.request
        yunet_url = 'https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx'
        sface_url = 'https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx'

        os.makedirs(os.path.dirname(YUNET_MODEL_PATH), exist_ok=True)
        if not os.path.exists(YUNET_MODEL_PATH):
            print("[Detector] Downloading YuNet model...")
            urllib.request.urlretrieve(yunet_url, YUNET_MODEL_PATH)
        if not os.path.exists(SFACE_MODEL_PATH):
            print("[Detector] Downloading SFace model...")
            urllib.request.urlretrieve(sface_url, SFACE_MODEL_PATH)

    def load_enrolled_faces(self):
        self.enrolled_embeddings = []
        if os.path.exists(ENROLLED_FACES_PATH):
            try:
                data = np.load(ENROLLED_FACES_PATH)
                if "embeddings" in data:
                    self.enrolled_embeddings = list(data["embeddings"])
                print(f"[Detector] Loaded {len(self.enrolled_embeddings)} enrolled face templates for Mr. Anderson.")
            except Exception as e:
                print(f"[Detector] Error loading enrolled faces: {e}")

    def save_enrolled_faces(self):
        try:
            if self.enrolled_embeddings:
                np.savez(ENROLLED_FACES_PATH, embeddings=np.array(self.enrolled_embeddings))
            elif os.path.exists(ENROLLED_FACES_PATH):
                os.remove(ENROLLED_FACES_PATH)
            print(f"[Detector] Saved {len(self.enrolled_embeddings)} face templates.")
        except Exception as e:
            print(f"[Detector] Error saving enrolled faces: {e}")

    def enroll_face_from_frame(self, frame):
        """Detect face in frame and add its embedding to enrolled templates."""
        with self.lock:
            h, w, _ = frame.shape
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(frame)

            if faces is None or len(faces) == 0:
                return False, "No face detected in camera frame. Please face the camera directly."

            # Pick the largest face (closest to camera)
            best_face = None
            max_area = 0
            for f in faces:
                area = f[2] * f[3]
                if area > max_area:
                    max_area = area
                    best_face = f

            aligned = self.recognizer.alignCrop(frame, best_face)
            feature = self.recognizer.feature(aligned) # shape (1, 128)

            self.enrolled_embeddings.append(feature)
            self.save_enrolled_faces()
            return True, f"Face template registered successfully! (Total templates: {len(self.enrolled_embeddings)})"

    def clear_enrolled_faces(self):
        self.enrolled_embeddings = []
        self.save_enrolled_faces()
        return True, "Enrolled faces cleared."

    def detect_and_recognize(self, frame, threshold=0.363):
        """
        Process frame.
        Returns:
            list of dicts: [
                {
                    "box": [x, y, w, h],
                    "landmarks": [(x, y), ...],
                    "is_anderson": bool,
                    "similarity": float,
                    "confidence": float
                }, ...
            ]
        """
        with self.lock:
            h, w, _ = frame.shape
            if (w, h) != self.input_size:
                self.detector.setInputSize((w, h))
                self.input_size = (w, h)

            _, faces = self.detector.detect(frame)
            results = []

            if faces is None or len(faces) == 0:
                return results

            has_templates = len(self.enrolled_embeddings) > 0

            for face in faces:
                x, y, bw, bh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                score = float(face[14])

                # 5 landmarks: right eye, left eye, nose tip, right mouth corner, left mouth corner
                landmarks = [
                    (int(face[4]), int(face[5])),
                    (int(face[6]), int(face[7])),
                    (int(face[8]), int(face[9])),
                    (int(face[10]), int(face[11])),
                    (int(face[12]), int(face[13]))
                ]

                aligned = self.recognizer.alignCrop(frame, face)
                feat = self.recognizer.feature(aligned)

                max_sim = -1.0
                is_anderson = False

                if has_templates:
                    for enrolled in self.enrolled_embeddings:
                        sim = float(self.recognizer.match(feat, enrolled, cv2.FaceRecognizerSF_FR_COSINE))
                        if sim > max_sim:
                            max_sim = sim
                    if max_sim >= threshold:
                        is_anderson = True
                else:
                    # If no faces enrolled yet, mark as un-enrolled / pending
                    max_sim = 0.0
                    is_anderson = False

                live_score, is_organic, live_details = self.liveness.analyze(frame, [x, y, bw, bh], landmarks)

                results.append({
                    "box": [x, y, bw, bh],
                    "landmarks": landmarks,
                    "is_anderson": is_anderson,
                    "has_templates": has_templates,
                    "similarity": max(0.0, max_sim),
                    "confidence": score,
                    "liveness": live_score,
                    "is_organic": is_organic,
                    "liveness_details": live_details
                })

            return results

    def draw_hud(self, frame, results, armed=True, vision_mode="normal"):
        """Draw cyberpunk matrix HUD overlay on frame with optional Thermal FLIR / Predator Night Vision."""
        h, w, _ = frame.shape
        if vision_mode == "thermal":
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            annotated = cv2.applyColorMap(enhanced, cv2.COLORMAP_INFERNO)
            cv2.putText(annotated, "FLIR THERMAL SENSOR // 14-BIT PSEUDOCOLOR", (w - 330, h - 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 240, 255), 1, cv2.LINE_AA)
        elif vision_mode == "predator":
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            annotated = np.zeros_like(frame)
            annotated[:, :, 1] = enhanced
            annotated[:, :, 0] = (enhanced * 0.25).astype(np.uint8)
            cv2.putText(annotated, "PREDATOR PHOSPHOR // NIGHT PASSIVE OPTICS", (w - 340, h - 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 120), 1, cv2.LINE_AA)
        else:
            annotated = frame.copy()

        # Corner HUD brackets on full frame
        cv2.line(annotated, (20, 20), (50, 20), (0, 255, 120), 2)
        cv2.line(annotated, (20, 20), (20, 50), (0, 255, 120), 2)
        cv2.line(annotated, (w - 20, 20), (w - 50, 20), (0, 255, 120), 2)
        cv2.line(annotated, (w - 20, 20), (w - 20, 50), (0, 255, 120), 2)
        cv2.line(annotated, (20, h - 20), (50, h - 20), (0, 255, 120), 2)
        cv2.line(annotated, (20, h - 20), (20, h - 50), (0, 255, 120), 2)
        cv2.line(annotated, (w - 20, h - 20), (w - 50, h - 20), (0, 255, 120), 2)
        cv2.line(annotated, (w - 20, h - 20), (w - 20, h - 50), (0, 255, 120), 2)

        has_anderson = any(r["is_anderson"] for r in results)
        has_stranger = any(r["has_templates"] and not r["is_anderson"] for r in results)

        # Determine DEFCON Threat Level
        if not armed:
            defcon_lvl = 5
            defcon_text = "DEFCON 5 // STANDBY"
            defcon_color = (150, 150, 150)
        elif not results:
            defcon_lvl = 5
            defcon_text = "DEFCON 5 // PERIMETER CLEAR"
            defcon_color = (0, 255, 120)
        elif has_anderson and has_stranger:
            defcon_lvl = 2
            defcon_text = "DEFCON 2 // SHOULDER SURF"
            defcon_color = (0, 140, 255)
        elif has_anderson:
            defcon_lvl = 4
            defcon_text = "DEFCON 4 // OPERATOR VERIFIED"
            defcon_color = (0, 255, 100)
        else:
            defcon_lvl = 1
            defcon_text = "DEFCON 1 // BREACH IN PROGRESS"
            defcon_color = (0, 0, 255)

        # Header Status Banner + DEFCON Badge (clean stacked rows to prevent collision on 640px frames)
        status_text = "ARMED // ACTIVE SECURITY" if armed else "DISARMED // STANDBY"
        status_color = (0, 255, 100) if armed else (180, 180, 180)
        header_line = f"ANDERSON SENTINEL // {status_text}"
        (hdr_w, hdr_h), _ = cv2.getTextSize(header_line, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 2)
        (def_w, def_h), _ = cv2.getTextSize(defcon_text, cv2.FONT_HERSHEY_SIMPLEX, 0.46, 2)

        cv2.rectangle(annotated, (24, 22), (min(w - 24, 24 + max(hdr_w, def_w) + 18), 66), (8, 12, 16), -1)
        cv2.putText(annotated, header_line, (30, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, status_color, 2, cv2.LINE_AA)
        cv2.putText(annotated, defcon_text, (30, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.46, defcon_color, 2, cv2.LINE_AA)

        for res in results:
            x, y, bw, bh = res["box"]
            is_anderson = res["is_anderson"]
            has_templates = res["has_templates"]
            sim = res["similarity"]
            liveness = res.get("liveness", 0.95)
            is_organic = res.get("is_organic", True)

            if not has_templates:
                color = (0, 200, 255) # Yellow/Orange: Needs enrollment
                label = "UNREGISTERED (ENROLLMENT NEEDED)"
            elif is_anderson:
                color = (0, 255, 100) # Neon Green: Mr. Anderson Authorized
                label = f"MR. ANDERSON [AUTHORIZED {int(sim*100)}%]"
            elif has_anderson:
                color = (0, 140, 255) # Warning Amber: Shoulder Surfer
                label = f"PEEPING TOM // SHOULDER SURFER [{int(sim*100)}%]"
            else:
                color = (0, 0, 255) # Bright Red: Intruder Alert
                label = f"UNKNOWN TARGET [BREACH {int(sim*100)}%]"

            # Draw rounded/bracket bounding box
            bracket_len = min(25, bw // 3, bh // 3)
            # Top-left
            cv2.line(annotated, (x, y), (x + bracket_len, y), color, 3)
            cv2.line(annotated, (x, y), (x, y + bracket_len), color, 3)
            # Top-right
            cv2.line(annotated, (x + bw, y), (x + bw - bracket_len, y), color, 3)
            cv2.line(annotated, (x + bw, y), (x + bw, y + bracket_len), color, 3)
            # Bottom-left
            cv2.line(annotated, (x, y + bh), (x + bracket_len, y + bh), color, 3)
            cv2.line(annotated, (x, y + bh), (x, y + bh - bracket_len), color, 3)
            # Bottom-right
            cv2.line(annotated, (x + bw, y + bh), (x + bw - bracket_len, y + bh), color, 3)
            cv2.line(annotated, (x + bw, y + bh), (x + bw, y + bh - bracket_len), color, 3)

            # Draw thin inner box
            cv2.rectangle(annotated, (x, y), (x + bw, y + bh), color, 1)

            # Draw Biometric Facial Landmarks
            for pt in res["landmarks"]:
                cv2.circle(annotated, pt, 2, (0, 255, 255), -1)

            # Draw Cyber Label with background badge
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            lbl_y = max(y - 10, th + 10)
            cv2.rectangle(annotated, (x, lbl_y - th - 6), (x + tw + 10, lbl_y + 4), (10, 10, 15), -1)
            cv2.rectangle(annotated, (x, lbl_y - th - 6), (x + tw + 10, lbl_y + 4), color, 1)
            cv2.putText(annotated, label, (x + 5, lbl_y - 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)

            # Draw Liveness Metric sub-badge
            live_txt = f"LIVENESS {int(liveness*100)}% [{'ORGANIC' if is_organic else 'SPOOF?'}]"
            live_col = (0, 229, 255) if is_organic else (255, 0, 255)
            cv2.putText(annotated, live_txt, (x + 2, y + bh + 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, live_col, 1, cv2.LINE_AA)

        return annotated
