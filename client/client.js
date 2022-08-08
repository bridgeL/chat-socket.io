Date.prototype.toFuckingString = function () {
    let mon = `0${this.getMonth() + 1}`.slice(-2);
    let day = `0${this.getDate()}`.slice(-2);
    let hour = `0${this.getHours()}`.slice(-2);
    let min = `0${this.getMinutes()}`.slice(-2);
    let sec = `0${this.getSeconds()}`.slice(-2);
    return `${this.getFullYear()}-${mon}-${day} ${hour}:${min}:${sec}`;
};

function add_msg(uid, uname, text, ctime) {
    if (!ctime) ctime = new Date().toFuckingString();
    let li = $("<li>")
        .append($("<span>").text(`[${ctime}] `).prop("class", "ctime"))
        .append($("<span>").text(`${uname}`).prop("class", "uname"))
        .append($("<span>").text(`(${uid}) `).prop("class", "uid"))
        .append($("<span>").text(`${text}`).prop("class", "text"));
    $("#chat").append(li);
    $("#main").prop("scrollTop", $("#main").prop("scrollHeight"));
}

function update_room_view(users) {
    let room = $("#room");

    room.children().remove();

    users.forEach((user) => {
        room.append(
            $("<span>").text(`${user.uname}`).prop("class", "uname")
        ).append($("<span>").text(`(${user.uid}) `).prop("class", "uid"));
    });
}

$(() => {
    // 初始化
    let socket = io();

    // 登录
    socket.emit("login", localStorage.getItem("uid"));

    // 登录成功，同步用户信息，房间信息
    socket.on("init", (uid, uname, users, history) => {
        let user = { uid: uid, uname: uname };
        console.log(user);
        update_room_view(users);
        history.forEach((_) => {
            add_msg(_.uid, _.uname, _.text, _.ctime);
        });

        $("#uname").val(user.uname);
        localStorage.setItem("uid", user.uid);

        // 改名
        $("#uname").blur(() => {
            let uname = $("#uname").val();
            if (user.uname == uname) return;
            user.uname = uname;

            // 更新房间内成员信息
            let u = users.find((_) => _.uid == user.uid);
            if (u) u.uname = uname;

            update_room_view(users);

            socket.emit("name-change", uname);
        });

        socket.on("name-change", (uid, uname) => {
            if (user.uid == uid) {
                user.uname = uname;
                $("#uname").val(uname);
            }

            // 更新房间内成员信息
            let u = users.find((_) => _.uid == uid);
            if (u) u.uname = uname;

            update_room_view(users);
        });

        socket.on("room-join", (uid, uname) => {
            let _user = {
                uid: uid,
                uname: uname,
            };
            users.push(_user);
            add_msg(uid, uname, "join");
            update_room_view(users);
        });

        socket.on("room-leave", (uid, uname) => {
            let _user = {
                uid: uid,
                uname: uname,
            };
            let i = users.findIndex((_) => _.uid == uid);
            if (i < 0) return;
            users.splice(i, 1);
            add_msg(uid, uname, "leave");
            update_room_view(users);
        });

        // 发消息
        $("form").submit((e) => {
            e.preventDefault(); // prevents page reloading

            let text = $("#m").val();
            if (!text) return;

            $("#m").val("");

            socket.emit("chat", text);
            add_msg(user.uid, user.uname, text);

            return false;
        });

        socket.on("chat", (uid, uname, text, ctime) => {
            add_msg(uid, uname, text, ctime);
        });
    });
});
