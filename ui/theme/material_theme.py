MATERIAL_THEME = {
    "primaryColor": "#6200EE",
    "backgroundColor": "#FAFAFA",
    "secondaryBackgroundColor": "#EDE7F6",
    "textColor": "#212121",
    "font": "Roboto",
    "borderRadius": 10,
    "spacing": 10
}

MATERIAL_CSS = """
<style>
body {
  font-family: 'Roboto', sans-serif;
}

h1, h2, h3 {
  color: #6200EE;
}

.stButton > button {
  background-color: #6200EE;
  color: white;
  border-radius: 10px;
  padding: 0.6em 1.2em;
  transition: all 0.2s;
}

.stButton > button:hover {
  background-color: #3700B3;
}

code {
  background: #f3f3f3;
  padding: 0.2em 0.4em;
  border-radius: 5px;
  font-size: 90%;
}
</style>
"""

def apply_material_theme():
    import streamlit as st
    st.markdown(MATERIAL_CSS, unsafe_allow_html=True)
