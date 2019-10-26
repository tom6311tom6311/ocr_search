# Intelligent Search System
A Node.js-based search system with following capabilities:
- Letting user search for documents by keywords among a large document set
- Automatic preprocessing and indexing of new documents
- Automatic and unsupervised keyword extraction
- Semantic matching between user query and index terms
- Adaptively improve the search results based on the collected user events and feedbacks

## How to Install
1. Install `Node.js` v10.16.3 and `npm` v6.9.0 (or later)
2. Install `Python` v3.7
3. Install python packages and `nltk >= 3.4.5` and `jieba >= 0.39`
4. Install `libreoffice` command line tool (the `soffice` command)
5. Install `graphicsmagick` and `ghostscript`
6. Install latest `MongoDB`
7. > sudo npm i -g forever
8. clone the project
9. change directory to the project
10. > npm i
11. > python3 src/py/download_nlp_data.py

## How to Run
The procedure goes as follows:
1. Create a Dropbox app [here](https://www.dropbox.com/developers/apps), generate an access token and paste it to the `DROPBOX.ACCESS_TOKEN` setting under `config/AppConfig.const.js`
2. Now there will be an app folder `Apps/<your_app_name>/` under your Dropbox root directory. In this folder, create 3 sub-folders, `pptx/`, `docx/` and `pdf/`.
3. Upload the PowerPoint files, Word files and PDF files to `pptx/`, `docx/` and `pdf/`, respectively.
4. Run the intelligent search system by following terminal command:
    - > npm start
5. Now the system will start to download files from your Dropbox app folder and process them. If there are new files needing to be considered or out-dated files needing to be changed or removed, just do it on the Dropbox app folder. The intelligent search system will periodically check for updates on the Dropbox app folder and keep in synchronized with it.
6. Now the API server is also started. By default, the API server will be hosted on port ***7055***. This configuration can be changed by modifying `config/AppConfig.const.js`
8. To run the system in background permanently, leave the current process by inserting `CTRL+C` and then type the following command:
    - > forever start -c "node -r babel-register" src/runserver.script.js

## API Reference
- Search Pages
  - Path: `/pages`
  - Method: `GET`
  - URL Params:
    - Required
      - `searchTerm=<string>`
        - The search term inserted by user in order to find related pages
    - Optional
      - `maxReturn=<positive integer>`
        - Maximum number of returned searching results
        - Default value: 20
  - Body: None
  - Success Response:
    - Code: `200 OK`
    - Content:
      - `pageList: [{fileName:<string>, pageIdx:<string>, imgPath:<string>}, ...]`
        - A list of JSON objects indicating the matched slide pages, with correlation from high to low.
        - `imgPath` in each `pageList` item can be used to locate the snapshot of corresponding slide page in the `Get Page Image` API
  - Error Response:
    - Code: `400 Bad Request`
    - Content:
      - `{ message: 'search term is not specified or is in wrong format'}`
      - `{"message":"maxReturn should be a positive integer"}`
  - Request Example:
    - > curl http://localhost:7055/pages?searchTerm='blabla'
    - > curl http://localhost:7055/pages?searchTerm='blabla'&maxReturn=10
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
