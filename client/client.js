// const add_msg = (uname, uid, msg) => {
//     let date = new Date().toLocaleString();
//     let li = $("<li>")
//         .append($("<span>").text(`[${date}] `).css("color", "green"))
//         .append($("<span>").text(`${uname}`).css("color", "red"))
//         .append($("<span>").text(`(${uid}) `).css("color", "blue"))
//         .append($("<span>").text(`${msg}`));
//     $("#messages").append(li);
// };

// // 弹窗消息
// const init_notice = () => {
//     $("body").append(
//         $("<div>").attr("id", "notice").css({
//             textAlign: "right",
//             backgroundColor: "#eee",
//             margin: "2px 5px",
//             width: "300px",
//             position: "fixed",
//             right: 0,
//             top: 0,
//             fontSize: "22px",
//             whiteSpace: "pre",
//         })
//     );

//     let notice = {
//         add: (msg) => {
//             const chars =
//                 "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

//             let id = Array(8)
//                 .fill()
//                 .map(() => chars[Math.floor(Math.random() * chars.length)])
//                 .join("");

//             $("#notice").append($("<div>").text(msg).attr("id", id));
//             setTimeout(() => {
//                 $("#" + id).remove();
//             }, 3000);
//         },
//     };

//     return notice;
// };

// // 从本地加载用户信息
// const init_user = () => {
//     let uid = localStorage.getItem("uid");
//     let uname = localStorage.getItem("uname");
//     if (uname) $("#uname").val(uname);

//     let user = {
//         uid: uid,
//         uname: uname ? uname : "",
//     };
//     return user;
// };

// // 初始化room
// const init_room = () => {
//     let room = {
//         users: [],
//         update: () => {
//             let div = $("#room");
//             div.children().remove();
//             div.append($("<span>").text(`online ${room.users.length}: `));
//             room.users.forEach((user) => {
//                 div.append($("<span>").text(`${user.uname}(${user.uid}) `));
//             });
//         },
//         join: (user) => {
//             let u = room.users.find((u) => u.uid == user.uid);
//             if (u) {
//             u.uname = user.uname;
//                 return false;
//             }
//             room.users.push(user);
//             return true;
//         },
//         leave: (user) => {
//             let i = room.users.findIndex((u) => u.uid == user.uid);
//             if (i < 0) return false;
//             room.users.splice(i, 1);
//             return true;
//         },
//     };
//     return room;
// };

$(() => {
    // 初始化
    let socket = io();
    // let notice = init_notice();
    // let user = init_user();
    // let room = init_room();

    // console.log(user);

    // 登录
    let user = localStorage.getItem("user");
    let uid = user?.uid;
    socket.emit("login", uid);

    // 登录成功
    socket.on("login", (user) => {
        console.log(user);
        localStorage.setItem("user", user);
    });

    // // 获取房间信息
    // socket.on("s-room-first", (_room) => {
    //     room.users = _room.users;
    //     room.update();
    //     console.log(room);
    // });

    // // 其他人加入房间
    // socket.on("s-room-join", (user) => {
    //     room.join(user);
    //     console.log(user);
    //     let msg = `${user.uname}(${user.uid})    join`;
    //     notice.add(msg);
    // });

    // // 改名
    // $("#uname").blur(() => {
    //     let uname = $("#uname").val();
    //     if (user.uname == uname) return;

    //     user.uname = uname;
    //     localStorage.setItem("uname", uname);
    //     socket.emit("c-name-change", uname);
    // });

    // // 从其他会话导致的改名
    // socket.on("s-name-change", (_user) => {
    //     let uid = _user.uid;
    //     let uname = _user.uname;

    //     if (user.uid == uid) {
    //         user.uname = uname;
    //         $("#uname").val(uname);
    //         localStorage.setItem("uname", uname);
    //         room.update();
    //     } else {
    //         let u = room.users.find((u) => u.uid == uid);
    //         if (!u) return;
    //         u.uname = uname;
    //         room.update();
    //     }
    // });

    // // 获取房间信息
    // socket.on("room info", (_room) => {
    //     room = _room;
    //     console.log(room);
    //     show_room_info(room);
    // });

    // // 房间有人加入
    // socket.on("room join", (user) => {
    //     room.users.push(user);
    //     console.log(user, "join");
    //     show_room_info(room);
    // });

    // // 房间有人离开
    // socket.on("room leave", (user) => {
    //     let i = room.users.findIndex((_) => _.uid == user.uid);
    //     if (i > -1) {
    //         room.users.splice(i, 1);
    //     }

    //     console.log(room);
    //     console.log(user, "leave");
    //     show_room_info(room);
    // });

    // // 正在输入
    // const emit_input_event_p = () => {
    //     let last = false;
    //     const func = () => {
    //         if (!last) {
    //             console.log("input!");
    //             socket.emit("typing");
    //             last = true;
    //             setTimeout(() => {
    //                 last = false;
    //             }, 5000);
    //         }
    //     };
    //     return func;
    // };

    // let emit_input_event = emit_input_event_p();
    // $("#m").on("input", () => {
    //     emit_input_event();
    // });
    // $("#m").on("focus", () => {
    //     emit_input_event();
    // });

    // // 监听其他人正在输入
    // let typing_list = [];
    // const show_typing_info = () => {
    //     let typing_info = $("#typing");
    //     typing_info.children().remove();
    //     // if (typing_list.length == 0) return;
    //     typing_list.forEach((user) => {
    //         typing_info.append(
    //             $("<div>").text(`${user.uname}(${user.uid}) is typing`)
    //         );
    //     });
    // };

    // socket.on("typing", (user) => {
    //     if (typing_list.find((_) => _.uid == user.uid)) return;

    //     typing_list.push(user);
    //     show_typing_info();

    //     setTimeout(() => {
    //         let i = typing_list.findIndex((_) => _.uid == user.uid);
    //         if (i > -1) typing_list.splice(i, 1);
    //         show_typing_info();
    //     }, 3000);
    // });

    // // 发消息
    // $("form").submit((e) => {
    //     e.preventDefault(); // prevents page reloading

    //     let msg = $("#m").val();
    //     if (!msg) return;

    //     $("#m").val("");

    //     socket.emit("chat", msg);
    //     add_msg(user.uname, user.uid, msg);

    //     return false;
    // });

    // // 显示其他人的消息
    // socket.on("chat", (uname, uid, msg) => {
    //     add_msg(uname, uid, msg);
    // });
});
