import type { typeExtendedReport, typeRawReport, typeMemeryUsageExtend, typeCpuPercentagesExtend, typeNetExtend, typeDiskIOStats, typeEnhancedSystemStats } from '../types/types';

import { PercentageInfo } from '../components/Percentag';

const toFloat = (num: number) => Math.round(num * 100) / 100;

export const BtoGB = (bytes: number) => toFloat(bytes / 1024 / 1024 / 1024);
export const usagePercentage = (used: number, total: number) => toFloat(used / total);
export const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();
export const isOutdated = (timestamp: number) => Math.floor(Date.now() / 1000) - timestamp > 1 * 60;


export const generateEnhancedReport = (
  current: typeRawReport,
  previous: typeRawReport | null
): typeExtendedReport => {

  // 补充一些杂项
  const enhancedStats: typeEnhancedSystemStats = {
    load_averages_info: `${current.load_1min}/${current.load_5min}/${current.load_15min}`, // 负载平均值
    update_at: formatTime(current.timestamp), // 更新时间
    traffic_info: `${BtoGB(current.default_interface_net_rx_bytes)}/${BtoGB(current.default_interface_net_tx_bytes)}`,
    tasks_info: `${current.running_tasks}/${current.total_tasks}`, // 任务信息
    connection_info: `${current.tcp_connections}/${current.udp_connections}`, // 连接信息
    root_disk_useage_el: PercentageInfo({
      used: BtoGB((current.root_disk_total_kb - current.root_disk_avail_kb) * 1024),
      total: BtoGB(current.root_disk_total_kb * 1024),
      unit: 'G'
    }) as React.ReactNode,
    is_offline: isOutdated(current.timestamp), // 是否离线
    uptime_days: Math.round((current.uptime_s / 3600 / 24) * 100) / 100, // 运行时间（天）
  };

  // 合并数据
  return {
    ...current,
    ...enhancedStats,
    ...calculateUsedMemParcent(current),
    ...calculateCpuPercentages(current, previous),
    ...calculateNetworkSpeed(current, previous),
    ...calculateIOData(current, previous),
  };

};




const calculateAndNormalizeKeys = (obj: any, keys: string[]) => {
  const total = keys.reduce((sum, key) => sum + (obj[key] || 0), 0);
  keys.forEach(key => {
    if (obj[key] !== undefined) {
      obj[key] = parseFloat(((obj[key] / total) * 100).toFixed(2));
    }
  });
  return obj;
};



const calculateUsedMemParcent = (current: typeRawReport): typeMemeryUsageExtend => {
  // 计算内存的真实占用，实际上 Linux 内存占用 = 内存总量 - 空闲内存 - 缓冲区 - 缓存区
  // 其实 current.mem_buff_cache_mib 也是真正占用了内存的，只是并不是真正的用户态程序占用的
  const mem_really_used_mib = (current.mem_total_mib - (current.mem_free_mib + current.mem_buff_cache_mib));
  return {
    mem_really_used_mib,
    mem_used_total_percent: toFloat(mem_really_used_mib / current.mem_total_mib),
    memory_usage_el: PercentageInfo({
      used: (mem_really_used_mib / 1024),
      total: (current.mem_total_mib / 1024),
      unit: 'G'
    }) as React.ReactNode,
  };
};


