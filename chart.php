<?php

require_once ("RedisBase.php");
require_once ("RedisAction.php");

class Chat
{
    const HOST = '0.0.0.0';     //ip地址 0.0.0.0代表接受所有ip的访问
    const PART = 9995;          //端口号
    private $server = null;     //单例存放websocket_server对象

    private $room;

    protected $redis;
    protected $userList = "UserOnlineList";
    protected $roomName = "defaultRoom";
    protected $roomListName = "RoomList";
    protected $table;

    public function __construct()
    {
        //实例化swoole_websocket_server并存储在我们Chat类中的属性上，达到单例的设计
        $this->server = new swoole_websocket_server(self::HOST, self::PART);
        //监听连接事件
        $this->server->on('open', [$this, 'onOpen']);
        //监听接收消息事件
        $this->server->on('message', [$this, 'onMessage']);
        //监听关闭事件
        $this->server->on('close', [$this, 'onClose']);

        //创建内存表
        $this->createTable();
        $this->redis = new RedisAction();


        $roomList = $this->redis->sMembers($this->roomListName);

        //主程序启动 清空所有聊天室在线用户
        if (!empty($roomList) && is_array($roomList)) {
            foreach ($roomList as $room) {
                $this->redis->del("{$this->userList}_{$room}");
            }
        }

        //开启服务
        $this->server->start();
    }

    /**
     * @notes: 创建内存表
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @version: 1.0
     */
    protected function createTable()
    {
        $this->table = new swoole_table(1024);
        $this->table->column('fd', swoole_table::TYPE_INT);
        $this->table->column('nick_name', swoole_table::TYPE_STRING, 255);
        $this->table->column('avatar', swoole_table::TYPE_STRING, 255);
        $this->table->column('room', swoole_table::TYPE_STRING, 100);
        $this->table->create();
    }

    /**
     * @notes: 连接成功回调函数
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $request
     * @version: 1.0
     */
    public function onOpen($server, $request)
    {
        echo $request->fd . '连接了' . PHP_EOL;//打印到我们终端
    }

    /**
     * @notes: 接收到信息的回调函数
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $frame
     * @throws Exception
     * @version: 1.0
     */
    public function onMessage($server, $frame)
    {
        if (!empty($frame) && $frame->opcode == 1 && $frame->finish == 1) {
            $message = $this->checkMessage($frame->data);
            if (isset($message["type"])) {
                switch ($message["type"]) {
                    case "login":
                        $this->login($server, $frame->fd, $message["message"], $message["room_id"]);
                        break;
                    case "message":
                        $this->serverPush($server, $frame->fd, $message["message"], 'message', $message["room_id"]);
                        break;
                    default:
                }
                $this->redis->sAdd($this->roomListName, $message["room_id"]);
            }
        } else {
            throw new Exception("接收数据不完整");
        }

        echo "receive from {$frame->fd}:{$frame->data},opcode:{$frame->opcode},fin:{$frame->finish}\n";
    }

    /**
     * @notes: 检查发送信息
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $message
     * @return array|bool|mixed
     * @version: 1.0
     */
    protected function checkMessage($message)
    {
        $message = json_decode($message);
        $return_message = [];
        if (!is_array($message) && !is_object($message)) {
            $this->error = "接收的message数据格式不正确";
            return false;
        }
        if (is_object($message)) {
            foreach ($message as $item => $value) {
                $return_message[$item] = $value;
            }
        } else {
            $return_message = $message;
        }
        if (!isset($return_message["type"]) || !isset($return_message["message"])) {
            return false;
        } else {
            if (!isset($return_message["room_id"])) $return_message["room_id"] = $this->roomName;
            return $return_message;
        }
    }

