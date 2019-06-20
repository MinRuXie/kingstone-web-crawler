var express = require('express');
var request = require("request");
var fs = require('fs');
var app = express();
var content = fs.readFileSync('index.html');
var cheerio = require("cheerio");

//導入css資料夾裡的東西
app.use('/css', express.static('css'));
//導入img資料夾裡的東西
app.use('/img', express.static('img'));

// 使用 ejs 引擎
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

// localhost:3000/
app.get('/', function(req, res){
	sortData();

	res.render(__dirname + "/index.html", {result: result});
});

// 3000 port
app.listen(3000, function(){
	console.log("port 3000");
});

var result = []; //存放爬下來的資料
getDatas(10); //爬n頁

// 依價格排序資料(低到高)
function sortData(){
	result.sort(function(a, b){   
		return parseInt(a["price"]) > parseInt(b["price"]) ? 1 : parseInt(a["price"]) == parseInt(b["price"]) ? 0 : -1;   
	});
}

// 爬 n 頁資料(總數)
function getDatas(pages){ 
	for(var i=0;i<pages;i++){
		getData(i+1); //呼叫爬蟲方法
	}
}

// 爬第 n 頁的資料(單一頁數)
function getData(page){
	// 設定欲爬取之網頁
	request({
		url: "https://www.kingstone.com.tw/new/search/search?q=%E6%96%87%E5%85%B7&sort=pr_asc&dis=list&page="+page,
		method: "GET"
	}, function(e, r, b){
		if(e || !b) { return; }
		var $ = cheerio.load(b);
		
		// 抓取資料的關鍵: 定義架構 JQuery 選取標籤
		var titles = $("div.beta_display h3 a"); //商品名稱
		var photos = $("div.alpha_display a img"); //商品照片連結
		var links = $("div.beta_display h3 a"); //金石堂連結
		var price = $("div.buymixbox"); //價錢

		for(var i=0;i<titles.length;i++){
			// 判斷是否停售
			if($(price[i]).text().indexOf("停售")==-1 && $(price[i]).text().indexOf("絕版")==-1){ //-1代表沒有找到
				// 製作成 JSON 物件
				var obj = {};

				obj["title"] = $(titles[i]).text(); //商品名稱
				obj["title_2"] = $(titles[i]).text().replace(/\s+/g, ""); //去除空格

				obj["photo"] = $(photos[i]).attr("src"); //商品照片連結
				if($(photos[i]).attr("src").indexOf("restricted")!=-1){ //沒有照片
					obj["photo"] = "https://cdn.kingstone.com.tw/images/noimage.gif";
				}

				obj["link"] = "https://www.kingstone.com.tw"+$(titles[i]).attr("href"); //金石堂連結

				var temp = $(price[i]).text().replace(" 加入購物車", ""); //去除垃圾
				temp = temp.replace(" 立即代訂", ""); //去除垃圾
				temp = temp.replace(/\r\n|\n/g,""); //去除換行
				temp = temp.replace(/\s+/g, ""); //去除空格
				var temp_arr = temp.split("特價"); //以"特價"字串分割字串

				obj["discount"] = temp_arr[0].replace("折", ""); //打折數
				obj["price"] =  temp_arr[1].replace("元", "");; //價錢

				result.push(obj); //將物件塞入陣列中
			}
		}

		console.log(result);
	});
}