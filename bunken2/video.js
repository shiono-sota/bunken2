var url = `https://ecls.info.kindai.ac.jp`;   
//var url = `http://localhost:3000`;
  var player = videojs("video", {                                                                  
    autoplay: false,
    loop: false,
    controls: true,
    preload: "auto",
    fluid: true,
    playbackRates: [0.5, 1, 1.5, 2],
  });
 11 

var video = document.getElementById("video");

var curtime; //現在の時間
var howlong; //動画全体の長さ
var hlsPoint = []; //動画読み込み時にポイントが代入される
var Viewingorder = []; //視聴した順番にポイントが代入される
var remainsPoints = []; //現在残っているポイント
var percents = 0; //動画を視聴した％
var end = false; //動画が終了したらtrue
var title = document.title; //ページのタイトル
var Point = 0; //現在視聴しているポイント
var userAgent = window.navigator.userAgent.toLowerCase();
var userAgentOmit = "";


if (userAgent.indexOf("msie") != -1 || userAgent.indexOf("trident") != -1) {
  //IE向けの記述
  userAgentOmit += "IE,";
} else if (userAgent.indexOf("edge") != -1) {
  //旧Edge向けの記述
  userAgentOmit += "edge,";
} else if (userAgent.indexOf("chrome") != -1) {
  //Google Chrome向けの記述
  userAgentOmit += "chrome,";
} else if (userAgent.indexOf("safari") != -1) {
  //Safari向けの記述
  userAgentOmit += "safari,";
} else if (userAgent.indexOf("firefox") != -1) {
  //FireFox向けの記述
  userAgentOmit += "firefox,";
} else {
  //その他のブラウザ向けの記述
  userAgentOmit += "other,";
}
if (
  userAgent.indexOf("iPhone") > 0 ||
  (userAgent.indexOf("Android") > 0 && userAgent.indexOf("Mobile") > 0)
) {
  // スマートフォン向けの記述
  userAgentOmit += "Smartphone";
} else if (userAgent.indexOf("iPad") > 0 || userAgent.indexOf("Android") > 0) {
  // タブレット向けの記述
  userAgentOmit += "Tablet";
} else {
  // PC向けの記述
  userAgentOmit += "PC";
}

var data = {
  StudentNumber: "null",
  userAgent: "null",
  title: title,
  Action:"null",
  nowTime1: "null",
  Percents1: "null",
  Point1: "null"
  
};



var actionData  ={
  StudentNumber: "null",
  userAgent: "null",
  title: title,
  Action:"null",
  nowTime1: "null",
  Percents1: "null",
  Point1: "null"
 

}
setstudentNumber();



function setstudentNumber() {
  student = localStorage.getItem("hashNumber");
  data.StudentNumber = student;
  actionData.StudentNumber = student;
  setUserAgent();
}

function setUserAgent() {
  if (userAgentOmit != "") {
    data.userAgent = userAgentOmit;
    actionData.userAgent = userAgentOmit;
  }
}

function dateUpdate() {
  data.nowTime1 = new Date().toLocaleString({ timeZone: "Asia/Tokyo" });
  data.Percents1 = percents;
  data.Point1 = Point;
}

function actionDataUpdateAndSend(Action){//actionDataをアップデートしてビーコン作成しログ送信
  actionData.nowTime1 = new Date().toLocaleString({ timeZone: "Asia/Tokyo" });
  
  actionData.Action = Action;

  var dataForSend = JSON.stringify(actionData);
  console.log("actionData:" + dataForSend);

  createBecon(dataForSend)
}

function showPercents() {
  document.getElementById("percents").innerHTML = percents + "% 視聴しました.";
}

function calcPercents() {
  //%を計算する
  percents = 100 - remainsPoints.length;
}

var countForBatchTransmission = 1;
var BatchData = {};

