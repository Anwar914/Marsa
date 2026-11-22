"""Marsa (مرسى): Technical English learning."""
from pathlib import Path
import streamlit as st

st.set_page_config(page_title="Marsa (مرسى) · Technical English", layout="wide")
st.iframe(Path(__file__).parent / "Marsa.html", height=1000, tab_index=0)
