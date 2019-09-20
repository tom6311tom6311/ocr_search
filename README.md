# OCR Search
A node application for extracting text from documents and images using OCR and providing text-based search API

## How to Install
1. Install `Node.js` v10.16.3 and `npm` v6.9.0 (or later)
2. Install `libreoffice` command line tool (the `soffice` command)
3. Install `graphicsmagick` and `ghostscript`
4. > sudo npm i -g forever
5. > git clone git@github.com:tom6311tom6311/ocr_search.git
6. > cd ocr_search
7. > npm i

## How to Run
The procedure goes as follows:
1. Under root directory, create a folder named `data/`.
2. Under `data/`, create 2 folders, `ppt/` and `pdf/`.
3. Drop the PowerPoint files and PDF files into `data/ppt/` and `data/pdf/`, respectively.
4. To convert ppt to pdf:
    - > npm run ppt2pdf
5. To convert pdf to png:
    - > npm run pdf2png
6. To extract text from png files:
    - > npm run ocr
    - Be patient throughout whole procedure. The OCR result will be saved in `data/ocr_result.json`
7. Once the OCR procedure finishes, run an API server by following terminal command:
    - > npm start
    - By default, the API server will be hosted on port ***7055***. This configuration can be changed by modifying `config/AppConfig.const.js`
8. To run the API server in background permanently:
    - > forever start -c "node -r babel-register" src/runserver.script.js

## API Reference
- Search Pages
  - Path: `/pages`
  - Method: `GET`
  - URL Params:
    - Required
      - `searchTerm=<string>`
        - The search term inserted by user in order to find related pages
  - Body: None
  - Success Response:
    - Code: `200 OK`
    - Content:
      - `pageList: [{fileName:<string>, pageIdx:<string>, imgPath:<string>}, ...]`
        - A list of JSON objects indicating the matched slide pages, with correlation from high to low.
        - `imgPath` in each `pageList` item can be used to locate the snapshot of corresponding slide page in the `Get Page Image` API
  - Error Response:
    - Code: `400 Bad Request`
    - Content: `{ message: 'search term is not specified or is in wrong format'}`
  - Request Example:
    - > curl http://localhost:7055/pages?searchTerm='blabla'
- Get Page Image
  - Path: `/pageImg/<imgPath>`
  - Method: `GET`
  - URL Params: None
  - Body: None
  - Success Response:
    - Code: `200 OK`
    - Content:
      - The PNG image corresponding to the slide page
  - Error Response:
    - Code: `200 OK`
    - Content:
      -  A HTML page showing `Cannot GET <imgPath>`
  - Request Example:
    - Type `http://localhost:7055/pageImg/<imgPath>` in the browser