function CreateBatchJSON() {
  Data2 = null; //nullの場合は送信しない
  if (countForBatchTransmission == 1) {
    BatchData = JSON.parse(JSON.stringify(data));
    countForBatchTransmission++;
  } else if (countForBatchTransmission < 5) {
    BatchData["nowTime" + countForBatchTransmission] = data.nowTime1;
    BatchData["Percents" + countForBatchTransmission] = data.Percents1;
    BatchData["Point" + countForBatchTransmission] = data.Point1;
    countForBatchTransmission++;
  } else {
    BatchData["nowTime" + countForBatchTransmission] = data.nowTime1;
    BatchData["Percents" + countForBatchTransmission] = data.Percents1;
    BatchData["Point" + countForBatchTransmission] = data.Point1;
    Data2 = BatchData;
    BatchData = {}; //BatchDataの初期化
    countForBatchTransmission = 1; //countForBatchTransmissionの初期化
  }
  return Data2;
}

player.on("play", function () {
  actionDataUpdateAndSend("play")//actionData.actionをplayにしてログ送信
});

video.addEventListener(
  "ratechange",
  function () {
    var rate = video.playbackRate;
    console.log("現在の倍速:" + rate);

    actionDataUpdateAndSend("ratechange")//actionData.actionをratechangeにしてログ送信
  },
  true
);

video.addEventListener(
  "volumechange",
  function () {
    

    if(actionData.Action != "volumechange"){
      actionDataUpdateAndSend("volumechange")//actionData.actionをvolumechangeにしてログ送信
    }
  },
  true
);

video.addEventListener(
  "ended",
  function () {
    end = true;
    calcPercents();
    BatchSendData = BatchData;

    var dataForSend = JSON.stringify(BatchSendData);
    if (dataForSend != "{}") {
      createBecon(dataForSend);
    }

    actionDataUpdateAndSend("end")//actionData.actionをendにしてログ送信
  },true);

player.on("timeupdate", function () {
  curtime = Math.floor(player.currentTime());

  if (remainsPoints.indexOf(curtime) >= 0) {
    x = remainsPoints.filter((item) => item != curtime);
    remainsPoints = x;
    calcPercents();
  }

  if (hlsPoint.indexOf(curtime) >= 0) {
    if (Viewingorder[Viewingorder.length - 1] != curtime) {
      //Viewingorderの最新が現在の時間でなければViewingorderを更新する.
      Viewingorder.push(curtime);
      Point = hlsPoint.indexOf(curtime);
      dateUpdate();

      if(actionData.Action != Math.floor(Point/10)*10){
        actionDataUpdateAndSend(Math.floor(Point/10)*10)
      }

      BatchSendData = CreateBatchJSON();

      if (BatchSendData != null) {
        var dataForSend = JSON.stringify(BatchSendData);
        createBecon(dataForSend);
      }
    }
  }
});

video.addEventListener(
  "loadeddata",
  function () {
    howlong = player.duration();
    console.log("動画の長さ" + Math.floor(howlong));
    
    for (x = 0; x <= 100; x++) {
      //ポイントになる時間を配列にpush
      hlsPoint.push(Math.floor((howlong / 100) * x));
    }
    remainsPoints = hlsPoint;
    console.log(hlsPoint);
    console.log(hlsPoint.length)

  },
  true
);

video.addEventListener(
  "pause",
  function () {
    BatchSendData = BatchData;

    var dataForSend = JSON.stringify(BatchSendData);
    //console.log(dataForSend);
    if (dataForSend != "{}") {
      createBecon(dataForSend);

      BatchData = {};
      countForBatchTransmission = 1;
    }

    actionDataUpdateAndSend("pause")//actionData.actionをpauseにしてログ送信
    
  },
  true
);

window.addEventListener(
  "beforeunload",
  function () {
    console.log("閉じる");
    // ウィンドウを閉じる時にメッセージを表示する.
    BatchSendData = BatchData;

    var dataForSend = JSON.stringify(BatchSendData);
    //console.log(dataForSend);
    if (dataForSend != "{}") {
      createBecon(dataForSend);
    }

    actionDataUpdateAndSend("Unload")//actionData.actionをunloadにしてログ送信
  },
  true
);


window.addEventListener( "load", 
   function () {
     checkLocalstrage();
     actionDataUpdateAndSend("Load")//actionData.actionをloadにしてログ送信
   },
   false
);
// window.addEventListener('load', (event) => {
//   console.log('ページが完全に読み込まれました');
// });
//data送信
function createBecon(dataForSend) {
  console.log(dataForSend)
  if (localStorage.getItem("confirm") == "true") {
    const id = document.createElement("img");
    var sendInfo = url + `/log.mov?j=${dataForSend}`;
    id.setAttribute("src", sendInfo);
    id.setAttribute("width", "0");
    id.setAttribute("height", "0");
    document.body.appendChild(id);
  }
}