    /**
     * @notes: 登录
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $frame_fd
     * @param $nick_name
     * @param $room_id
     * @version: 1.0
     */
    protected function login($server, $frame_fd, $nick_name, $room_id)
    {
        $user_info = [];
        $user_info["fd"] = $frame_fd;
        $user_info["room"] = $room_id;
        $user_info["nick_name"] = $nick_name;

        $this->updateFrameFd($frame_fd, $user_info);
        $this->createRoomUserList($server, $room_id, $frame_fd, $nick_name);
        /* $server->push($frame_fd, json_encode(
                 ['user' => $user_info, 'all' => $this->allUserByRoom($room_id),'type' => 'openSuccess'])
         );*/

        $this->serverPush($server, $frame_fd, "【{$user_info['nick_name']}】进入聊天室", 'open');
    }

    /**
     * @notes: 更新连接信息
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $frame_fd
     * @param $user_info
     * @version: 1.0
     */
    protected function updateFrameFd($frame_fd, $user_info)
    {
        //内存表里将临时链接客户端与用户信息存入
        $this->table->set($frame_fd, $user_info);
    }

    /**
     * @notes: 创建连接房间
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $room_id
     * @param $frame_fd
     * @param $nick_name
     * @version: 1.0
     */
    protected function createRoomUserList($server, $room_id, $frame_fd, $nick_name)
    {
        try {
            $fd = $this->redis->hGet("{$this->userList}_{$room_id}", $nick_name);
            if (isset($fd) && empty($fd)) {
                $user = $this->table->get($fd);
                if (isset($user)) {
                    $this->serverPush($server, $fd, "【{$user['nick_name']}】离开聊天室", 'close');
                    $this->table->del($fd);
                }
                $server->close($fd);

            }
            //将链接用户名与对应房间号存入redis
            //UserOnlineList_title_chart1  张三 1
            $this->redis->hset("{$this->userList}_{$room_id}", $nick_name, $frame_fd);
        } catch (Exception $e) {
            echo $e->getMessage();
        }
    }

    /**
     * @notes: 发送信息
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $frame_fd
     * @param string $message
     * @param string $message_type
     * @version: 1.0
     */
    protected function serverPush($server, $frame_fd, $message = "", $message_type = "message")
    {

        $push_list = $this->getPushListByFd($frame_fd);
        $message = htmlspecialchars($message);
        $datetime = date('Y-m-d H:i:s', time());
        $user_info = $this->table->get($frame_fd);
        if (!empty($user_info)) {
            foreach ($push_list as $fd) {
                /*if ($fd == $frame_fd) {       //点对点聊天
                    continue;
                }*/
                echo "frame_fd: {$fd},type: {$message_type},message: {$message},datetime: {$datetime}\n";
                $server->push($fd, json_encode([
                        'type' => $message_type,
                        'message' => $message,
                        'datetime' => $datetime,
                        'user' => $user_info,
                    ])
                );
            }
        }
    }

    /**
     * @notes: 获取聊天室里连接信息
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $fd
     * @return array
     * @version: 1.0
     */
    protected function getPushListByFd($fd)
    {

        $userInfo = $this->table->get($fd);

        $room = $userInfo['room'];
        if (empty($room)) {
            return [];
        }
        return $this->redis->hGetAll("{$this->userList}_{$room}");
    }

    /**
     * @notes: 登出
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $server
     * @param $fd
     * @version: 1.0
     */
    protected function logout($server, $fd)
    {
        $user = $this->table->get($fd);
        if (isset($user)) {
            $this->serverPush($server, $fd, "【{$user['nick_name']}】离开聊天室", 'close');
            $this->deleteRoomUserList($user["room"], $user["nick_name"]);
            $this->table->del($fd);
        }
    }

    /**
     * @notes: 删除聊天室连接信息
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/7
     * @param $room
     * @param $nick_name
     * @version: 1.0
     */
    protected function deleteRoomUserList($room, $nick_name)
    {
        $this->redis->hdel("{$this->userList}_{$room}", $nick_name);
    }

    /**
     * @notes: 断开连接回调函数
     * @author: NedRen<ned@pproject.co>
     * @date: 2019/1/8
     * @param $server
     * @param $fd
     * @version: 1.0
     */
    public function onClose($server, $fd)
    {
        $this->logout($server, $fd);
        $server->close($fd);
        echo $fd . '走了' . PHP_EOL;//打印到我们终端
    }

}
$obj = new Chat();
