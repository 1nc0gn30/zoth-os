import cv2
import time
import threading


class CameraStream:
    def __init__(self, camera_index=0, width=640, height=480, fps=30):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.fps = fps

        self.cap = None
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        self._stop_event = threading.Event()

        self.current_frame = None
        self.last_frame_time = 0
        self.fps_actual = 0

    def start(self):
        if self.running:
            return
        self.running = True
        self._stop_event.clear()
        if self.camera_index is not None and int(self.camera_index) < 0:
            print("[CameraStream] Standby mode (camera_index < 0; hardware capture disabled).")
            return
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print(f"[CameraStream] Started capture thread on device index {self.camera_index}")

    def stop(self):
        self.running = False
        self._stop_event.set()
        if self.thread:
            self.thread.join(timeout=1.5)
            self.thread = None
        if self.cap:
            self.cap.release()
            self.cap = None
        print("[CameraStream] Stopped capture.")

    def _open_camera(self):
        if self.camera_index is None or int(self.camera_index) < 0:
            return False
        if self.cap:
            self.cap.release()
            self.cap = None
        self.cap = cv2.VideoCapture(int(self.camera_index), cv2.CAP_V4L2)
        if not self.cap.isOpened():
            self.cap.release()
            self.cap = cv2.VideoCapture(int(self.camera_index))

        if self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.cap.set(cv2.CAP_PROP_FPS, self.fps)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # minimize latency
            return True
        self.cap.release()
        self.cap = None
        return False

    def _capture_loop(self):
        retry_backoff = 1.0
        max_backoff = 30.0
        logged_missing = False

        while self.running:
            if self.cap is None or not self.cap.isOpened():
                if not self._open_camera():
                    if not logged_missing:
                        print(f"[CameraStream] Camera index {self.camera_index} unavailable; entering exponential backoff standby (1s -> 30s).")
                        logged_missing = True
                    self._stop_event.wait(retry_backoff)
                    retry_backoff = min(max_backoff, retry_backoff * 2.0)
                    continue
                retry_backoff = 1.0
                logged_missing = False

            ret, frame = self.cap.read()
            if not ret or frame is None:
                self._stop_event.wait(0.05)
                continue

            now = time.time()
            dt = now - self.last_frame_time
            if dt > 0:
                self.fps_actual = 0.9 * self.fps_actual + 0.1 * (1.0 / dt)
            self.last_frame_time = now

            with self.lock:
                self.current_frame = frame

            self._stop_event.wait(0.005)  # tiny yield to prevent CPU hogging

        if self.cap:
            self.cap.release()
            self.cap = None

    def get_frame(self):
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None

    def is_active(self):
        return self.running and (self.current_frame is not None)
