# Marsa (مرسى)

Interactive Technical English for mechanical engineers. Six modules, vocabulary and grammar practice, reading and writing, memory games, interactive process ordering and two 90-minute practice exams worth 60 points each.

The interface is in English. German terms remain in bilingual exercises. Practice exams are not a confirmed official format. Free writing uses sample answers and self-assessment.

## Run

```sh
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Open Marsa.html for offline learning, or index.html with the adjacent source assets. Learning progress is stored in the current browser; hosted and offline versions do not share progress automatically.

## Deploy

On Streamlit Community Cloud, select this repository, main, and streamlit_app.py. No API keys or other services are required.


## Live app

[Open Marsa](https://marsa-english.streamlit.app/)

Use the section switch at the top to open **3D car anatomy**, which includes the uploaded AutoAnatomy3D model, component exploration and quizzes. The learning workspace includes the original modules, memory activities and practice exams. Hosted navigation is handled within the embedded workspace.