function checkLocalstrage() {
  var number = localStorage.getItem("studentNumber"); // なかったらnullが返る
  switch (getConfirm()) {
    case null:
      confirmSend();
      location.reload();
      break;

    case "true":
      if (number == null) {
        //学籍番号が登録されていないときの処理
        form();
      } else {
        //学籍番号が登録されているときの処理
        confirmNum(number);
      }
      break;

    default:
      //ログ送信の同意が得られなかった時の処理
      if (
        localStorage.getItem("studentNumber") != null ||
        localStorage.getItem("studentNumber") != "null"
      ) {
        localStorage.setItem("studentNumber", null);
      }
      console.log("学籍番号は使用しません");
      break;
  }
}

function confirmNum(num) {
  var result = window.confirm("学籍番号 : " + num + "でよろしいですか？");
  //console.log(result);
  if (!result) {
    //学籍番号が誤って登録されていたときの処理
    form();
  } else {
  }
}

function form() {
  // 入力ダイアログを表示 ＋ 入力内容を user に代入
  var user = window.prompt(
    "学籍番号は10桁で入力してください。\n(学籍番号はハッシュ化を行っています。)"
  );

  if (user == null || user == "") {
    console.log("キャンセル");
    form();
  } else if (user.length == 10) {
    console.log("ok");
    save(user);
  }

  //キャンセルが押下された場合、再度入力画面
  else {
    alert(
      "学籍番号は10桁で入力してください。\n(学籍番号はハッシュ化を行っています。)"
    );
    form();
  }
}

function save(Number) {
  console.log(`mydata_in = ${Number}`);
  localStorage.setItem("studentNumber", Number);

  if (!crypto || !crypto.subtle) {
    throw Error("crypto.subtle is not supported."); // ブラウザ未対応
  }
  const algo = "SHA-256";
  crypto.subtle.digest(algo, new TextEncoder().encode(Number)).then((x) => {
    const hex = hexString(x); // convert to hex string.
    localStorage.setItem("hashNumber", hex);
    hashNumber = hex;
  });
  location.reload();
}

function confirmSend() {
  var result = window.confirm(
    " ウェブ閲覧行動分析の研究を目的とし、閲覧ログを収集してもよろしいでしょうか。 \n\n 閲覧ログには、ハッシュ化を行った学籍番号、閲覧している時刻、閲覧しているページタイトル、閲覧に要した時間、アクセス元のブラウザ、が含まれます。 学籍番号のみハッシュ化し匿名化して収集を行います。 \n\n ウェブ閲覧行動分析の研究以外の目的ではこれらの情報を使用致しません。 \n\n\n OK : 同意 \n キャンセル : 同意しない"
  );

  localStorage.setItem("confirm", result); //ローカルストレージに結果を保存
  return result;
}

function getConfirm() {
// 追加分
initFingerprintJS();

  return localStorage.getItem("confirm"); //確認済みはtrue,false 未確認はnull
}

