"""Marsa (مرسى): Technical English learning."""
from pathlib import Path
import streamlit as st

st.set_page_config(page_title="Marsa (مرسى) · Technical English", layout="wide")
section = st.segmented_control(
    "Marsa learning sections",
    ["Learning workspace", "3D car anatomy"],
    default="Learning workspace",
)
page = "AutoAnatomy3D.html" if section == "3D car anatomy" else "Marsa.html"
st.iframe(Path(__file__).parent / page, height=1000, tab_index=0)
