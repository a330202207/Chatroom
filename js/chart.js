var chart = function () {
    var nickName;
    var id = "chart";
    var ws;
    var chartArr = [
        ['聊天室1'],
        ['聊天室2'],
        ['聊天室3'],
        ['聊天室4'],
        ['聊天室5'],
    ];

    var nowChart;       //当前聊天室

    //窗口滑滚
    var initScroll = function () {
        $(window).scroll(function () {
            liulanqi();
        });//滚动触发
        $(window).resize(function () {
            liulanqi();
            return false;
        });//窗口触发
        liulanqi();
    };

    //浏览器
    var liulanqi = function () {
        var h = $(window).height();
        var w = $(window).width();
        $("#top").width(w);
        $("#foot").html(h);

        $(".box").height(h - 135);
        $("#mid_con").height(h - 255);
        $(".right_box").height(h - 134);
        $("#mid_say textarea").width(w - 480);

        if ($(".box").height() < 350) {
            $(".box").height(350)
        }
        if ($("#mid_con").height() < 230) {
            $("#mid_con").height(230)
        }
        if ($(".right_box").height() < 351) {
            $(".right_box").height(351)
        }
        if ($("#mid_say textarea").width() < 320) {
            $("#mid_say textarea").width(320)
        }

        if (w <= 800) {
            $("#top").width(800);
            $("#body").width(800)
        } else {
            $("#body").css("width", "100%")
        }
        // $("#top").html(b_h);

        $(".my_show").height($("#mid_con").height() - 30);//显示的内容的高度出现滚动条

        //右边的高度
        r_h = $(".right_box").height() - 40 * 3;
        $("#right_top").height(r_h * 0.25)
        $("#right_mid").height(r_h * 0.45)
        $("#right_foot").height(r_h * 0.3)
    };

    //左边菜单
    var leftMenu = function () {
        //点击展开会员
        $(".h3").click(function () {
            $(this).toggleClass("click_h3").next(".ul").toggle(600);
        });
    };

    //加载聊天室
    var loadChart = function () {
        //初始清空原来留在那里让w3c通过的
        $(".ul").html("");
        for (i = 0; i < chartArr.length; i++) {
            newChart('.ul_2', chartArr[i], i);
        }
    };

    //创建聊天室
    var newChart = function ($this, arr, i, ing) {
        //创建最近聊天
        if (ing != undefined) {
            $($this).prepend('<li id="' + id + i + '">' + arr[0] + '</li>');
            //给按钮加事件
            $('#' + id + i).click(function () {
                titleNewChart('title_' + id + ing, arr[0], arr[1]);
            });
        } else {        //创建聊天室列表
            $($this).append('<li id="' + id + i + '">' + arr[0] + '</li>');
            //给按钮加事件
            $('#' + id + i).click(function () {
                titleNewChart('title_' + id + i, arr[0], arr[1]);
            });
        }
        hoverChart('#' + id + i);//给经过触发
        updateChart();//更新人数
    };

    var titleNewChart = function (id, chart, img) {

        if (nickName == undefined) {
            layer.prompt({title: '请输入昵称', maxlength: 20}, function (nick_name, index) {
                nickName = nick_name;
                welcome(index);
            });
            return false;
        }

        createContent(chart, id);

        if ($("#" + id).length < 1) {

            //连接聊天室
            link(nickName, id);


            $("#mid_top").append('<div id="' + id + '" class="list"><table border="0" cellspacing="0" cellpadding="0"><tr><td id="zi' + id + '" class="td_user td_user_click">' + chart + '</td><td id="zino' + id + '" class="td_hide td_hide_click">X</td></tr></table></div>');
            //创建完成后给事件
            $('#' + id).click(function () {
                titleNewChart(id, chart, img);
            });

            //关闭
            $("#zino" + id).click(function () {
                delChart(id, chart, img);
                return false
            });
        } else {
            $("#zino" + id).addClass("td_hide_click");//给自己加样式
            $("#zi" + id).addClass("td_user_click");//给自己加样式
        }

        removeSiblings("#" + id);

        createChartImg(chart, id, img);

        nowChart = id;//当前用户

        $("#right_mid").html("");//清空右边的内容
    };

    //去掉兄弟样式
    var removeSiblings = function ($this) {
        $($this).siblings().children().children().children().children().removeClass("td_hide_click td_user_click");
    };

    //创建内容框
    var createContent = function (chart, id) {
        if ($("#user_con" + id).length < 1) {
            $(".con_box").append('<div id="user_con' + id + '"><font color="#CCCCCC">欢迎来到【' + chart + '】聊天，请在下面文本框里输入你想要聊天的内容</font></div>');

            //默认隐藏，增加效果
            $("#user_con" + id).hide();
        }
        sibliHide("#user_con" + id);
    };

    var onChart = function (data) {
        $("#user_con" + data.user.room).append('<div style="text-align:center;color: #B03060">' + data.message + '</div>');
        sendMsg();
    };

    //创建聊天室图片
    var createChartImg = function (chart, id, img) {
        if ($(".head" + id).length < 1) {
            if (!img) {//头像为空的时候
                img = "user_img/0.jpg";
            }
            $("#right_top").append('<div class="head' + id + '"><p><img src="' + img + '" alt="' + chart + '" /></p>' + chart + '<div>');
            $(".head" + id).hide();//默认是隐藏，让它有一点效果
        }
        sibliHide(".head" + id);
    };

    //隐藏头像
    var sibliHide = function ($this) {
        $($this).show(500, function () {
            $(".my_show").scrollTop($(".con_box").height() - $(".my_show").height());
            /*让滚动滚到最底端*/
        }).siblings().hide(500);
    };

    //删除聊天窗
    var delChart = function (id, chart, img) {
        if (nowChart == id) {
            layer.confirm('你确定要关闭 ' + chart + '窗口吗？\n 注意哦，关闭后你在 ' + chart + ' 的聊天记录就不见了哦', {
                btn: ['确定', '取消'] //按钮
            }, function (index) {

                ws.close();
                layer.close(index);
                $("#" + id).remove();                       //栏目栏目
                $("#user_con" + id).remove();               //删除内容
                $(".head" + id).remove();                   //删除头像
                if ($(".list").length > 0) {
                    var eq = $(".list").length - 1;
                    var oldId = $(".list:eq(" + eq + ")").attr("id");
                    sibliHide(".head" + oldId);             //显示最后一个的头像
                    sibliHide("#user_con" + oldId);         //显示最后一个的内容
                    $("#zino" + oldId).addClass("td_hide_click");//给最后一个加样式
                    $("#zi" + oldId).addClass("td_user_click");//给最后一个加样式
                    nowChart = oldId;//给聊天框定位
                } else {
                    $(".dandan_liaotian").show(500);
                }
            });
        } else {
            titleNewChart(id, chart, img);
        }
    };

    //更新聊天窗口
    var updateChart = function () {
        var length1 = $(".ul_1 > li").length;
        var length2 = $(".ul_2 > li").length;
        $(".n_geshu_1").text(length1);
        $(".n_geshu_2").text(length2);
    };

    var hoverChart = function ($this) {
        $($this).hover(
            function () {
                $(this).addClass("hover");
            },
            function () {
                $(this).removeClass("hover");
            }
        );
    };

    //链接WebSocket
    var link = function (nickName, room_id) {
        ws = new WebSocket("ws://111.231.57.144:9995");

        ws.onopen = function () {
            console.log('链接成功');
            ws.send(toJson("login", nickName, room_id));
        }

        //关闭
        ws.onclose = function (event) {
            console.log(event);
            layer.msg("已经与服务器断开连接\r\n当前连接状态：" + this.readyState);
        }

        //异常
        ws.onerror = function (event) {
            layer.msg('连接异常');
            console.log(event);
        }

        //返回消息
        ws.onmessage = function (evt) {
            var data = $.parseJSON(evt.data);
            switch (data.type) {
                case 'open':
                    onChart(data);
                    break;
                case 'close':
                    onChart(data);
                    break;
                case 'message':
                    showMsg(data);
                    console.log(data);
                    break;
            }
        }
    };

    //显示消息
    var showMsg = function (data) {
        var t = new Date().toLocaleTimeString();//当前时间
        if (data.user.nick_name == nickName) {
            var str = '<div class="my_say_con"><font color=\"#0000FF\">【' + data.user.nick_name + '】' + t + "</font><p><font color=\"#333333\">" + trim2(trim(data.message)) + '</font></p></div>';
        } else {
            var str = '<div class="my_say_con"><font color=\"#9BCD9B\">【' + data.user.nick_name + '】' + t + "</font><p><font color=\"#333333\">" + trim2(trim(data.message)) + '</font></p></div>';
        }


        // $(".con_box").append(str);
        $("#user_con" + nowChart).append(str);

        $("#texterea").val("");

        //让滚动滚到最底端
        $(".my_show").scrollTop($(".con_box").height() - $(".my_show").height());

        var ing_id = nowChart.substring(11, nowChart.length);
        //创建最近聊天
        if ($("#usering" + ing_id).length < 1) {//创建最近聊天人
            newChart('.ul_1', chartArr[ing_id], 'ing' + ing_id, ing_id);
        } else {
            updateMyChart('.ul_1', chartArr[ing_id], 'ing' + ing_id, ing_id);
        }
    };

    //转换格式
    var toJson = function (type, msg, room_id) {
        var data = {
            "type": type,
            "message": msg,
            "room_id": room_id
        }
        return JSON.stringify(data);
    };

    var welcome = function (index) {
        layer.close(index);
        $("#right_foot").html('<p><img src="images/head.jpg" alt="头象" /></p>' + nickName);
        //欢迎
        $("#top").html('<br />&nbsp;&nbsp;' + myTime() + ',' + nickName + ',欢迎你的到来！！');
    };

    //替换所有的回车换行
    var trim2 = function (content) {
        var string = content;
        try {
            string = string.replace(/\r\n/g, "<br />")
            string = string.replace(/\n/g, "<br />");
        } catch (e) {
            alert(e.message);
        }
        return string;
    };

    //替换所有的空格
    var trim = function (content) {
        var string = content;
        try {
            string = string.replace(/ /g, "&nbsp;")
        } catch (e) {
            alert(e.message);
        }
        return string;
    };

    //更新最近聊天的位置
    var updateMyChart = function ($this, arr, i, ing) {
        $("#" + id + i).remove();
        $($this).prepend('<li id="' + id + i + '">' + arr[0] + '</li>');
        $('#' + id + i).click(function () {
            titleNewChart('title_' + id + ing, arr[0], arr[1]);
        });
        hoverChart('#' + id + i);//给经过触发
    };

    //发送消息
    var sendMsg = function () {
        $("#mid_sand").click(function () {
            if ($(".list").length < 1) {
                layer.msg('请选择聊天室！');
                return false;
            }

            var msg = $("#texterea").val();
            if (msg) {
                ws.send(toJson("message", msg, nowChart));
            } else {
                layer.msg('你输入的内容为空');
            }
            $("#texterea").focus();//光标焦点
        })
    };

    //时间
    var myTime = function () {
        var now = (new Date()).getHours();
        if (now > 0 && now <= 6) {
            return "午夜好";
        } else if (now > 6 && now <= 11) {
            return "早上好";
        } else if (now > 11 && now <= 14) {
            return "中午好";
        } else if (now > 14 && now <= 18) {
            return "下午好";
        } else {
            return "晚上好";
        }
    };

    return {
        init: function () {
            loadChart();
            initScroll();
            leftMenu();
            liulanqi();
        }
    };
}();

$(function () {
    chart.init();
});