const calculateCpuPercentages = (
  current: typeRawReport,
  previous: typeRawReport | null
): typeCpuPercentagesExtend => {

  // 计算每个字段的差值，如果没有上一个数据，那么直接计算开机以来的CPU使用情况
  const diff = {
    cpu_us: current.cpu_user - (previous ? previous.cpu_user : 0),
    cpu_sy: current.cpu_system - (previous ? previous.cpu_system : 0),
    cpu_ni: current.cpu_nice - (previous ? previous.cpu_nice : 0),
    cpu_id: current.cpu_idle - (previous ? previous.cpu_idle : 0),
    cpu_wa: current.cpu_iowait - (previous ? previous.cpu_iowait : 0),
    cpu_hi: current.cpu_irq - (previous ? previous.cpu_irq : 0),
    cpu_st: current.cpu_steal - (previous ? previous.cpu_steal : 0),
  };

  // 计算总差值
  const total = Object.values(diff).reduce((sum, value) => sum + value, 0);

  return {
    cpu_us_percent: total > 0 ? toFloat((diff.cpu_us / total)) : 0,
    cpu_sy_percent: total > 0 ? toFloat((diff.cpu_sy / total)) : 0,
    cpu_ni_percent: total > 0 ? toFloat((diff.cpu_ni / total)) : 0,
    cpu_id_percent: total > 0 ? toFloat((diff.cpu_id / total)) : 0,
    cpu_wa_percent: total > 0 ? toFloat((diff.cpu_wa / total)) : 0,
    cpu_hi_percent: total > 0 ? toFloat((diff.cpu_hi / total)) : 0,
    cpu_st_percent: total > 0 ? toFloat((diff.cpu_st / total)) : 0,
  }
}


const calculateNetworkSpeed = (
  current: typeRawReport,
  previous: typeRawReport | null
): typeNetExtend => {
  const timeDiff = current.timestamp - (previous ? previous.timestamp : current.timestamp);
  // 计算流量差值，如果没有上一次的记录，记为 0
  const diffRx = current.default_interface_net_rx_bytes - (previous ? previous.default_interface_net_rx_bytes : current.default_interface_net_rx_bytes);
  const diffTx = current.default_interface_net_tx_bytes - (previous ? previous.default_interface_net_tx_bytes : current.default_interface_net_tx_bytes);
  // Byte 转为 Kib 输出
  return {
    // net_rx_speed_kib: diffRx > 0 ? diffRx : 0,
    net_rx_speed_kib: diffRx > 0 ? toFloat((diffRx / 1024 / timeDiff)) : 0,
    net_tx_speed_kib: diffTx > 0 ? toFloat((diffTx / 1024 / timeDiff)) : 0,
  };
};


const calculateIOData = (
  current: typeRawReport,
  previous: typeRawReport | null
): typeDiskIOStats => {
  // 如果没有前一个数据点，返回全为 0 的结果
  if (!previous) {
    return {
      disk_reads_per_second: 0,
      disk_writes_per_second: 0,
      disk_avg_read_latency: 0,
      disk_avg_write_latency: 0,
      disk_utilization: 0,
      disk_weighted_iotime_percent: 0,
    };
  }

  // 计算时间差（秒）
  const timeDiff = current.timestamp - previous.timestamp

  // 避免除以零的情况
  const safeDivide = (numerator: number, denominator: number) =>
    denominator > 0 ? toFloat(numerator / denominator) : 0;

  // 计算每秒读写次数
  const disk_reads_per_second = safeDivide(
    current.reads_completed - previous.reads_completed,
    timeDiff
  );
  const disk_writes_per_second = safeDivide(
    current.writes_completed - previous.writes_completed,
    timeDiff
  );

  // 计算平均读写延迟
  const disk_avg_read_latency = safeDivide(
    current.reading_ms,
    current.reads_completed
  );
  const disk_avg_write_latency = safeDivide(
    current.writing_ms,
    current.writes_completed
  );

  // 计算磁盘利用率（百分比）
  const disk_utilization = toFloat(safeDivide(
    current.iotime_ms - previous.iotime_ms,
    timeDiff * 1000
  ));

  // 计算加权 I/O 时间占比（百分比）
  const disk_weighted_iotime_percent = toFloat(safeDivide(
    current.weighted_io_time,
    current.iotime_ms
  ));

  // 返回结果
  return {
    disk_reads_per_second,
    disk_writes_per_second,
    disk_avg_read_latency,
    disk_avg_write_latency,
    disk_utilization,
    disk_weighted_iotime_percent,
  };
};


export {
  calculateAndNormalizeKeys, calculateUsedMemParcent,
  toFloat
}