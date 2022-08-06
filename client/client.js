const get_cache = (name, default_value) => {
    let value = localStorage.getItem(name);
    return value ? value : default_value;
};

const add_msg = (uname, uid, msg) => {
    let date = new Date().toLocaleString();
    let li = $("<li>")
        .append($("<span>").text(`[${date}] `).css("color", "green"))
        .append($("<span>").text(`${uname}`).css("color", "red"))
        .append($("<span>").text(`(${uid}) `).css("color", "blue"))
        .append($("<span>").text(`${msg}`));
    $("#messages").append(li);
};

const show_room_info = (room) => {
    let room_info = $("#room-info");
    room_info.children().remove();
    room_info.append($("<span>").text(`online ${room.users.length}: `));
    room.users.forEach((user) => {
        room_info.append($("<span>").text(`${user.uname}(${user.uid}) `));
    });
};

$(() => {
    var socket = io();

    // 初始化
    var user = {
        uid: get_cache("uid", ""),
        uname: get_cache("uname", ""),
    };
    $("#uname").val(user.uname);
    console.log(user);

    var room;

    // 注册uid
    socket.emit("init", user.uid, user.uname, (res) => {
        user.uid = res;
        localStorage.setItem("uid", user.uid);
        console.log(user);
    });

    // 改名
    $("#uname").blur(() => {
        let uname = $("#uname").val();
        if (user.uname == uname) return;
        user.uname = uname;
        localStorage.setItem("uname", uname);
        socket.emit("change uname", uname);
    });

    // 从其他会话导致的改名
    socket.on("change uname", (_user) => {
        if (_user.uid == user.uid) {
            user.uname = uname;
            $("#uname").val(uname);
            localStorage.setItem("uname", uname);
        }
        let u = room.users.find((_) => _.uid == _user.uid);
        console.log(u);
        if (u) {
            u.uname = _user.uname;
            console.log(u);
            show_room_info(room);
        }
    });

    // 获取房间信息
    socket.on("room info", (_room) => {
        room = _room;
        console.log(room);
        show_room_info(room);
    });

    // 房间有人加入
    socket.on("room join", (user) => {
        room.users.push(user);
        console.log(user, "join");
        show_room_info(room);
    });

    // 房间有人离开
    socket.on("room leave", (user) => {
        let i = room.users.findIndex((_) => _.uid == user.uid);
        if (i > -1) {
            room.users.splice(i, 1);
        }

        console.log(room);
        console.log(user, "leave");
        show_room_info(room);
    });

    // 正在输入
    const emit_input_event_p = () => {
        let last = false;
        const func = () => {
            if (!last) {
                console.log("input!");
                socket.emit("typing");
                last = true;
                setTimeout(() => {
                    last = false;
                }, 5000);
            }
        };
        return func;
    };

    let emit_input_event = emit_input_event_p();
    $("#m").on("input", () => {
        emit_input_event();
    });
    $("#m").on("focus", () => {
        emit_input_event();
    });

    // 监听其他人正在输入
    let typing_list = [];
    const show_typing_info = () => {
        let typing_info = $("#typing");
        typing_info.children().remove();
        // if (typing_list.length == 0) return;
        typing_list.forEach((user) => {
            typing_info.append(
                $("<div>").text(`${user.uname}(${user.uid}) is typing`)
            );
        });
    };

    socket.on("typing", (user) => {
        if (typing_list.find((_) => _.uid == user.uid)) return;

        typing_list.push(user);
        show_typing_info();

        setTimeout(() => {
            let i = typing_list.findIndex((_) => _.uid == user.uid);
            if (i > -1) typing_list.splice(i, 1);
            show_typing_info();
        }, 3000);
    });

    // 发消息
    $("form").submit((e) => {
        e.preventDefault(); // prevents page reloading

        let msg = $("#m").val();
        if (!msg) return;

        $("#m").val("");

        socket.emit("chat", msg);
        add_msg(user.uname, user.uid, msg);

        return false;
    });

    // 显示其他人的消息
    socket.on("chat", (uname, uid, msg) => {
        add_msg(uname, uid, msg);
    });
});
