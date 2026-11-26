# Anderson Sentinel Makefile
PYTHON ?= /opt/zothos-ai-env/bin/python3
PORT ?= 7890

.PHONY: help start stop status run headless enroll test-voice lockdown desktop screenshots service-install clean

help:
	@echo "Anderson Sentinel Build & Control Directives"
	@echo "--------------------------------------------"
	@echo "  make start            - Launch background sentinel daemon"
	@echo "  make stop             - Terminate background sentinel daemon"
	@echo "  make status           - Display status and telemetry"
	@echo "  make run              - Run in foreground (debug mode)"
	@echo "  make headless         - Run headless security daemon without web UI"
	@echo "  make enroll           - Capture current face from webcam"
	@echo "  make test-voice       - Test both vocal responses"
	@echo "  make lockdown         - Trigger emergency lock-screen"
	@echo "  make desktop          - Launch native Electron workstation"
	@echo "  make screenshots      - Re-generate high-DPI retina screenshots"
	@echo "  make service-install  - Install systemd user service"
	@echo "  make clean            - Remove cache and temporary logs"

start:
	./bin/anderson-sentinel start

stop:
	./bin/anderson-sentinel stop

status:
	./bin/anderson-sentinel status

run:
	$(PYTHON) run.py --port $(PORT)

headless:
	$(PYTHON) run.py --headless

enroll:
	./bin/anderson-sentinel enroll

test-voice:
	./bin/anderson-sentinel test-voice

lockdown:
	./bin/anderson-sentinel lockdown

desktop:
	electron electron/main.cjs

screenshots:
	$(PYTHON) scripts/generate_screenshots.py

service-install:
	./service/install_service.sh

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
