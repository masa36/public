// flickr2html.js

(function () {
    var step = 1,
        d = document,
        w = window;
    var json = {},
    jsonCtr = 0;
    setid = "", photo_id = "";
    //setの場合の正規表現
    var getset_id = /^(http|https):\/\/(m|www).flickr.(com\/#\/|com\/)photos\/[\S@]+\/sets\/(\d+)/;
    //1枚だけの場合の正規表現
    var getphoto_id = /^(http|https):\/\/(m|www).flickr.(com\/#\/|com\/)photos\/[\S@]+\/(\d+)[\/\w\d\/]+/;
    //URLを取得
    var u = location.href;

    // 親JSからパラメータを取得
    var bmBase = 'https://masa36.github.io/public/flickr2html/flickr2html.js';
    var out = getJs('out'),
        api = getJs('api'),
        fid = getJs('fid'),
        knd = getJs('knd'),
        scs = getJs('scs'),
        cnt = getJs('cnt'),
        tim = getJs('tim'),
        typ = getJs('typ'),
        fmt = unescape(getJs('fmt'));
    fid = "", knd = "", cnt = "", tim = "";

    // bookmarkletの予約語（13個）
    var bmAry = ['username', 'userURL', 'title', 'photo_id', 'imgURL', 'pageURL', 'owner', 'description', 'tags', 'dateupload', 'latitude', 'settitle', 'width'];

    // メイン処理（非同期実行を防ぐ為にTimerを利用）
    var timerId = setInterval(function () {
        switch (step) {
            case 1:
                step = 0;
                getUrl();
                break;
            case 2:
                step = 0;
                getId();
                break;
            case 3:
                step = 0;
                getPhotoSet();
                break;
            case 4:
                step = 0;
                getPhoto();
                break;
            case 5:
                step = 0;
                dispData();
                break;
            case 6:
                clearInterval(timerId);
                timerId = null;
                return 0;
        }
    }, 100);

    //URL取得
    function getUrl() {
        if (u.match(/^(http|https):\/\/(m|www).flickr.(com\/#\/|com\/)photos\//)) {
            step = 2;
        } else {
            u = prompt('Input Flickr Photo URL', "");
            if (u.match(/^(http|https):\/\/(m|www).flickr.(com\/#\/|com\/)photos\//)) {
                step = 2;
            } else {
                alert("Not Found ...");
                step = 6;
            }
        }
    }

    //set_idまたはphoto_idの取得

    function getId() {
        if (u.match(/sets/)) {
            var result = u.match(getset_id);
            set_id = result[4];
            step = 3;
        } else {
            var result = u.match(getphoto_id);
            photo_id = result[4];
            step = 4;
        }
    }

    //photoset_idの場合の画像取得

    function getPhotoSet() {
        var s = d.createElement("script");
        var src = "https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=" + api + "&photoset_id=" + set_id + "&extras=date_upload%2C+owner_name%2C+geo%2C+tags%2C+media%2C+url_sq%2C+url_t%2C+url_s%2C+url_m%2C+url_z%2C+url_l%2C+url_o&format=json";

        /*  https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=【APIキー】&photoset_id=72157623813840872&extras=date_upload%2C+owner_name%2C+geo%2C+tags%2C+media%2C+url_sq%2C+url_t%2C+url_s%2C+url_m%2C+url_z%2C+url_l%2C+url_o&format=json&nojsoncallback=1 */

        while (d.getElementById("getPhotoSet")) {
            d.getElementById("getPhotoSet").parentNode.removeChild(d.getElementById("getPhotoSet"));
        }

        s.charset = "utf-8";
        s.src = src + "&jsoncallback=result";
        s.id = "getPhotoSet";
        d.body.appendChild(s); //alert(s.src);
        w.result = function (data) {
            if (data.photoset.photo.length == 0) {
                prompt('Result', 'Not Found ...');
                step = 6;
                return;
            }
            set_owner = data.photoset.owner;
            set_ownername = data.photoset.ownername;
            jsonCtr = data.photoset.photo.length;
            for (var i = 0; i < jsonCtr; i++) {
                json[i] = data.photoset.photo[i];
            }
            step = 5;
        }
    }

    //photo_idの場合の画像取得


    function getPhoto() {
        var s = d.createElement("script");
        var src = "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=" + api + "&photo_id=" + photo_id + "&format=json";

        /* https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=【APIキー】&photo_id=5991974515&format=json&nojsoncallback=1 */

        while (d.getElementById("getPhoto")) {
            d.getElementById("getPhoto").parentNode.removeChild(d.getElementById("getPhoto"));
        }
        s.charset = "utf-8";
        s.src = src + "&jsoncallback=result"; //alert(s.src);
        s.id = "getPhoto";
        d.body.appendChild(s);
        w.result = function (data) {
            if (data.photo.urls.url.length == 0) {
                prompt('Result', 'Not Found ...');
                step = 6;
                return;
            }
            photo_owner = data.photo.owner.nsid;
            photo_ownername = data.photo.owner.username;
            photo_title = data.photo.title._content;
            photo_farm_id = data.photo.farm;
            photo_secret = data.photo.secret;
            photo_server_id = data.photo.server;
            photo_format = data.photo.originalformat;
            jsonCtr = data.photo.urls.url.length;
            for (var i = 0; i < jsonCtr; i++) {
                json[i] = data.photo.urls.url[i];
            }
            step = 5;
        }
    }

    // 結果の整理と出力方法ごとの処理


    function dispData() {
        var x = '',
            chk = '';
        for (var i = 0; i < jsonCtr; i++) {
            var z = json[i],
                pData = fmt;

            // 結果をbookmarklet予約語に変換してfmtを置換
            var bmData = handData(z);
            for (var j = 0; j < bmAry.length; j++) {
                var key = bmAry[j],
                    value = bmData[key],
                    reg = new RegExp('\\${' + key + '}', 'g');
                pData = pData.replace(reg, value);
            }
            x = x + pData + '\n\n';
            chk = chk + pData;
        }

        if (chk != '') {
            // 出力方法ごとの処理（プレビュー表示）
            if (out == "preview" ) {
                d.body.innerHTML = 
                '<div id="bkmlt_preview">' +
                "<form><input type='button' value='プレビュー表示を消す' onclick='javascript:" +
                'var a=document.getElementById("bkmlt_preview");a.parentNode.removeChild(a);' +
                "'>　<input type='button' value='HTMLを選択する' onclick='javascript:" +
                'var a=document.getElementById("bkmklt_ret");a.focus();' +
                "'>　<input type='button' value='HTMLの内容でプレビューを書き直す' onclick='javascript:" +
                'var a=document.getElementById("bkmklt_ret").value;' +
                'document.getElementById("bkmklt_rewrite").innerHTML=a;' +
                "'></form>" + '<textarea style="width:99%;font-size:80%;" rows="10" id="bkmklt_ret"' +
                'onfocus="javascript:this.select();">' + x + '</textarea><br><br><div id="bkmklt_rewrite">' +
                 x + '</div></div>' + d.body.innerHTML;
            }
            // 出力方法ごとの処理（ポップアップ表示）
            if (out == "popup") {
                prompt("result", x);
            }
            // 出力方法ごとの処理（ポップアップ→Textforce連携）
            if (out == "pop-textforce") {
                prompt("result", x);
                w.location = 'textforce://';
            }
            // 出力方法ごとの処理（Texeforce連携）
            if (out == "textforce") {
                w.location = 'textforce://file?path=/blog.html&method=write&after=quick_look&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Texeforce連携しSafariに戻る）
            if (out == "safari-textforce") {
                w.location = 'textforce://file?path=/blog.html&method=write&after=quick_look&text=' + encodeURIComponent(x) + '&callback=' + encodeURIComponent(location.href);
            }
            // 出力方法ごとの処理（DraftPad連携）
            if (out == "draftpad") {
                w.location = 'draftpad:///insert?after=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（するぷろ連携）
            if (out == "slpro") {
                w.location = 'slpro://' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Moblogger連携）
            if (out == "moblogger") {
                prompt("result", x);
                w.location = 'moblogger://';
            }
            // 出力方法ごとの処理（Mobloggerを起動して追記）
            if (out == "moblogger-app") {
                w.location = 'moblogger://append?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Mobloggerを起動してクリップボードにコピー）
            if (out == "moblogger-pb") {
                w.location = 'moblogger://pboard?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（MyEditor連携）
            if (out == "myeditor") {
                prompt("result", x);
                w.location = 'myeditor://';
            }
            // 出力方法ごとの処理（MyEditorを起動してカーソル位置にコピー）
            if (out == "myeditor-cursor") {
                w.location = 'myeditor://cursor?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Rowlineを起動して文末に追加）
            if (out == "rowline") {
                w.location = 'rowline:///set?loc=bottom&view=lines&callback=seeq://&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（@matubizさん作MyScripts用スクリプト、TextHandlerに送信）
            if (out == "msth") {
                w.location = 'myscripts://run?title=TextHandler&text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（ThumbEditに送る）
            if (out == "thumbedit") {
                w.location = 'thumbedit://?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（ThumbEditに追記）
            if (out == "thumbedit-insert") {
                w.location = 'thumbedit://?text=' + encodeURIComponent(x) + '&mode=insert';
            }
            // 出力方法ごとの処理（PressSync Proに送る）
            if (out == "presssync") {
                w.location = 'presssync:///message?' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（PressSync Proに送る）
            if (out == "textwell") {
                w.location = 'textwell:///insert?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（はてなブログで新規作成）
            if (out == "hatenablog") {
                w.location = 'hatenablog:///new?title=new%20post&body=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Draftsで新規作成）
            if (out == "drafts") {
                w.location = 'drafts://x-callback-url/create?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（Drafts 4で新規作成）
            if (out == "drafts4") {
                w.location = 'drafts4://x-callback-url/create?text=' + encodeURIComponent(x);
            }
            // 出力方法ごとの処理（AmeEditorに送る）
            if (out == "ameeditor") {
                w.location = 'ameeditor://insert?text=' + encodeURIComponent(x);
            }            // 出力方法ごとの処理（SLPRO Xに送る）
            if (out == "slpro-x") {
                w.location = 'slpro-x://?q=' + encodeURIComponent(x);
            }
        }
        step = 6;
    }

    // Bookmarklet予約語へのセット


    function handData(data) {
        var x = new Array(bmAry);

        // Photoset以外とPhotosetで値が異なる
        if (u.match(/(sets/)) {
            x.username = data.ownername;
            x.photoID = data.id;
            x.userURL = "http://www.flickr.com/photos/" + set_owner + "/";
            x.pageURL = "http://www.flickr.com/photos/" + set_owner + "/" + x.photoID + "/";
            x.description = '';
        } else {
            x.username = photo_ownername; //alert(x.username);
            x.photoID = photo_id;
            x.userURL = "http://www.flickr.com/photos/" + photo_owner + "/";
            x.pageURL = "http://www.flickr.com/photos/" + photo_owner + "/" + x.photoID + "/";
            data.title = photo_title;
            data.url_m = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + ".jpg";
            data.url_z = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + "_z.jpg";
            data.url_l = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + "_b.jpg";
            data.url_s = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + "_m.jpg";
            data.url_t = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + "_t.jpg";
            data.url_sq = "http://farm" + photo_farm_id + ".static.flickr.com/" + photo_server_id + "/" + photo_id + "_" + photo_secret + "_s.jpg";
        }

        x.title = data.title;
        if (typ == 'M500') x.imgURL = data.url_m;
        if (typ == 'M640') x.imgURL = data.url_z;
        if (typ == 'L') x.imgURL = data.url_l;
        if (typ == 'S') x.imgURL = data.url_s;
        if (typ == 'T') x.imgURL = data.url_t;
        if (typ == 'Sq') x.imgURL = data.url_sq;
        x.tags = data.tags;
        x.dateupload = strDatetime(data.dateupload);
        x.latitude = data.latitude;

        if (scs == "0" || scs == '' || !scs) {
            x.width = '';
        } else if (scs.indexOf("px") != -1 || scs.indexOf("%") != -1) {
            x.width = 'width="' + scs + '"';
        } else {
            x.width = 'width="';
            if (data.width_m > data.height_m) {
                x.width += Math.round(scs) + '"';
            } else {
                x.width += Math.round(eval(scs) * (data.width_m / data.height_m)) + '"';
            }
        }
        //alert(x.username+"\n"+x.userURL+"\n"+x.title+"\n"+x.photoID+"\n"+x.imgURL+"\n"+x.pageURL+"\n"+ x.owner+"\n"+x.description+"\n"+x.tags+"\n"+x.dateupload+"\n"+x.latitude+"\n"+x.settitle+"\n"+x.width);
        return x;
    }


    // 親JSからGET形式でパラメータを引継ぐ為の関数


    function getJs(searchKey) {
        var scripts = document.getElementsByTagName("script"),
            urlArg, params = {};
        for (var i = 0; i < scripts.length; i++) {
            var tmp = scripts.item(i);
            if (tmp.src.indexOf(bmBase) != -1) {
                urlArg = tmp.src.slice(bmBase.length + 1);
                break;
            }
        }
        var paramAry, jsonKey, jsonVal, pos;
        if (urlArg) paramAry = urlArg.split("&");
        if (paramAry) {
            for (var i = 0; i < paramAry.length; i++) {
                var pos = paramAry[i].indexOf('=');
                if (pos > 0) {
                    jsonKey = paramAry[i].substring(0, pos);
                    jsonVal = paramAry[i].substring(pos + 1);
                }
                if (jsonKey == searchKey) return jsonVal;
            }
        }
        return null;
    }

    // 前詰めゼロ処理


    function zeroFormat(num, max) {
        var tmp = "" + num;
        while (tmp.length < max) {
            tmp = "0" + tmp;
        }
        return tmp;
    }

    // utimeの数値を+9時間して日付文字に整形


    function strDatetime(num) {
        var dt = new Date(),
            tmp;
        dt.setTime(num + '000');
        dt.setHours(dt.getHours() + 9);
        tmp = zeroFormat(dt.getFullYear(), 4) + '/' + zeroFormat(dt.getMonth(), 2) + '/' + zeroFormat(dt.getDate(), 2) + ' ' + zeroFormat(dt.getHours(), 2) + ':' + zeroFormat(dt.getMinutes(), 2);
        return tmp;
    }
})();
