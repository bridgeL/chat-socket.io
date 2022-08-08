let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);

// -----------------------------------------------------------------
// 静态页面部署
// -----------------------------------------------------------------

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

// -----------------------------------------------------------------
// 全局变量
// -----------------------------------------------------------------

// 总房间列表
let rooms = [];

// 总用户列表
let users = [];

// -----------------------------------------------------------------
// class
// -----------------------------------------------------------------

class Room {
    constructor(rname) {
        this.rname = rname;
        this.users = [];
        this.history = [];
        rooms.push(this);
        // 如果房间过多，则清理最早的房间
        let n = rooms.length - 100;
        if (n > 0) rooms.splice(0, n);
    }

    join(user) {
        this.users.push(user);
        io.to(this.rname).emit("room-join", user.uid, user.uname);
    }

    leave(user) {
        let i = this.users.findIndex((_) => _.uid == user.uid);
        this.users.splice(i, 1);
        io.to(this.rname).emit("room-leave", user.uid, user.uname);

        // // 删除空房间
        // if (this.users.length == 0 && this.history.length ==0) {
        //     let i = rooms.findIndex((_) => _.rname == this.rname);
        //     if (i > -1) rooms.splice(i, 1);
        // }
    }

    add_history(uid, uname, text, ctime) {
        this.history.push({ uid: uid, uname: uname, text: text, ctime: ctime });
        // 最多保存100条
        let n = this.history.length - 100;
        if (n > 0) this.history.splice(0, n);
    }
}

class User {
    constructor(uid) {
        if (!uid) {
            const chars =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            uid = Array(6)
                .fill()
                .map(() => chars[Math.floor(Math.random() * chars.length)])
                .join("");
        }
        this.uid = uid;
        this.uname = "";
        this.conns = [];
        users.push(this);
    }

    join(sid, rname) {
        if (!this.conns.find((_) => _.rname == rname))
            get_room(rname).join(this);
        this.conns.push({ sid: sid, rname: rname });
    }

    leave(sid) {
        let i = this.conns.findIndex((_) => _.sid == sid);
        if (i < 0) return;
        let rname = this.conns.splice(i, 1)[0].rname;
        i = this.conns.findIndex((_) => _.rname == rname);
        if (i < 0) get_room(rname).leave(this);
    }

    get_rnames() {
        let rnames = [];
        this.conns.forEach((conn) => {
            if (rnames.indexOf(conn.rname) < 0) rnames.push(conn.rname);
        });
        return rnames;
    }
}

// -----------------------------------------------------------------
// function
// -----------------------------------------------------------------

Date.prototype.toFuckingString = function () {
    let mon = `0${this.getMonth() + 1}`.slice(-2);
    let day = `0${this.getDate()}`.slice(-2);
    let hour = `0${this.getHours()}`.slice(-2);
    let min = `0${this.getMinutes()}`.slice(-2);
    let sec = `0${this.getSeconds()}`.slice(-2);
    return `${this.getFullYear()}-${mon}-${day} ${hour}:${min}:${sec}`;
};

// 获得房间（自动创建
function get_room(rname) {
    let room = rooms.find((_) => _.rname == rname);
    return room ? room : new Room(rname);
}

// 获得用户（自动创建
function get_user(uid) {
    let user = users.find((_) => _.uid == uid);
    return user ? user : new User(uid);
}

// 分析房间名
function get_rname(url) {
    let reg = new RegExp("https?://.*?/room/(\\w+)");
    let r = url.match(reg);
    return unescape(r[1]);
}

io.on("connection", (socket) => {
    socket.on("login", (uid) => {
        let user = get_user(uid);
        let rname = get_rname(socket.handshake.headers.referer);
        let room = get_room(rname);

        socket.emit(
            "init",
            user.uid,
            user.uname,
            room.users.map((_) => {
                return { uid: _.uid, uname: _.uname };
            }),
            room.history
        );
        socket.join(rname);
        user.join(socket.id, rname);

        // 修改名字
        socket.on("name-change", (uname) => {
            user.uname = uname;
            // 各个房间广播
            let rnames = user.get_rnames();
            rnames[0] = socket.to(rnames[0]);
            let sender = rnames.reduce((pre, cur) => {
                return pre.to(cur);
            });

            sender.emit("name-change", user.uid, user.uname);
        });

        // 转发消息
        socket.on("chat", (text) => {
            let ctime = new Date().toFuckingString();

            socket.to(rname).emit("chat", user.uid, user.uname, text, ctime);
            room.add_history(user.uid, user.uname, text, ctime);
        });

        // 客户端离线
        socket.on("disconnect", () => {
            user.leave(socket.id);
        });
    });
});

http.listen(20220, () => {
    console.log("listening on http://127.0.0.1:20220");
});
