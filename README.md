<h1 align="center">Letterset</h1>

<p align="center">
  <img src="https://hackatime.hackclub.com/api/v1/badge/U09B8FXUS78/Rexaintreal/letterset" alt="Hackatime Badge"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML"/>
  <img src="https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" alt="GitHub"/>
</p>

Letterset turns your handwriting in to a real font file. You draw each character in the browser or fill out a printed sheet, and the app converts your drawings into a .ttf file you can install on any computer.

## Live Link
The project is hosted at : https://letterset.pythonanywhere.com/

Feel free to test and suggest or contribute to this project :3

## What it does 
You draw 74 characters: uppercase letters, lowercase letters, numbers and common punctuation. THe app traces each drawing, converts it to vector outlines, and then packages everything into a TrueType font. the font works in Word, Photoshop, Canva and anywhere else where fonts can be installed using a .ttf file.

If you skip or miss some characters, you can either edit it or choose a fallabck font to fill in the gaps. Your drawn characters always take the priority. Also no session is being saved and its private! so no worries about data theft etc.

## Two ways to make your font

**Draw on screen.** Open the canvas, draw each character with your mouse or stylus and click Next. You can go back, clear, or skip any character. When you finish, the app builds the font automatically.

**Fill a printed sheet.** Download the template PDF, write your characters inside the boxes with a dark pen, then photograph the sheet and upload it. The app detects the page edges, crops each character box and extracts your glyphs. Or you could just use a virtual tool to fill the page.

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

Then Open http://localhost:5000 in your browser or 127.0.0.1:5000.

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
uploads/                  Session folders 
```

# How the font is built

Each drawn character is saved as a PNG, when you trigger a build, the app reads every PNG, converts it to a binary mask and finds the contours using OpenCV, then it aproxiamtes the outline into straight line segments, and maps the pixel coordinates into font units. FontTools then assembles those outlines into a proper TrueType font with correct metrics, a chracter map and all required tables.
If a fallback font is selected, missing characters are copied from the selected font name and inserted before the font is saved.


## Requirements 
Python 3.9 or later.

## License
MIT

## Author

Built by **Saurabh Tiwari**
- Email: [saurabhtiwari7986@gmail.com](mailto:saurabhtiwari7986@gmail.com)
- Portfolio: [Link](https://saurabhcodesawfully.pythonanywhere.com/)