function hexString(buffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

//hash化してsesstionstrageに保存
function sGetHash(name, num) {
  const algo = "SHA-256";
  // generate hash!
  crypto.subtle.digest(algo, new TextEncoder().encode(num)).then((x) => {
    // convert to hex string.
    const hex = hexString(x);
    sessionStorage.setItem(name, hex);
  });
}

//fpの要素を返すメソッド
function returnElement(fp_value) {
  //valueがobjか調べる
  if (typeof fp_value == "object") {
    var ele = [];
    for (const [key, value] of Object.entries(fp_value)) {
      ele.push(value);
    }
    return ele;
  } else {
    //valueがobj以外なら表示
    return fp_value;
  }
}

//objのkeyを返すメソッド
function returnKey(fp_value) {
  //valueがobjか調べる
  if (typeof fp_value == "object") {
    var elekey = [];
    for (const [key, value] of Object.entries(fp_value)) {
      elekey.push(key + ":" + value);
    }
    return elekey;
  } else {
    //valueがobj以外なら表示
    return fp_value;
  }
}

//60s後データ送信
window.setTimeout(function(){
  console.log("set時間経過")
  if (localStorage.getItem("confirm") == "true" && s == 1) {
    fInitFingerprintJS();
  }
},60000);


//fingerprintのデータの送信を行う
function fInitFingerprintJS() {
  // Initialize the agent at application startup.
  const fpPromise = import("https://openfpcdn.io/fingerprintjs/v3").then(
    (FingerprintJS) => FingerprintJS.load()
  );
  fpPromise
    .then((fp) => fp.get())
    .then((result) => {
      // This is the visitor identifier:
      const visitorId = result.visitorId;
      //   console.log(result)
      const com = result.components;

      //jsonにデータを格納する処理
      //valueがundefi ならlogに表示されない
      const fpData = {
        hls:"hls",
        i: localStorage.getItem("hashNumber"),
        vId: returnElement(result.visitorId),
        audio: returnElement(com.audio.value),
        canvas_geometry: sessionStorage.getItem("can_geo"),
        canvas_text: sessionStorage.getItem("can_text"),
        canvas_windingg: sessionStorage.getItem("ary_winding,"),
        colorDepth: returnElement(com.colorDepth.value),
        colorGamut: returnElement(com.colorGamut.value),
        contrast: returnElement(com.contrast.value),
        cookiesEnabled: returnElement(com.cookiesEnabled.value),
        cpuClass: returnElement(com.cpuClass.value),
        deviceMemory: returnElement(com.deviceMemory.value),
        domBlockers: returnElement(com.domBlockers.value),
        fontPreferences: returnKey(com.fontPreferences.value),
        fonts: returnElement(com.fonts.value),
        forcedColors: returnElement(com.forcedColors.value),
        hardwareConcurrency: returnElement(com.hardwareConcurrency.value),
        hdr: returnElement(com.hdr.value),
        indexedDB: returnElement(com.indexedDB.value),
        invertedColors: returnElement(com.invertedColors.value),
        languages: returnElement(com.languages.value),
        localStorage: returnElement(com.localStorage.value),
        math: returnKey(com.math.value),
        monochrome: returnElement(com.monochrome.value),
        openDatabase: returnElement(com.openDatabase.value),
        osCpu: returnElement(com.osCpu.value),
        platform: returnElement(com.platform.value),
        plugins: returnElement(com.plugins.value),
        reducedMotion: returnElement(com.reducedMotion.value),
        screenFrame: returnElement(com.screenFrame.value),
        screenResolution: returnElement(com.screenResolution.value),
        sessionStorage: returnElement(com.sessionStorage.value),
        timezone: returnElement(com.timezone.value),
        touchSupport: returnKey(com.touchSupport.value),
        vendor: returnElement(com.vendor.value),
        vendorFlavors: returnElement(com.vendorFlavors.value),
      };

      //data1 のクエリーを送る
      const img = document.createElement("img");
      var dataForSend = JSON.stringify(fpData);
      var urlForSend2 = `${url}/log.fp?j=${dataForSend}`;
      img.setAttribute("src", urlForSend2);
      img.setAttribute("width", "0");
      img.setAttribute("height", "0");
      document.body.appendChild(img);
      console.log("fp送信完了");
    });
}

let s = 0;//0: init終わってない

//strageに保存する要素を取る
function initFingerprintJS() {
  const fpPromise = import("https://openfpcdn.io/fingerprintjs/v3").then(
    (FingerprintJS) => FingerprintJS.load()
  );
  fpPromise
    .then((fp) => fp.get())
    .then((result) => {
      //   console.log(result)
      const com = result.components;
      //配列をそれぞれ1このStringに変更
      let ary = returnElement(com.canvas.value);
      let ary_winding = ary.shift();
      let ary_geometry = ary.shift();
      let ary_text = ary.shift();

      //長すぎるvaleをhash化して短くするためにsesstion strage に一時保存
      sGetHash("can_geo", ary_geometry);
      sGetHash("can_text", ary_text);
      sessionStorage.setItem("ary_winding", ary_winding);
      console.log("canvas to strage set");
      s = 1;
    });
  }