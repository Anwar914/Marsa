"""Marsa (مرسى): Technical English & 3D car anatomy.

One unified web app (AutoAnatomy3D.html, built from app-source/) contains everything:
3D car anatomy, the Technical English course (Course tab), B1/B2 grammar, quizzes and a shared
progress page. Streamlit only hosts it full-width.
"""
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent
APP = ROOT / "AutoAnatomy3D.html"

st.set_page_config(
    page_title="Marsa (مرسى) · Technical English & 3D Car Anatomy",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Give the app the whole page: hide Streamlit's header/footer and most padding.
st.markdown(
    """
    <style>
      header[data-testid="stHeader"], footer, #MainMenu {display: none !important;}
      .block-container {padding: 0.4rem 0.6rem 0 0.6rem !important; max-width: 100% !important;}
      iframe {border: 0; border-radius: 10px;}
    </style>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.markdown("### Marsa · مرسى")
    height = st.slider("App height (px)", 640, 1600, 940, 20, help="Choose a height that fits your screen.")
    st.markdown(
        "- **Explore / Learn / Quiz:** 3D car anatomy\n"
        "- **Course:** Technical English, B1 & B2 grammar, practice exams\n"
        "- **Progress:** everything in one overview"
    )
    st.caption("Progress is saved in this browser. Best in Chrome or Edge.")
    st.markdown("[Source on GitHub](https://github.com/Anwar914/Marsa)")

st.iframe(APP, height=height)
