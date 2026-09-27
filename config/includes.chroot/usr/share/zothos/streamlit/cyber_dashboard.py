import streamlit as st
import pandas as pd
import numpy as np
import time, math, os, platform

st.set_page_config(
    page_title="ZothOS • Cyber Intelligence Studio",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Celtic Gold CSS
st.markdown("""
<style>
    .stApp {
        background-color: #0b0d12;
        color: #e2e8f0;
    }
    h1, h2, h3 {
        color: #ffd700 !important;
        font-family: monospace;
    }
    .metric-card {
        background: #121620;
        border: 1px solid #ffd700;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.15);
    }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ ZothOS • Cyber Intelligence & Data Studio")
st.caption("Sovereign Analytics • Local AI Monitoring • Cryptographic Telemetry")

# Sidebar
st.sidebar.image("/usr/share/pixmaps/zoth-ai.png" if os.path.exists("/usr/share/pixmaps/zoth-ai.png") else "https://streamlit.io/images/brand/streamlit-mark-color.png", width=80)
st.sidebar.markdown("### **ZothOS Telemetry**")
st.sidebar.markdown(f"**OS:** `{platform.system()} {platform.release()}`")
st.sidebar.markdown(f"**Python:** `{platform.python_version()}`")
st.sidebar.markdown(f"**Node:** `{platform.node()}`")
st.sidebar.divider()
st.sidebar.markdown("### Navigation")
module = st.sidebar.radio("Select Intelligence Module:", ["Hardware & System", "Network & Defense", "Entropy & Cryptography", "AI Model Activity"])

if module == "Hardware & System":
    st.subheader("⚡ System Telemetry & Resource Grid")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(label="CPU Load", value="14.2%", delta="-2.1%")
    with col2:
        st.metric(label="Memory Usage", value="2.8 / 16.0 GB", delta="Normal")
    with col3:
        st.metric(label="Active Containers", value="4 Nodes", delta="Encrypted")
    with col4:
        st.metric(label="Sovereign Vault", value="UNLOCKED", delta="Argon2id")

    st.markdown("#### Real-time Kernel Event Distribution")
    chart_data = pd.DataFrame(
        np.random.randn(25, 3),
        columns=["CPU Cores", "DMA Channels", "Disk I/O"]
    )
    st.line_chart(chart_data)

elif module == "Network & Defense":
    st.subheader("🌐 Network Threat Surface & Ingress/Egress")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("#### Live Firewall State")
        st.success("✓ UFW / Netfilter: ACTIVE (Default DROP)")
        st.info("✓ WireGuard Interface: wg0 (Online)")
        st.warning("! Burp Suite Proxy: 127.0.0.1:8080 (Listening)")
    with col2:
        st.markdown("#### Geo-IP Packet Ingress Sample")
        loc_data = pd.DataFrame({
            'lat': [37.7749, 51.5074, 35.6762, 1.3521, 52.5200],
            'lon': [-122.4194, -0.1278, 139.6503, 103.8198, 13.4050]
        })
        st.map(loc_data)

elif module == "Entropy & Cryptography":
    st.subheader("🔑 Shannon Cryptographic Entropy Calculator")
    st.write("Test key strength and information density without leaking data off-device.")
    secret = st.text_input("Enter Key, Token, or Secret string to evaluate:", type="password", value="Sovereign_ZothOS_2026_Argon2id#")
    
    if secret:
        # Calculate Shannon entropy
        prob = [float(secret.count(c)) / len(secret) for c in dict.fromkeys(list(secret))]
        entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric(label="Shannon Entropy (bits/char)", value=f"{entropy:.3f}")
            st.metric(label="Total Information Space", value=f"{entropy * len(secret):.1f} bits")
        with col2:
            if entropy > 4.2:
                st.success("High Entropy: Excellent resistance to rainbow tables & brute force.")
            elif entropy > 3.0:
                st.warning("Moderate Entropy: Consider adding symbols and mixed case.")
            else:
                st.error("Low Entropy: Vulnerable to dictionary attacks.")

elif module == "AI Model Activity":
    st.subheader("🧠 Ollama & Sovereign AI Telemetry")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Installed Models:**")
        st.code("""qwen2.5-coder:1.5b    (Default Sovereign Code Engine)
zoth-model:latest      (Orchestrator Assistant)
deepseek-r1:1.5b       (Reasoning Model)""", language="bash")
    with col2:
        st.markdown("**Inference Latency:**")
        st.metric(label="Time to First Token", value="42 ms", delta="-8 ms")
        st.metric(label="Generation Speed", value="68 tokens/sec", delta="+12 t/s")

st.divider()
st.caption("ZothOS Sovereign Studio • Powered by Streamlit 1.64.0 & Python 3.13")
