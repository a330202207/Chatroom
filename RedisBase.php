<?php
/**
 * 通过redis基础类，处理redis连接
 */
class RedisBase
{
    protected $redis;   //redis对象
    private $host;      //Redis服务器ip地址
    private $port;      //Redis服务器端口
    private $auth;      //Redis密码
    public function __construct()
    {
        $this->initConfig();
        try {
            $this->redis = new Redis();
            $rCon = $this->redis->connect($this->host, $this->port);
            if (!$rCon) {
                throw new Exception('连接 Redis 服务器失败！host:' . $this->host . '，port:' . $this->port);
            }
            $this->redis->auth($this->auth);
        } catch (Exception $e) {
            throw new Exception('实例化 Redis 对象失败！');
        }
    }
    public function __destruct()
    {
        $this->redis->close();
    }
    private function initConfig()
    {
        $this->host = 'localhost';
        $this->port = '6379';
        $this->auth = '';
    }
}
