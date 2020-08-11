# HW3

## 01. 環境準備

### 安裝 Node.js 8.x

檢查環境, 如果是 v8 就跳過安裝, 到步驟二

```
$ node -v
v8.16.2
```

安裝 [https://nodejs.org/dist/latest-v8.x/](https://nodejs.org/dist/latest-v8.x/)

### On Mac OSX or Linux 

如果環境在 Mac 或 Linux 可用 nvm 安裝

- Install nvm [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

```
$ nvm install v8
$ nvm use v8
```

## 02. 作業模板

- 下載 [hw3 檔案](https://drive.google.com/open?id=1akGmYM_4RbfAxbJX5_7Cpkj13U4-l84I)

解壓縮後, 進到

```
$ cd HW3-template
$ npm install
$ npm run devstart
```

運行成功的畫面

![](https://cl.ly/230dff6f971d/Image%2525202019-12-03%252520at%25252011.17.25%252520PM.png)

## 03. 啟動 ganache-cli

```
$ ganache-cli --blockTime 5
```

加入區塊時間, 是為了方便觀察交易變化

## 04. 進到網頁

- [http://localhost:3000/](http://localhost:3000/)

類似如下畫面

![](https://cl.ly/d49ab1f90e61/Image%2525202019-12-03%252520at%25252011.19.36%252520PM.png)

## 05. 完成功能

- public/index.html (前端頁面)
- routes/index.js (路由請求)
- public/javascripts/index.js (後端處理)


1. 完成 Coin 餘額取得與顯示
2. 完成以下功能(輸入欄位 / http request)
	- 取得 Owner  (request method: GET)
	- 轉移 Owner  (request method: POST)
	- 鑄幣 Coin   (request method: POST)
	- 購買 Coin   (request method: POST)
	- 轉移 Coin   (request method: POST)



## Express 相關知識

Express 是一套 node.js 的框架，具有前端與後端的功能，此外，它具備了 [express-generator](https://expressjs.com/zh-tw/starter/generator.html) 的功能，可以快速用來產生程式架構

網站中[入門](https://expressjs.com/zh-tw/starter/installing.html)的文件，適合快速學習與實戰，進階可閱讀 [MDN 上的教學](https://developer.mozilla.org/zh-TW/docs/Learn/Server-side/Express_Nodejs/skeleton_website)


```
/sample
    app.js
    /bin
        www
    package.json
    /node_modules
        [about 4,500 subdirectories and files]
    /public
        /images
        /javascripts
        /stylesheets
            style.css
    /routes
        index.js
        users.js
    /views
        error.pug
        index.pug
        layout.pug
```

- `app.js`: 應用程式
- `/bin/www`: 是程式檔入口
- `package.json`: 定義套件的相依關係
- `/node_modules`: 套件安裝後的檔案
- `/public`: 網頁靜態檔案
- `/routes`: 路由
- `/views`: 視圖 (模板)
