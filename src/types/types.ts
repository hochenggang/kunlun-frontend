
export interface typeRawReport {
    client_id: number; // 客户端 ID
    timestamp: number; // 时间戳
    uptime_s: number; // 系统运行时间（秒）
    load_1min: number; // 1 分钟负载
    load_5min: number; // 5 分钟负载
    load_15min: number; // 15 分钟负载
    running_tasks: number; // 当前运行的任务数
    total_tasks: number; // 总任务数
    cpu_user: number; // CPU 用户态时间
    cpu_system: number; // CPU 系统态时间
    cpu_nice: number; // CPU 优先级调整时间
    cpu_idle: number; // CPU 空闲时间
    cpu_iowait: number; // CPU I/O 等待时间
    cpu_irq: number; // CPU 硬中断时间
    cpu_softirq: number; // CPU 软中断时间
    cpu_steal: number; // CPU 被虚拟化窃取的时间
    mem_total_mib: number; // 内存总量（MiB）
    mem_free_mib: number; // 空闲内存（MiB）
    mem_used_mib: number; // 已用内存（MiB）
    mem_buff_cache_mib: number; // 缓冲区和缓存占用的内存（MiB）
    tcp_connections: number; // TCP 连接数
    udp_connections: number; // UDP 连接数
    default_interface_net_rx_bytes: number; // 默认网络接口接收字节数
    default_interface_net_tx_bytes: number; // 默认网络接口发送字节数
    cpu_num_cores: number; // CPU 核心数
    cpu_delay_us: number; // CPU 延迟（微秒）
    disk_delay_us: number; // 磁盘延迟（微秒）
    root_disk_total_kb: number; // 根磁盘总容量（KB）
    root_disk_avail_kb: number; // 根磁盘可用容量（KB）
    reads_completed: number; // 完成的读操作数
    writes_completed: number; // 完成的写操作数
    reading_ms: number; // 读操作耗时（毫秒）
    writing_ms: number; // 写操作耗时（毫秒）
    iotime_ms: number; // 总 I/O 操作耗时（毫秒）
    ios_in_progress: number; // 当前正在进行的 I/O 操作数
    weighted_io_time: number; // 加权 I/O 时间
    machine_id: string; // 机器唯一标识符
    hostname: string; // 主机名
}

export type typeExtendedReport = typeRawReport & typeEnhancedSystemStats & typeDiskIOStats & typeCpuPercentagesExtend & typeNetExtend & typeMemeryUsageExtend;


export interface typeMemeryUsageExtend {
    mem_really_used_mib: number;
    mem_used_total_percent: number;
    memory_usage_el: React.ReactNode;
}


export interface typeCpuPercentagesExtend {
    /**
     * 用户态 CPU 使用率百分比。
     * 表示运行用户进程所占用的 CPU 时间占比。
     */
    cpu_us_percent: number;

    /**
     * 系统态 CPU 使用率百分比。
     * 表示运行内核进程（系统调用）所占用的 CPU 时间占比。
     */
    cpu_sy_percent: number;

    /**
     * 优先级调整（Nice）CPU 使用率百分比。
     * 表示运行低优先级用户进程所占用的 CPU 时间占比。
     */
    cpu_ni_percent: number;

    /**
     * 空闲 CPU 使用率百分比。
     * 表示 CPU 空闲时间的占比。
     */
    cpu_id_percent: number;

    /**
     * I/O 等待 CPU 使用率百分比。
     * 表示 CPU 在等待 I/O 操作完成时的时间占比。
     */
    cpu_wa_percent: number;

    /**
     * 硬中断 CPU 使用率百分比。
     * 表示处理硬件中断所占用的 CPU 时间占比。
     */
    cpu_hi_percent: number;

    /**
     * 被虚拟化窃取的 CPU 使用率百分比。
     * 表示在虚拟化环境中，被其他虚拟机占用的 CPU 时间占比。
     */
    cpu_st_percent: number;
}


export interface typeNetExtend {
    net_rx_speed_kib: number;
    net_tx_speed_kib: number;
}

export interface typeDiskIOStats {
    disk_reads_per_second: number; // 每秒读取次数
    disk_writes_per_second: number; // 每秒写入次数
    disk_avg_read_latency: number; // 平均读取延迟
    disk_avg_write_latency: number; // 平均写入延迟
    disk_utilization: number; // 磁盘利用率
    disk_weighted_iotime_percent: number; // 加权 I/O 时间占比
}


export interface typeEnhancedSystemStats {
    /**
     * 负载平均值（1 分钟 / 5 分钟 / 15 分钟）
     * 示例：`"0.5/0.7/0.6"`
     */
    load_averages_info: string;

    /**
     * 数据更新时间（格式化后的日期字符串）
     * 示例：`"12:00:00"`
     */
    update_at: string;

    /**
     * 任务信息（运行中的任务数 / 总任务数）
     * 示例：`"5/100"`
     */
    tasks_info: string;

    /**
     * 连接信息（TCP 连接数 / UDP 连接数）
     * 示例：`"10/5"`
     */
    connection_info: string;

    // 根磁盘使用率（百分比）
    root_disk_useage_el: React.ReactNode;

    // 是否离线（布尔值）
    is_offline: boolean;

    uptime_days: number;
    // '总流量 (接收/发送)', 'G', '服务器自上次启动以来的网络总流量，包括接收和发送的数据量'
    traffic_info:string;
}

export type typeTitles = Record<keyof typeExtendedReport, [string, string, string]>;
