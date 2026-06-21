[![(My App Railway)](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)](https://face-verification-v1-gavin.up.railway.app/)

The verification of faces program, which it detecting the percentage of similarity on the 2 faces who'm these faces are different/same.

The requirements that I need to make this program is:
- ArcFace (Produce by InsightFace) <-- this is a datasets that I really like, because it doesn't take long to install.
- OpenCV
- FastAPI (for integrating frontend templates/Routing Backend)
- onnx
- HTML, CSS, JS (Frontend)
- Jinja 2 (Renderer)

You can fork or cloning this repo if you want to developing it, it's no problem.

How to Install and Running Project?

First, clone this repository to your folder (run in terminal on your VSCode):

```bash
git clone https://github.com/GavinArdhijaya91/Face-Verification-v1
cd your-repository
```

Second, Create the Virtual Environment and activate it to prevent library conflicts with your system:

* if you use Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

* if you use Mac/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Third, Install the dependencies (all required libraries):

```bash
pip install -r requirments.txt
```

Fourth, run the FastAPI server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

Fifth, click the generated link from uvicorn (example: `http://127.0.0.1:8000`) to open the app.


### THE END

