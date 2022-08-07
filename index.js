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
        rooms.push(this);
    }

    join(user) {
        this.users.push(user);
        io.to(this.rname).emit("room-join", user);
        console.log("room-join", user);
    }

    leave(user) {
        let i = this.users.findIndex((_) => _.uid == user.uid);
        this.users.splice(i, 1);
        io.to(this.rname).emit("room-leave", user);
        console.log("room-leave", user);
    }
}

class User {
    constructor(uid) {
        if (!uid) {
            const chars =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            uid = Array(8)
                .fill()
                .map(() => chars[Math.floor(Math.random() * chars.length)])
                .join("");
        }
        this.uid = uid;
        this.uname = "unknown";
        this.sockets = [];
        users.push(this);
    }

    join(sid, rname) {
        console.log("user-join", sid, rname);
        if (!this.sockets.find((_) => _.rname == rname))
            get_room(rname).join(this);
        this.sockets.push({ sid: sid, rname: rname });
    }

    leave(sid) {
        console.log("user-leave", sid);
        let i = this.sockets.findIndex((_) => _.sid == sid);
        if (i < 0) return;
        let rname = this.sockets.splice(i, 1).rname;
        i = this.sockets.findIndex((_) => _.sid == sid);
        if (i < 0) get_room(rname).leave(this);
    }
}

// -----------------------------------------------------------------
// function
// -----------------------------------------------------------------

// 获得房间（自动创建
const get_room = (rname) => {
    let room = rooms.find((_) => _.rname == rname);
    return room ? room : Room(rname);
};

// 获得用户（自动创建
const get_user = (uid) => {
    let user = users.find((_) => _.uid == uid);
    return user ? user : User(uid);
};

// 分析房间名
const get_rname = (url) => {
    let reg = new RegExp("https?://.*?/room/(\\w+)");
    let r = url.match(reg);
    return unescape(r[1]);
};

io.on("connection", (socket) => {
    socket.on("login", (uid) => {
        let rname = get_rname(socket.handshake.headers.referer);
        let user = get_user(uid);
        user.join(socket.id, rname);

        socket.emit("login", user);
    });

    socket.on("disconnect", () => {
        let user = get_user(uid);
        user.leave(socket.id);
    });
});

http.listen(3000, () => {
    console.log("listening on http://127.0.0.1:3000");
});
