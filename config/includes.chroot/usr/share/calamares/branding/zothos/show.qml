/*
 *  ZOTHOS 3.0 — Sovereign Alchemical Intelligence Slideshow
 *  Calamares Slideshow QML Presentation
 */

import QtQuick 2.15
import QtQuick.Layouts 1.2
import calamares.slideshow 1.0

Presentation {
    id: presentation

    Timer {
        interval: 12000
        repeat: true
        running: true
        onTriggered: presentation.goToNextSlide()
    }

    // Helper Slide Component
    Component {
        id: slideTemplate
        Item {
            anchors.fill: parent
        }
    }

    // SLIDE 1: SOVEREIGN AI LINUX
    Slide {
        Rectangle {
            anchors.fill: parent
            color: "#080c14"

            Column {
                anchors.centerIn: parent
                spacing: 16
                width: Math.min(parent.width - 60, 680)

                Row {
                    spacing: 16
                    anchors.horizontalCenter: parent.horizontalCenter

                    Image {
                        source: "zothos-logo.png"
                        width: 72
                        height: 72
                        fillMode: Image.PreserveAspectFit
                        smooth: true
                        mipmap: true
                    }

                    Column {
                        spacing: 4
                        Text {
                            text: "✦ ZOTHOS 3.0 — SOVEREIGN AI LINUX ✦"
                            font.family: "JetBrains Mono, Inter, sans-serif"
                            font.pixelSize: 22
                            font.bold: true
                            color: "#ffd700"
                        }
                        Text {
                            text: "The Autonomous Agent Operating System for the Post-Cloud Era"
                            font.family: "Inter, sans-serif"
                            font.pixelSize: 13
                            color: "#94a3b8"
                        }
                    }
                }

                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#d4af37"
                    opacity: 0.4
                }

                Column {
                    spacing: 10
                    width: parent.width

                    Row {
                        spacing: 12
                        Text { text: "🜂"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Autonomous Coding Agents:</b> Hermes, OpenCode, Codex, Aider & Claude Code pre-configured."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "🜄"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>24K Alchemical Gold Plasma 6:</b> Dark luxury UI, custom insignia icons, and high-DPI scaling."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "🜁"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Air-Gapped & Hermetic:</b> Zero external telemetry, local model execution, and full privacy."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                }
            }
        }
    }

    // SLIDE 2: SOVEREIGN CRYPTOGRAPHIC VAULT
    Slide {
        Rectangle {
            anchors.fill: parent
            color: "#080c14"

            Column {
                anchors.centerIn: parent
                spacing: 16
                width: Math.min(parent.width - 60, 680)

                Row {
                    spacing: 16
                    anchors.horizontalCenter: parent.horizontalCenter

                    Rectangle {
                        width: 72; height: 72; radius: 36
                        color: "#0f172a"
                        border.color: "#ffd700"
                        border.width: 2
                        Text {
                            anchors.centerIn: parent
                            text: "🔐"
                            font.pixelSize: 36
                        }
                    }

                    Column {
                        spacing: 4
                        Text {
                            text: "✦ SOVEREIGN CRYPTOGRAPHIC VAULT ✦"
                            font.family: "JetBrains Mono, Inter, sans-serif"
                            font.pixelSize: 22
                            font.bold: true
                            color: "#ffd700"
                        }
                        Text {
                            text: "Argon2id + ChaCha20-Poly1305 Hardware-Isolated Secret Engine"
                            font.family: "Inter, sans-serif"
                            font.pixelSize: 13
                            color: "#94a3b8"
                        }
                    }
                }

                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#d4af37"
                    opacity: 0.4
                }

                Column {
                    spacing: 10
                    width: parent.width

                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Process Secret Injection:</b> Launch apps with ephemeral env keys in-memory via <code>zoth-vault run</code>."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Zero Plain-Text on Disk:</b> Sensitive keys are never written to disk or bash history."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Multi-Vault Orchestration:</b> Built-in sync with Bitwarden CLI, KeePassXC, and UNIX Pass."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                }
            }
        }
    }

    // SLIDE 3: GHOSTMODE & OFFENSIVE CYBER PLATFORM
    Slide {
        Rectangle {
            anchors.fill: parent
            color: "#080c14"

            Column {
                anchors.centerIn: parent
                spacing: 16
                width: Math.min(parent.width - 60, 680)

                Row {
                    spacing: 16
                    anchors.horizontalCenter: parent.horizontalCenter

                    Rectangle {
                        width: 72; height: 72; radius: 36
                        color: "#0f172a"
                        border.color: "#ffd700"
                        border.width: 2
                        Text {
                            anchors.centerIn: parent
                            text: "🛡️"
                            font.pixelSize: 36
                        }
                    }

                    Column {
                        spacing: 4
                        Text {
                            text: "✦ GHOSTMODE CYBER DEFENSE & AUDIT ✦"
                            font.family: "JetBrains Mono, Inter, sans-serif"
                            font.pixelSize: 22
                            font.bold: true
                            color: "#ffd700"
                        }
                        Text {
                            text: "Elite Security Operations & Autonomous Penetration Testing"
                            font.family: "Inter, sans-serif"
                            font.pixelSize: 13
                            color: "#94a3b8"
                        }
                    }
                }

                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#d4af37"
                    opacity: 0.4
                }

                Column {
                    spacing: 10
                    width: parent.width

                    Row {
                        spacing: 12
                        Text { text: "🜃"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Transparent Tor Routing:</b> One-click Ghostmode routes all TCP/DNS traffic through Tor."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "🜃"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>HexStrike AI:</b> Autonomous cyber red-team orchestrator with 120+ specialized security tools."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "🜃"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Pre-Installed Weaponry:</b> Burp Suite, Metasploit, Nmap, Wireshark, Ghidra, and John the Ripper."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                }
            }
        }
    }

    // SLIDE 4: WORKSPACES & LOCAL LLMS
    Slide {
        Rectangle {
            anchors.fill: parent
            color: "#080c14"

            Column {
                anchors.centerIn: parent
                spacing: 16
                width: Math.min(parent.width - 60, 680)

                Row {
                    spacing: 16
                    anchors.horizontalCenter: parent.horizontalCenter

                    Rectangle {
                        width: 72; height: 72; radius: 36
                        color: "#0f172a"
                        border.color: "#ffd700"
                        border.width: 2
                        Text {
                            anchors.centerIn: parent
                            text: "⚡"
                            font.pixelSize: 36
                        }
                    }

                    Column {
                        spacing: 4
                        Text {
                            text: "✦ LOCAL LLM INFERENCE & WEB3 ✦"
                            font.family: "JetBrains Mono, Inter, sans-serif"
                            font.pixelSize: 22
                            font.bold: true
                            color: "#ffd700"
                        }
                        Text {
                            text: "High-Throughput Local Model Execution & Smart Contract Studio"
                            font.family: "Inter, sans-serif"
                            font.pixelSize: 13
                            color: "#94a3b8"
                        }
                    }
                }

                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#d4af37"
                    opacity: 0.4
                }

                Column {
                    spacing: 10
                    width: parent.width

                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Hardware Acceleration:</b> Ready for local GGUF models via llama.cpp, vLLM, and Ollama."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Solana & Web3 Toolchains:</b> Pre-configured Solana CLI, Anchor framework, and Foundry."
                            font.pixelSize: 13; color: "#e2e8f0"; font.family: "Inter, sans-serif"
                        }
                    }
                    Row {
                        spacing: 12
                        Text { text: "✦"; font.pixelSize: 14; color: "#ffd700" }
                        Text {
                            text: "<b>Installation in Progress:</b> Unpacking system packages and finalizing boot configuration..."
                            font.pixelSize: 13; color: "#ffd700"; font.family: "Inter, sans-serif"
                        }
                    }
                }
            }
        }
    }
}
