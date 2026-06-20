<h1 align="center">Letterset</h1>

<p align="center">
  <img src="https://hackatime.hackclub.com/api/v1/badge/U09B8FXUS78/Rexaintreal/letterset" alt="Hackatime Badge"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white" alt="OpenCV"/>
  <img src="https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML"/>
  <img src="https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="MIT License"/>
</p>

Letterset turns your handwriting into a real `.ttf` font file. Draw each character in the browser or fill out a printed sheet, and the app converts your drawings into a font you can install on any computer.

## Live Link

The project is hosted at: https://letterset.pythonanywhere.com/

## What's new

- **Fully mobile responsive** as it works on phones and tablets with touch drawing support
- **Eraser Tool** added it fixes mistakes without clearing the whole canvas
- **Undo (Ctrl+Z)** can now step back through your strokes one at a time
- **Character jump grid** can click any character to jump directly to it
- **Click preview grid** click any drawn cahracter in the "So far" panel to redraw and edit it
- **Live completion ring** a circular progress indicator showing drawn vs skipped vs remaining
- **Completion Confetti** fires when your font builds succesfully on the preview page
- **Scroll Animation** Fade in animations for various pages
- **Hamburger Navbar** for mobile navigation in all pages :3

## Tech Stack

- **Backend:** Python, Flask
- **Image Processing:** OpenCV, NumPy
- **Font Generation:** FontTools
- **PDF Template:** ReportLab
- **Frontend:** HTML, CSS, JavaScript (Canvas API)

## What it does

You draw 74 characters: uppercase letters, lowercase letters, numbers and common punctuation. The app traces each drawing, converts it to vector outlines, and packages everything into a TrueType font. The font works in Word, Photoshop, Canva and anywhere else that supports .ttf files.

If you skip or miss some characters, you can edit them later or choose a fallback font to fill in the gaps. Your drawn characters always take priority. No session data is saved, so your drawings stay private.

## Two ways to make your font

**Draw on screen.** Open the canvas, draw each character with your mouse or stylus and click Next. You can go back, clear, or skip any character. When you finish, the app builds the font automatically.

**Fill a printed sheet.** Download the template PDF, write your characters inside the boxes with a dark pen, then photograph the sheet and upload it. The app detects the page edges, crops each character box and extracts your glyphs.

## Running it locally

Install the dependencies:

```
pip install flask fonttools opencv-python numpy reportlab
```

Generate the template PDF (only needed once):

```
python processing/template.py
```

Start the app:

```
python app.py
```

Then open http://localhost:5000 in your browser.

## Project structure

```
app.py                    Flask routes and request handling
processing/
    build_font.py         Converts glyph PNGs to a .ttf file using fontTools
    process_sheet.py      Detects and crops characters from a photographed sheet
    template.py           Generates the printable template PDF
static/
    css/styles.css        All styles
    js/script.js          Canvas drawing, upload handling and preview controls
    template.pdf          The printable character sheet
templates/
    index.html            Home page
    draw.html             Drawing interface
    upload.html           Sheet upload page
    map.html              Glyph review after upload
    preview.html          Font preview and download
    error.html            404 and 500 error pages
uploads/                  Temporary session folders
```

## How the font is built

Each drawn character is saved as a PNG. When you trigger a build, the app reads every PNG, converts it to a binary mask and finds the contours using OpenCV. It then approximates the outline into straight line segments and maps the pixel coordinates into font units. FontTools assembles those outlines into a TrueType font with correct metrics, a character map and all required tables. If a fallback font is selected, missing characters are copied from it before the font is saved.

## Contributing

Fork, branch, PR. For a bigger ideas open an issue first.

Areas that could use work
- More langauge and supports
- Better sheet detection under varied lighting conditions

## Requirements

Python 3.9 or later.

## License

MIT

## Author

Built by **Saurabh Tiwari**
- Email: [saurabhtiwari7986@gmail.com](mailto:saurabhtiwari7986@gmail.com)
- Portfolio: [Link](https://saurabhcodesawfully.pythonanywhere.com/)
