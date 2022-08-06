var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.get("/", (req, res) => {
    res.redirect("room/demo");
});

app.get("/room", (req, res) => {
    res.redirect("room/demo");
});

app.get("/room/:rname", (req, res) => {
    let rname = req.params["rname"];
    if (rname[0] == "@") res.redirect("room/demo");
    else res.sendFile(__dirname + "/client/index.html");
});

app.get("/client/:fname", (req, res) => {
    let fname = req.params["fname"];
    res.sendFile(__dirname + "/client/" + fname);
});

const get_rname = (url) => {
    var reg = new RegExp("https?://.*?/room/(\\w+)");
    var r = url.match(reg); //匹配目标参数
    return r ? unescape(r[1]) : null; //返回参数值
};

const create_uid = (len) => {
    let chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let uid = Array(len)
        .fill()
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
    return uid;
};

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

Array.prototype.push_limit = function (val, len_limit) {
    this.push(val);
    let n = this.length - len_limit;
    if (n > 0) {
        this.splice(0, n);
    }
};

var rooms = [];

io.on("connection", (socket) => {
    let rname = get_rname(socket.handshake.headers.referer);
    let user = {
        uid: null,
        uname: null,
    };
    socket.join(rname);

    // 获取房间信息
    let room = rooms.find((_) => _.name == rname);
    if (!room) {
        room = { name: rname, users: [], history: [] };
        rooms.push(room);
    }

    // 注册uid
    socket.on("init", (uid, uname, callback) => {
        if (!uid) {
            uid = create_uid(8);
            callback(uid);
        }
        user.uid = uid;
        user.uname = uname;

        socket.join("@" + uid);
        room.users.push(user);

        // 发送房间信息
        socket.emit("room info", room);

        // 告知房间里其他人，来人了
        socket.to(rname).emit("room join", user);
    });

    // 改名
    socket.on("change uname", (uname) => {
        user.uname = uname;
        socket.to("@" + user.uid).emit("change uname", user);
        socket.to(rname).emit("change uname", user);
    });

    // 退出时删除uid，如果房间为空则一并删除房间
    socket.on("disconnect", () => {
        room.users.remove(user);

        if (room.users.length == 0) {
            rooms.remove(room);
        }

        // 告知房间里其他人，离开了
        socket.to(rname).emit("room leave", user);
    });

    // 转发消息
    socket.on("chat", (msg) => {
        console.log(`${user.uname}: ${msg}`);
        // 默认 broadcast
        socket.to(rname).emit("chat", user.uname, user.uid, msg);
        // 记录历史
        room.history.push_limit(
            {
                user: user,
                msg: msg,
            },
            2
        );
        console.log(room.history);
    });

    // 正在输入
    socket.on("typing", () => {
        // 默认 broadcast
        socket.to(rname).emit("typing", user);
    });
});

http.listen(3000, () => {
    console.log("listening on http://127.0.0.1:3000");
});
